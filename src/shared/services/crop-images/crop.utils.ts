const THUMB_QUALITY = 0.92;
const THUMB_SHARPEN = 0.2;

//========== NETTETÉ (UNSHARP LÉGER, À L'ÉCHELLE D'AFFICHAGE) ==========//

function sharpenCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number): void {
  const src = ctx.getImageData(0, 0, width, height);
  const out = ctx.createImageData(width, height);
  const s = src.data;
  const d = out.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const i = p + c;
        const up = y > 0 ? s[i - width * 4] : s[i];
        const down = y < height - 1 ? s[i + width * 4] : s[i];
        const left = x > 0 ? s[i - 4] : s[i];
        const right = x < width - 1 ? s[i + 4] : s[i];
        const v = s[i] * (1 + 4 * amount) - amount * (up + down + left + right);
        d[i] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      d[p + 3] = s[p + 3];
    }
  }

  ctx.putImageData(out, 0, 0);
}
const COMPRESS_MAX_WIDTH = 1200;
const COMPRESS_QUALITY = 0.85;
const COMPRESS_THRESHOLD = 500 * 1024;
const TRIM_LUMINANCE = 80;
const TRIM_MIN_BRIGHT = 5;
const TRIM_MIN_AREA_RATIO = 0.3;

//========== RATIOS DE CROP PAR TYPE DE CARTE (PROPORTION DE LA LARGEUR TRIMÉE) ==========//

export const CROP_RATIOS = {
  itemCard: { size: 0.130, x: 0.044, y: 0.063, aspect: 1, thumbWidth: 80 },
  bestiaireCard: { size: 0.344, x: 0.031, y: 0.042, aspect: 1.456, thumbWidth: 240 }
} as const;

//========== DÉTECTION DU CADRE D'ICÔNE (CARTES ITEM, COIN HAUT-GAUCHE) ==========//

const ICON_LUMINANCE = 180;
const ICON_ZONE_W = 0.20;
const ICON_ZONE_H = 0.25;
const ICON_MIN_RATIO = 0.05;
const ICON_MAX_RATIO = 0.40;

export function detectIconCrop(imgElement: HTMLImageElement): { x: number; y: number; size: number } | null {
  const nw = imgElement.naturalWidth;
  const nh = imgElement.naturalHeight;
  if (!nw || !nh || !imgElement.clientWidth) return null;

  const zoneW = Math.round(nw * ICON_ZONE_W);
  const zoneH = Math.round(Math.min(nh, nw * ICON_ZONE_H));

  const canvas = document.createElement('canvas');
  canvas.width = zoneW;
  canvas.height = zoneH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let data: Uint8ClampedArray;
  try {
    ctx.drawImage(imgElement, 0, 0, zoneW, zoneH, 0, 0, zoneW, zoneH);
    data = ctx.getImageData(0, 0, zoneW, zoneH).data;
  } catch {
    return null;
  }

  const rowBright = (y: number): boolean => {
    for (let x = 0; x < zoneW; x++) {
      const i = (y * zoneW + x) * 4;
      if (data[i] > ICON_LUMINANCE || data[i + 1] > ICON_LUMINANCE || data[i + 2] > ICON_LUMINANCE) return true;
    }
    return false;
  };

  let minY = 0;
  while (minY < zoneH && !rowBright(minY)) minY++;
  if (minY >= zoneH) return null;

  let maxY = minY;
  let gap = 0;
  for (let y = minY + 1; y < zoneH && gap <= 2; y++) {
    if (rowBright(y)) {
      maxY = y;
      gap = 0;
    } else {
      gap++;
    }
  }

  let minX = zoneW, maxX = -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = 0; x < zoneW; x++) {
      const i = (y * zoneW + x) * 4;
      if (data[i] > ICON_LUMINANCE || data[i + 1] > ICON_LUMINANCE || data[i + 2] > ICON_LUMINANCE) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) return null;

  const size = Math.max(maxX - minX + 1, maxY - minY + 1);
  if (size < nw * ICON_MIN_RATIO || size > nw * ICON_MAX_RATIO) return null;

  const scale = imgElement.clientWidth / nw;
  return {
    x: Math.round(minX * scale),
    y: Math.round(minY * scale),
    size: Math.round(size * scale)
  };
}

//========== TRIM (CADRAGE SUR LA CARTE, AVANT COMPRESSION) ==========//

