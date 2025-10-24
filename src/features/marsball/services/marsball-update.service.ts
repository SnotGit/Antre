import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { MarsballCategory, MarsballItem } from './marsball-get.service';

//======= RESPONSE TYPES =======

interface CategoryResponse {
  category: MarsballCategory;
}

interface ItemResponse {
  item: MarsballItem;
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class MarsballUpdateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/marsball`;

  //======= UPDATE CATEGORY =======

  async updateCategory(categoryId: number, title: string): Promise<MarsballCategory> {
    try {
      const response = await firstValueFrom(
        this.http.put<CategoryResponse>(`${this.API_URL}/categories/${categoryId}`, { title })
      );
      return response.category;
    } catch (error) {
      throw error;
    }
  }

  //======= UPDATE ITEM =======

  async updateItem(
    itemId: number, 
    title: string, 
    description: string, 
    cropX: number, 
    cropY: number, 
    cropSize: number,
    displayWidth: number,
    displayHeight: number,
    image?: File
  ): Promise<MarsballItem> {
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      if (image) {
        const thumbnail = await this.cropImageToBlob(image, cropX, cropY, cropSize, displayWidth, displayHeight);
        formData.append('image', image);
        formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
      } else {
        const imageElement = document.querySelector(`img[src*="/uploads/marsball/full/"]`) as HTMLImageElement;
        if (imageElement && imageElement.complete) {
          const thumbnail = await this.cropFromImageElement(imageElement, cropX, cropY, cropSize, displayWidth, displayHeight);
          formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
        }
      }

      const response = await firstValueFrom(
        this.http.put<ItemResponse>(`${this.API_URL}/items/${itemId}`, formData)
      );
      return response.item;
    } catch (error) {
      throw error;
    }
  }

  //======= CROP WITH CANVAS - FROM FILE =======

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

        ctx.drawImage(
          img,
          realCropX,
          realCropY,
          realCropSize,
          realCropSize,
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

  //======= CROP WITH CANVAS - FROM IMAGE ELEMENT =======

  private async cropFromImageElement(
    imgElement: HTMLImageElement,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number
  ): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Recharger l'image avec fetch pour éviter CORS
        const response = await fetch(imgElement.src);
        const blob = await response.blob();
        const img = new Image();
        
        img.onload = () => {
          const realWidth = img.naturalWidth;
          const realHeight = img.naturalHeight;

          const canvas = document.createElement('canvas');
          canvas.width = 60;
          canvas.height = 60;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context error'));
            return;
          }

          // Crop direct sans calculs de ratio
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

        img.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(error);
      }
    });
  }
}