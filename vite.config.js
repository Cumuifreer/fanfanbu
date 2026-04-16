import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const publicDir = path.join(projectRoot, 'public');
const lanHost = '0.0.0.0';
const pagesBase = '/fanfanbu/';
const datasetFile = path.join(publicDir, 'data', 'dishes.json');
const uploadDir = path.join(publicDir, 'menu-images', 'uploads');
const managedImagePrefix = './menu-images/uploads/';
const publishBranch = 'main';
const managedPublishPaths = ['public/data/dishes.json', 'public/menu-images/uploads'];
const allowedCategories = new Set(['red', 'white', 'set_meal']);
const mimeExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
  ['image/avif', 'avif'],
  ['image/svg+xml', 'svg'],
]);

const sortDishes = (dishes) =>
  [...dishes].sort(
    (left, right) => Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || ''),
  );

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isDish = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof value.id === 'string' &&
  typeof value.name === 'string' &&
  allowedCategories.has(value.category) &&
  isStringArray(value.ingredients) &&
  isStringArray(value.recipeSteps) &&
  (typeof value.image === 'string' || value.image === null) &&
  typeof value.createdAt === 'string' &&
  typeof value.updatedAt === 'string';

const isDataset = (value) =>
  Boolean(value) &&
  typeof value === 'object' &&
  typeof value.updatedAt === 'string' &&
  Array.isArray(value.dishes) &&
  value.dishes.every(isDish);

const normalizeDataset = (dataset) => ({
  updatedAt: dataset.updatedAt,
  dishes: sortDishes(dataset.dishes),
});

const ensureEditorStorage = async () => {
  await fs.mkdir(path.dirname(datasetFile), { recursive: true });
  await fs.mkdir(uploadDir, { recursive: true });
};

const readDataset = async () => {
  await ensureEditorStorage();

  try {
    const raw = await fs.readFile(datasetFile, 'utf8');
    const parsed = JSON.parse(raw);

    if (!isDataset(parsed)) {
      throw new Error('菜单数据文件格式不正确，请检查 public/data/dishes.json。');
    }

    return normalizeDataset(parsed);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return {
        updatedAt: new Date().toISOString(),
        dishes: [],
      };
    }

    throw error;
  }
};

const writeDataset = async (dataset) => {
  const normalized = normalizeDataset(dataset);
  await ensureEditorStorage();
  await fs.writeFile(datasetFile, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
};

const readJsonBody = async (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('请求体不是有效的 JSON。'));
      }
    });

    req.on('error', reject);
  });

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const createGitError = (stage, message) => {
  const error = new Error(message);
  error.stage = stage;
  return error;
};

const runGitCommand = (args, stage) =>
  new Promise((resolve, reject) => {
    execFile(
      'git',
      args,
      {
        cwd: projectRoot,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            createGitError(
              stage,
              stderr.trim() || stdout.trim() || error.message || 'Git 命令执行失败。',
            ),
          );
          return;
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      },
    );
  });

const formatPublishTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const humanizePublishError = (error) => {
  const stage =
    error && typeof error === 'object' && 'stage' in error ? error.stage : 'unknown';
  const rawMessage = error instanceof Error ? error.message : 'Git 发布失败。';

  if (/not a git repository/i.test(rawMessage)) {
    return '当前目录不是 Git 仓库，暂时无法自动发布。';
  }

  if (/could not read username|authentication failed|permission denied|repository not found/i.test(rawMessage)) {
    return '已经保存到本地，但推送到 GitHub 失败。请先确认这台电脑已经完成 GitHub 认证，并且 `git push` 可以正常使用。';
  }

  if (/please tell me who you are|unable to auto-detect email address/i.test(rawMessage)) {
    return '已经保存到本地，但这台电脑还没有配置 Git 提交身份。请先设置 git 用户名和邮箱。';
  }

  if (/failed to push some refs|non-fast-forward|fetch first|rejected/i.test(rawMessage)) {
    return '已经保存到本地，但推送被 GitHub 拒绝了。请先同步远程 main 分支，再重新发布。';
  }

  if (/no such remote|does not appear to be a git repository|could not read from remote repository/i.test(rawMessage)) {
    return '已经保存到本地，但没有找到可用的 GitHub 远程仓库 origin。';
  }

  if (stage === 'branch') {
    return `为了避免推错分支，保存并发布只会推送 ${publishBranch}。请先切回 ${publishBranch} 分支后再试。`;
  }

  if (stage === 'add') {
    return '已经保存到本地，但整理要发布的菜单文件时失败了，请稍后再试。';
  }

  if (stage === 'commit') {
    return '已经保存到本地，但生成 Git 提交失败了，请检查这台电脑的 Git 设置。';
  }

  if (stage === 'push') {
    return '已经保存到本地，但推送到 GitHub 失败了，请检查网络和 GitHub 认证。';
  }

  return `已经保存到本地，但发布失败了：${rawMessage}`;
};

const listManagedChanges = async () => {
  const { stdout } = await runGitCommand(
    ['status', '--porcelain', '--', ...managedPublishPaths],
    'status',
  );

  return stdout;
};

