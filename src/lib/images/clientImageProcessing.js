const CLIENT_MAX_WIDTH = 1920;
const CLIENT_MAX_HEIGHT = 1920;
const CLIENT_QUALITY = 0.8;

export async function clientProcessImage(file) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = URL.createObjectURL(file);
  });

  let { width, height } = img;
  if (width > CLIENT_MAX_WIDTH || height > CLIENT_MAX_HEIGHT) {
    const ratio = Math.min(
      CLIENT_MAX_WIDTH / width,
      CLIENT_MAX_HEIGHT / height,
      1,
    );
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  URL.revokeObjectURL(img.src);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      CLIENT_QUALITY,
    );
  });
}
