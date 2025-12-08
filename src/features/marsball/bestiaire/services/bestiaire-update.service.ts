import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { BestiaireCategory, Creature } from '@features/marsball/bestiaire/models/bestiaire.models';

//======= RESPONSE TYPES =======

interface CategoryResponse {
  category: BestiaireCategory;
}

interface CreatureResponse {
  creature: Creature;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class BestiaireUpdateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bestiaire`;

  //======= UPDATE CATEGORY =======

  async updateCategory(categoryId: number, title: string): Promise<BestiaireCategory> {
    const response = await firstValueFrom(
      this.http.put<CategoryResponse>(`${this.API_URL}/categories/${categoryId}`, { title })
    );
    return response.category;
  }

  //======= UPDATE CREATURE =======

  async updateCreature(
    creatureId: number,
    title: string,
    description: string,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number,
    image?: File
  ): Promise<Creature> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (image) {
      const thumbnail = await this.cropImageToBlob(image, cropX, cropY, cropSize, displayWidth, displayHeight);
      formData.append('image', image);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    } else {
      const imageElement = document.querySelector(`img[src*="/uploads/bestiaire/full/"]`) as HTMLImageElement;
      if (imageElement && imageElement.complete) {
        const thumbnail = await this.cropFromImageElement(imageElement, cropX, cropY, cropSize, displayWidth, displayHeight);
        formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
      }
    }

    const response = await firstValueFrom(
      this.http.put<CreatureResponse>(`${this.API_URL}/creatures/${creatureId}`, formData)
    );
    return response.creature;
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

        const realCropX = Math.round(cropX * ratioX);
        const realCropY = Math.round(cropY * ratioY);
        const realCropSize = Math.round(cropSize * Math.min(ratioX, ratioY));

        const canvas = document.createElement('canvas');
        canvas.width = realCropSize;
        canvas.height = realCropSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context error'));
          return;
        }

        ctx.drawImage(
          img,
          realCropX, realCropY, realCropSize, realCropSize,
          0, 0, realCropSize, realCropSize
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Blob creation error'));
            }
          },
          'image/jpeg',
          0.85
        );
      };

      img.onerror = () => reject(new Error('Image load error'));
      img.src = URL.createObjectURL(file);
    });
  }

  //======= CROP FROM IMAGE ELEMENT =======

  private async cropFromImageElement(
    imageElement: HTMLImageElement,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const realWidth = imageElement.naturalWidth;
      const realHeight = imageElement.naturalHeight;

      const ratioX = realWidth / displayWidth;
      const ratioY = realHeight / displayHeight;

      const realCropX = Math.round(cropX * ratioX);
      const realCropY = Math.round(cropY * ratioY);
      const realCropSize = Math.round(cropSize * Math.min(ratioX, ratioY));

      const canvas = document.createElement('canvas');
      canvas.width = realCropSize;
      canvas.height = realCropSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context error'));
        return;
      }

      ctx.drawImage(
        imageElement,
        realCropX, realCropY, realCropSize, realCropSize,
        0, 0, realCropSize, realCropSize
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob creation error'));
          }
        },
        'image/jpeg',
        0.85
      );
    });
  }
}