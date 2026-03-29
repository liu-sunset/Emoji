import { removeBackground } from '@imgly/background-removal';

export interface SliceResult {
  blob: Blob;
  index: number;
}

export interface ProcessedResult {
  blob: Blob;
  index: number;
  hasMatting: boolean;
}

export interface MattingBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const ROWS = 3;
const COLS = 2;
const SPLIT_OFFSET = 0.1;

function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = imageUrl;
  });
}

function sliceImageByGrid(imageUrl: string): Promise<SliceResult[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const img = await loadImage(imageUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 Canvas 上下文'));
        return;
      }

      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const offsetX = imgWidth * SPLIT_OFFSET;
      const adjustedWidth = imgWidth - offsetX;
      const cellWidth = adjustedWidth / COLS;
      const cellHeight = imgHeight / ROWS;

      const results: SliceResult[] = [];

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const index = row * COLS + col;
          const sx = offsetX + col * cellWidth;
          const sy = row * cellHeight;

          canvas.width = cellWidth;
          canvas.height = cellHeight;

          ctx.drawImage(img, sx, sy, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight);

          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/png', 1.0)
          );

          if (blob) {
            results.push({ blob, index });
          } else {
            reject(new Error(`第 ${index + 1} 张切片生成失败`));
            return;
          }
        }
      }

      results.sort((a, b) => a.index - b.index);
      resolve(results);
    } catch (err) {
      reject(err);
    }
  });
}

function extractBoundsFromImageData(imageData: ImageData): { minX: number; minY: number; maxX: number; maxY: number } {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

function cropCanvasToBounds(canvas: HTMLCanvasElement, padding: number): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = extractBoundsFromImageData(imageData);

  if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) {
    return canvas;
  }

  const paddingX = Math.max(padding, Math.floor((bounds.maxX - bounds.minX) * 0.1));
  const paddingY = Math.max(padding, Math.floor((bounds.maxY - bounds.minY) * 0.1));

  const newMinX = Math.max(0, bounds.minX - paddingX);
  const newMinY = Math.max(0, bounds.minY - paddingY);
  const newMaxX = Math.min(canvas.width, bounds.maxX + paddingX);
  const newMaxY = Math.min(canvas.height, bounds.maxY + paddingY);

  const newWidth = newMaxX - newMinX;
  const newHeight = newMaxY - newMinY;

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = newWidth;
  resultCanvas.height = newHeight;
  const resultCtx = resultCanvas.getContext('2d');

  if (resultCtx) {
    resultCtx.drawImage(
      canvas,
      newMinX, newMinY, newWidth, newHeight,
      0, 0, newWidth, newHeight
    );
  }

  return resultCanvas;
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * 使用 AI 移除图片背景，实现真正的透明背景
 * @param blob 输入图片 Blob
 * @returns 移除背景后的图片 Blob
 */
export async function removeImageBackground(blob: Blob): Promise<Blob> {
  try {
    const result = await removeBackground(blob);
    return result;
  } catch (err) {
    console.error('背景移除失败:', err);
    throw err;
  }
}

export async function processAllCells(imageUrl: string): Promise<ProcessedResult[]> {
  const slices = await sliceImageByGrid(imageUrl);
  const processedResults: ProcessedResult[] = [];

  for (const slice of slices) {
    try {
      const img = await blobToImage(slice.blob);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const croppedCanvas = cropCanvasToBounds(canvas, 40);

        const blob = await new Promise<Blob | null>((resolve) => {
          croppedCanvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (blob) {
          processedResults.push({ blob, index: slice.index, hasMatting: true });
        }
      }

      URL.revokeObjectURL(img.src);
    } catch (err) {
      console.error(`处理第 ${slice.index} 个格子失败:`, err);
    }
  }

  processedResults.sort((a, b) => a.index - b.index);
  return processedResults;
}

export async function sliceAndProcessImage(imageUrl: string): Promise<ProcessedResult[]> {
  return processAllCells(imageUrl);
}

export async function sliceImageOnly(imageUrl: string): Promise<SliceResult[]> {
  return sliceImageByGrid(imageUrl);
}

export async function processImageWithCustomBounds(
  imageUrl: string,
  boundsMap: Map<number, MattingBounds>
): Promise<ProcessedResult[]> {
  const slices = await sliceImageByGrid(imageUrl);
  const processedResults: ProcessedResult[] = [];

  for (const slice of slices) {
    try {
      const img = await blobToImage(slice.blob);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(img, 0, 0);

        const bounds = boundsMap.get(slice.index);
        let resultCanvas: HTMLCanvasElement;

        if (bounds) {
          const paddingX = Math.max(20, Math.floor((bounds.maxX - bounds.minX) * 0.1));
          const paddingY = Math.max(20, Math.floor((bounds.maxY - bounds.minY) * 0.1));

          const newMinX = Math.max(0, bounds.minX - paddingX);
          const newMinY = Math.max(0, bounds.minY - paddingY);
          const newMaxX = Math.min(canvas.width, bounds.maxX + paddingX);
          const newMaxY = Math.min(canvas.height, bounds.maxY + paddingY);

          const newWidth = newMaxX - newMinX;
          const newHeight = newMaxY - newMinY;

          resultCanvas = document.createElement('canvas');
          resultCanvas.width = newWidth;
          resultCanvas.height = newHeight;
          const resultCtx = resultCanvas.getContext('2d');

          if (resultCtx) {
            resultCtx.drawImage(
              canvas,
              newMinX, newMinY, newWidth, newHeight,
              0, 0, newWidth, newHeight
            );
          }
        } else {
          resultCanvas = canvas;
        }

        const blob = await new Promise<Blob | null>((resolve) => {
          resultCanvas.toBlob(resolve, 'image/png', 1.0);
        });

        if (blob) {
          processedResults.push({
            blob,
            index: slice.index,
            hasMatting: !!bounds
          });
        }
      }

      URL.revokeObjectURL(img.src);
    } catch (err) {
      console.error(`处理第 ${slice.index} 个格子失败:`, err);
      processedResults.push({
        blob: slice.blob,
        index: slice.index,
        hasMatting: false
      });
    }
  }

  processedResults.sort((a, b) => a.index - b.index);
  return processedResults;
}
