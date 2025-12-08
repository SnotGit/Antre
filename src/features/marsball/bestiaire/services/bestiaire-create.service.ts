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
export class BestiaireCreateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bestiaire`;

  //======= CREATE CATEGORY =======

  async createCategory(title: string, parentId: number | null): Promise<BestiaireCategory> {
    const response = await firstValueFrom(
      this.http.post<CategoryResponse>(`${this.API_URL}/categories`, { title, parentId })
    );
    return response.category;
  }

  //======= CREATE CREATURE =======

  async createCreature(
    title: string,
    categoryId: number,
    image: File,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number,
    description?: string
  ): Promise<Creature> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('categoryId', categoryId.toString());
    
    if (description) {
      formData.append('description', description);
    }

    formData.append('image', image);

    const thumbnail = await this.cropImageToBlob(image, cropX, cropY, cropSize, displayWidth, displayHeight);
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg');

    const response = await firstValueFrom(
      this.http.post<CreatureResponse>(`${this.API_URL}/creatures`, formData)
    );
    return response.creature;
  }

  //======= CROP IMAGE =======

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
}