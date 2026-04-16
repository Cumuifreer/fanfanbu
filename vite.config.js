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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '本地文件操作失败，请稍后再试。';
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