export function trimImage(file: File): Promise<File> {
  if (file.type === 'image/gif') {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, w, h).data;

      const rowBright = (y: number): boolean => {
        let count = 0;
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data[i] > TRIM_LUMINANCE || data[i + 1] > TRIM_LUMINANCE || data[i + 2] > TRIM_LUMINANCE) {
            if (++count >= TRIM_MIN_BRIGHT) return true;
          }
        }
        return false;
      };
      const colBright = (x: number): boolean => {
        let count = 0;
        for (let y = 0; y < h; y++) {
          const i = (y * w + x) * 4;
          if (data[i] > TRIM_LUMINANCE || data[i + 1] > TRIM_LUMINANCE || data[i + 2] > TRIM_LUMINANCE) {
            if (++count >= TRIM_MIN_BRIGHT) return true;
          }
        }
        return false;
      };

      let top = 0;
      while (top < h && !rowBright(top)) top++;
      let bottom = h - 1;
      while (bottom > top && !rowBright(bottom)) bottom--;
      let left = 0;
      while (left < w && !colBright(left)) left++;
      let right = w - 1;
      while (right > left && !colBright(right)) right--;

      const boxW = right - left + 1;
      const boxH = bottom - top + 1;
      const untouched = top === 0 && left === 0 && bottom === h - 1 && right === w - 1;
      const tooSmall = boxW * boxH < w * h * TRIM_MIN_AREA_RATIO;

      if (top >= h || untouched || tooSmall) {
        resolve(file);
        return;
      }

      const out = document.createElement('canvas');
      out.width = boxW;
      out.height = boxH;
      const outCtx = out.getContext('2d');
      if (!outCtx) {
        resolve(file);
        return;
      }
      outCtx.drawImage(canvas, left, top, boxW, boxH, 0, 0, boxW, boxH);

      out.toBlob((blob) => {
        if (blob) {
          const name = file.name.replace(/\.\w+$/, '') + '.png';
          resolve(new File([blob], name, { type: 'image/png' }));
        } else {
          resolve(file);
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

//========== COMPRESSION (AVANT UPLOAD) ==========//

export function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif') {
    return Promise.resolve(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const needsResize = img.naturalWidth > COMPRESS_MAX_WIDTH;

      if (!needsResize && file.size <= COMPRESS_THRESHOLD) {
        URL.revokeObjectURL(img.src);
        resolve(file);
        return;
      }

      const scale = needsResize ? COMPRESS_MAX_WIDTH / img.naturalWidth : 1;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(img.src);
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            const name = file.name.replace(/\.\w+$/, '') + '.webp';
            resolve(new File([blob], name, { type: 'image/webp' }));
          } else {
            reject(new Error('Canvas toBlob error'));
          }
        },
        'image/webp',
        COMPRESS_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load error'));
    };

    img.src = URL.createObjectURL(file);
  });
}

//========== CROP THUMBNAIL (FICHIER, COORDONNÉES AFFICHAGE → RÉELLES) ==========//

export function cropThumbnailScaled(
  file: File,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  displayWidth: number,
  displayHeight: number,
  thumbWidth: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const ratioX = img.naturalWidth / displayWidth;
      const ratioY = img.naturalHeight / displayHeight;

      const realCropX = cropX * ratioX;
      const realCropY = cropY * ratioY;
      const realCropWidth = cropWidth * ratioX;
      const realCropHeight = cropHeight * ratioY;

      const canvas = document.createElement('canvas');
      canvas.width = thumbWidth;
      canvas.height = Math.round(thumbWidth * cropHeight / cropWidth);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, realCropX, realCropY, realCropWidth, realCropHeight, 0, 0, canvas.width, canvas.height);
      sharpenCanvas(ctx, canvas.width, canvas.height, THUMB_SHARPEN);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob error'));
          }
        },
        'image/jpeg',
        THUMB_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load error'));
    };

    img.src = URL.createObjectURL(file);
  });
}

//========== CROP THUMBNAIL (IMAGE DÉJÀ AFFICHÉE) ==========//

export async function cropThumbnailFromElement(
  imgElement: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropWidth: number,
  cropHeight: number,
  thumbWidth: number
): Promise<Blob> {
  const ratioX = imgElement.naturalWidth / imgElement.clientWidth;
  const ratioY = imgElement.naturalHeight / imgElement.clientHeight;

  const realCropX = cropX * ratioX;
  const realCropY = cropY * ratioY;
  const realCropWidth = cropWidth * ratioX;
  const realCropHeight = cropHeight * ratioY;

  const response = await fetch(imgElement.src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = thumbWidth;
      canvas.height = Math.round(thumbWidth * cropHeight / cropWidth);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, realCropX, realCropY, realCropWidth, realCropHeight, 0, 0, canvas.width, canvas.height);
      sharpenCanvas(ctx, canvas.width, canvas.height, THUMB_SHARPEN);

      canvas.toBlob(
        (blobResult) => {
          URL.revokeObjectURL(img.src);
          if (blobResult) {
            resolve(blobResult);
          } else {
            reject(new Error('Canvas toBlob error'));
          }
        },
        'image/jpeg',
        THUMB_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load error'));
    };

    img.src = URL.createObjectURL(blob);
  });
}
