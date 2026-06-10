//========== CROP THUMBNAIL (FICHIER, COORDONNÉES DIRECTES) ==========//

export function cropThumbnail(
  file: File,
  cropX: number,
  cropY: number,
  cropSize: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas error'));
        return;
      }

      ctx.drawImage(
        img,
        Math.round(cropX),
        Math.round(cropY),
        Math.round(cropSize),
        Math.round(cropSize),
        0,
        0,
        60,
        60
      );

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
        0.9
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
  cropSize: number,
  displayWidth: number,
  displayHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const ratioX = img.naturalWidth / displayWidth;
      const ratioY = img.naturalHeight / displayHeight;

      const realCropX = cropX * ratioX;
      const realCropY = cropY * ratioY;
      const realCropSize = cropSize * ratioX;

      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.drawImage(img, realCropX, realCropY, realCropSize, realCropSize, 0, 0, 60, 60);

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
        0.85
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
  cropSize: number
): Promise<Blob> {
  const response = await fetch(imgElement.src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.drawImage(img, Math.round(cropX), Math.round(cropY), Math.round(cropSize), Math.round(cropSize), 0, 0, 60, 60);

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
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Image load error'));
    };

    img.src = URL.createObjectURL(blob);
  });
}
