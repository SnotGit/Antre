import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { VaultCategory, VaultEntry, CategoryWithChildren, CategoriesResponse } from '../models/terraformars.models';
import { cropThumbnailScaled, cropThumbnailFromElement, CROP_RATIOS } from '@shared/services/crop-images/crop.utils';

interface CategoryResponse {
  category: VaultCategory;
}

interface EntryResponse {
  entry: VaultEntry;
}

interface DeleteResponse {
  message: string;
}

@Service()
export class TerraformarsCrudService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);

  //========== CONFIG ==========//

  private readonly baseUrl = `${environment.apiUrl}/terraformars`;
  private readonly thumbWidth = CROP_RATIOS.itemCard.thumbWidth;

  //========== GET ==========//

  async getRootCategories(): Promise<VaultCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.baseUrl}/categories`)
    );
    return response.categories;
  }

  async getAllCategories(): Promise<VaultCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.baseUrl}/categories/all`)
    );
    return response.categories;
  }

  async getCategoryWithChildren(categoryId: number): Promise<CategoryWithChildren> {
    return await firstValueFrom(
      this.http.get<CategoryWithChildren>(`${this.baseUrl}/categories/${categoryId}`)
    );
  }

  //========== CREATE ==========//

  async createCategory(title: string, parentId: number | null): Promise<VaultCategory> {
    const response = await firstValueFrom(
      this.http.post<CategoryResponse>(`${this.baseUrl}/categories`, { title, parentId })
    );
    return response.category;
  }

  async createEntry(
    title: string,
    categoryId: number,
    image: File,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
    displayWidth: number,
    displayHeight: number,
    description?: string
  ): Promise<VaultEntry> {
    const thumbnail = await cropThumbnailScaled(image, cropX, cropY, cropWidth, cropHeight, displayWidth, displayHeight, this.thumbWidth);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('categoryId', categoryId.toString());
    formData.append('image', image);
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg');

    if (description) {
      formData.append('description', description);
    }

    const response = await firstValueFrom(
      this.http.post<EntryResponse>(`${this.baseUrl}/entries`, formData)
    );
    return response.entry;
  }

  //========== UPDATE ==========//

  async updateCategory(categoryId: number, title: string): Promise<VaultCategory> {
    const response = await firstValueFrom(
      this.http.put<CategoryResponse>(`${this.baseUrl}/categories/${categoryId}`, { title })
    );
    return response.category;
  }

  async updateEntry(
    entryId: number,
    title: string,
    description: string,
    cropX: number,
    cropY: number,
    cropWidth: number,
    cropHeight: number,
    displayWidth: number,
    displayHeight: number,
    image?: File,
    existingImageElement?: HTMLImageElement
  ): Promise<VaultEntry> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);

    if (image) {
      const thumbnail = await cropThumbnailScaled(image, cropX, cropY, cropWidth, cropHeight, displayWidth, displayHeight, this.thumbWidth);
      formData.append('image', image);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    } else if (existingImageElement && existingImageElement.complete) {
      const thumbnail = await cropThumbnailFromElement(existingImageElement, cropX, cropY, cropWidth, cropHeight, this.thumbWidth);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    }

    const response = await firstValueFrom(
      this.http.put<EntryResponse>(`${this.baseUrl}/entries/${entryId}`, formData)
    );
    return response.entry;
  }

  //========== DELETE ==========//

  async deleteCategory(categoryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.baseUrl}/categories/${categoryId}`)
    );
  }

  async deleteEntry(entryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.baseUrl}/entries/${entryId}`)
    );
  }

  async deleteCategories(categoryIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post<DeleteResponse>(`${this.baseUrl}/categories/batch-delete`, { categoryIds })
    );
  }

  async deleteEntries(entryIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post<DeleteResponse>(`${this.baseUrl}/entries/batch-delete`, { entryIds })
    );
  }
}