const publishManagedChanges = async () => {
  const initialChanges = await listManagedChanges();

  if (!initialChanges) {
    return {
      status: 'no_changes',
      message: '当前没有新的菜单改动需要发布。',
    };
  }

  const branchResult = await runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], 'branch');

  if (branchResult.stdout !== publishBranch) {
    throw createGitError(
      'branch',
      `当前分支是 ${branchResult.stdout || '未知分支'}，不是 ${publishBranch}。`,
    );
  }

  await runGitCommand(['add', '-A', '--', ...managedPublishPaths], 'add');

  const { stdout: stagedChanges } = await runGitCommand(
    ['diff', '--cached', '--name-only', '--', ...managedPublishPaths],
    'status',
  );

  if (!stagedChanges) {
    return {
      status: 'no_changes',
      message: '当前没有新的菜单改动需要发布。',
    };
  }

  const commitMessage = `update menu data ${formatPublishTimestamp()}`;

  await runGitCommand(
    ['commit', '--only', '-m', commitMessage, '--', ...managedPublishPaths],
    'commit',
  );
  await runGitCommand(['push', 'origin', publishBranch], 'push');

  return {
    status: 'published',
    message: 'GitHub Pages 稍后会自动更新。',
    branch: publishBranch,
    commitMessage,
  };
};

const collectManagedImages = (dataset) =>
  new Set(
    dataset.dishes
      .map((dish) => dish.image)
      .filter(
        (imagePath) =>
          typeof imagePath === 'string' && imagePath.startsWith(managedImagePrefix),
      ),
  );

const cleanupOrphanImages = async (currentDataset, nextDataset) => {
  const currentImages = collectManagedImages(currentDataset);
  const nextImages = collectManagedImages(nextDataset);

  await Promise.all(
    [...currentImages]
      .filter((imagePath) => !nextImages.has(imagePath))
      .map((imagePath) =>
        fs.rm(path.join(publicDir, imagePath.replace(/^\.\//u, '')), {
          force: true,
        }),
      ),
  );
};

const buildSafeFileName = (fileName, extension) => {
  const baseName = String(fileName || 'dish-image')
    .replace(/\.[^.]+$/u, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 36);

  return `${Date.now()}-${baseName || 'dish-image'}.${extension}`;
};

const saveUploadedImage = async ({ fileName, dataUrl }) => {
  if (typeof dataUrl !== 'string') {
    throw new Error('缺少图片数据。');
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/u.exec(dataUrl);

  if (!match) {
    throw new Error('图片数据格式不正确。');
  }

  const [, mimeType, base64Data] = match;
  const extension = mimeExtensions.get(mimeType);

  if (!extension) {
    throw new Error('暂不支持这种图片格式。');
  }

  await ensureEditorStorage();

  const savedName = buildSafeFileName(fileName, extension);
  await fs.writeFile(path.join(uploadDir, savedName), Buffer.from(base64Data, 'base64'));

  return `${managedImagePrefix}${savedName}`;
};

const createEditorFileApiPlugin = () => ({
  name: 'fanfanbu-editor-file-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;

      try {
        if (pathname === '/api/editor/dataset') {
          if (req.method === 'GET') {
            sendJson(res, 200, { dataset: await readDataset() });
            return;
          }

          if (req.method === 'POST') {
            const payload = await readJsonBody(req);
            const nextDataset = payload?.dataset;

            if (!isDataset(nextDataset)) {
              sendJson(res, 400, {
                error: '提交的数据格式不正确，请检查字段是否完整。',
              });
              return;
            }

            const currentDataset = await readDataset();
            const normalizedDataset = normalizeDataset(nextDataset);
            await cleanupOrphanImages(currentDataset, normalizedDataset);
            const savedDataset = await writeDataset(normalizedDataset);
            sendJson(res, 200, { dataset: savedDataset });
            return;
          }

          sendJson(res, 405, { error: '当前方法不被支持。' });
          return;
        }

        if (pathname === '/api/editor/upload-image') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: '当前方法不被支持。' });
            return;
          }

          const payload = await readJsonBody(req);
          const imagePath = await saveUploadedImage(payload || {});
          sendJson(res, 200, { imagePath });
          return;
        }

        if (pathname === '/api/editor/publish') {
          if (req.method !== 'POST') {
            sendJson(res, 405, { error: '当前方法不被支持。' });
            return;
          }

          const result = await publishManagedChanges();
          sendJson(res, 200, { result });
          return;
        }
      } catch (error) {
        const message =
          req.url?.includes('/api/editor/publish')
            ? humanizePublishError(error)
            : error instanceof Error
              ? error.message
              : '本地文件操作失败，请稍后再试。';
        sendJson(res, 500, { error: message });
        return;
      }

      next();
    });
  },
});

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : pagesBase,
  server: {
    host: lanHost,
  },
  preview: {
    host: lanHost,
  },
  build: {
    rollupOptions: {
      input: {
        main: path.join(projectRoot, 'index.html'),
        editor: path.join(projectRoot, 'editor.html'),
      },
    },
  },
  plugins: [react(), createEditorFileApiPlugin()],
}));
