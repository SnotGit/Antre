import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { VaultEntry, VaultCategory } from '../models/vault.models';
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
export class VaultCreateService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly context = inject(VaultContextService);

  //======= CREATE CATEGORY =======

  async createCategory(title: string, parentId: number | null): Promise<VaultCategory> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    const response = await firstValueFrom(
      this.http.post<CategoryResponse>(`${apiUrl}/categories`, { title, parentId })
    );
    return response.category;
  }

  //======= CREATE ENTRY =======

  async createEntry(
    title: string,
    categoryId: number,
    image: File,
    cropX: number,
    cropY: number,
    cropSize: number,
    displayWidth: number,
    displayHeight: number,
    description?: string
  ): Promise<VaultEntry> {
    const apiUrl = `${environment.apiUrl}/${this.context.contextKey()}`;
    const thumbnail = await this.cropThumbnail(image, cropX, cropY, cropSize);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('categoryId', categoryId.toString());
    formData.append('image', image);
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg');

    if (description) {
      formData.append('description', description);
    }

    const response = await firstValueFrom(
      this.http.post<EntryResponse>(`${apiUrl}/entries`, formData)
    );

    return response.entry;
  }

  //======= CROP THUMBNAIL =======

  private async cropThumbnail(
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
}
