import { EDITOR_API } from '../constants/app';
import { readFileAsDataUrl } from './image';
import { assertMenuDataset } from './menu-data';
import type { MenuDataset } from '../types/dish';

const parseJsonResponse = async (response: Response) => {
  const rawText = await response.text();
  let payload: Record<string, unknown> = {};

  try {
    payload = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : '本地编辑接口不可用，请用 `npm run editor` 打开编辑页。';
    throw new Error(message);
  }

  return payload;
};

export const loadEditorDataset = async () => {
  const response = await fetch(EDITOR_API.dataset, {
    cache: 'no-store',
  });
  const payload = await parseJsonResponse(response);

  return assertMenuDataset(payload.dataset);
};

export const saveEditorDataset = async (dataset: MenuDataset) => {
  const response = await fetch(EDITOR_API.dataset, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataset }),
  });
  const payload = await parseJsonResponse(response);

  return assertMenuDataset(payload.dataset);
};

export const uploadEditorImage = async (file: File) => {
  const response = await fetch(EDITOR_API.uploadImage, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName: file.name,
      dataUrl: await readFileAsDataUrl(file),
    }),
  });
  const payload = await parseJsonResponse(response);

  if (typeof payload.imagePath !== 'string') {
    throw new Error('图片上传失败，服务端没有返回图片路径。');
  }

  return payload.imagePath;
};
