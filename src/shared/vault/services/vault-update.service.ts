import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { VaultCategory, VaultEntry } from '../models/vault.models';
import { VaultContextService } from './vault-context.service';

//======= RESPONSE TYPES =======

interface CategoryResponse {
  category: VaultCategory;
}

interface EntryResponse {
  entry: VaultEntry;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class VaultUpdateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly context = inject(VaultContextService);

  //======= UPDATE CATEGORY =======

  async updateCategory(categoryId: number, title: string): Promise<VaultCategory> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    const response = await firstValueFrom(
      this.http.put<CategoryResponse>(`${apiUrl}/categories/${categoryId}`, { title })
    );
    return response.category;
  }

  //======= UPDATE ENTRY =======

  async updateEntry(
    entryId: number,
    title: string,
    description: string,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number,
    image?: File,
    existingImageElement?: HTMLImageElement
  ): Promise<VaultEntry> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (image) {
      const thumbnail = await this.cropImageToBlob(image, cropX, cropY, cropSize, displayWidth, displayHeight);
      formData.append('image', image);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    } else if (existingImageElement && existingImageElement.complete) {
      const thumbnail = await this.cropFromImageElement(existingImageElement, cropX, cropY, cropSize);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    }

    const response = await firstValueFrom(
      this.http.put<EntryResponse>(`${apiUrl}/entries/${entryId}`, formData)
    );
    return response.entry;
  }

  //======= CROP FROM FILE =======

  private async cropImageToBlob(
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
        const realWidth = img.naturalWidth;
        const realHeight = img.naturalHeight;

        const ratioX = realWidth / displayWidth;
        const ratioY = realHeight / displayHeight;

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

  //======= CROP FROM IMAGE ELEMENT =======

  private async cropFromImageElement(
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
}
