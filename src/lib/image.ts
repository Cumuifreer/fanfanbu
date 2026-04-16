export const validateImageFile = (file: File, maxSizeMb: number) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件。');
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    throw new Error(`图片不能超过 ${maxSizeMb}MB，请换一张更小的图片。`);
  }
};

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('图片读取失败，请重新选择。'));
    };

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('图片读取失败，请重新选择。'));
        return;
      }

      resolve(reader.result);
    };

    reader.readAsDataURL(file);
  });
