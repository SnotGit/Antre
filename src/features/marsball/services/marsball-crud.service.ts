import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { VaultCategory, VaultEntry, CategoryWithChildren, CategoriesResponse } from '../models/marsball.models';
import { cropThumbnailScaled, cropThumbnailFromElement, CROP_RATIOS } from '@shared/services/crop-images/crop.utils';

export type MarsballSection = 'marsball' | 'bestiaire' | 'rover';

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
export class MarsballCrudService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);

  //========== SECTION ==========//

  private readonly _section = signal<MarsballSection>('marsball');
  readonly section = this._section.asReadonly();

  setSection(key: MarsballSection): void {
    this._section.set(key);
  }

  private apiUrl(section?: string): string {
    return `${environment.apiUrl}/${section ?? this._section()}`;
  }

  private thumbWidth(): number {
    return this._section() === 'bestiaire' ? CROP_RATIOS.bestiaireCard.thumbWidth : CROP_RATIOS.itemCard.thumbWidth;
  }

  //========== GET ==========//

  async getRootCategories(): Promise<VaultCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.apiUrl()}/categories`)
    );
    return response.categories;
  }

  async getAllCategories(section?: string): Promise<VaultCategory[]> {
    const response = await firstValueFrom(
      this.http.get<CategoriesResponse>(`${this.apiUrl(section)}/categories/all`)
    );
    return response.categories;
  }

  async getCategoryWithChildren(categoryId: number): Promise<CategoryWithChildren> {
    return await firstValueFrom(
      this.http.get<CategoryWithChildren>(`${this.apiUrl()}/categories/${categoryId}`)
    );
  }

  //========== CREATE ==========//

  async createCategory(title: string, parentId: number | null): Promise<VaultCategory> {
    const response = await firstValueFrom(
      this.http.post<CategoryResponse>(`${this.apiUrl()}/categories`, { title, parentId })
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
    const thumbnail = await cropThumbnailScaled(image, cropX, cropY, cropWidth, cropHeight, displayWidth, displayHeight, this.thumbWidth());

    const formData = new FormData();
    formData.append('title', title);
    formData.append('categoryId', categoryId.toString());
    formData.append('image', image);
    formData.append('thumbnail', thumbnail, 'thumbnail.jpg');

    if (description) {
      formData.append('description', description);
    }

    const response = await firstValueFrom(
      this.http.post<EntryResponse>(`${this.apiUrl()}/entries`, formData)
    );
    return response.entry;
  }

  //========== UPDATE ==========//

  async updateCategory(categoryId: number, title: string): Promise<VaultCategory> {
    const response = await firstValueFrom(
      this.http.put<CategoryResponse>(`${this.apiUrl()}/categories/${categoryId}`, { title })
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
      const thumbnail = await cropThumbnailScaled(image, cropX, cropY, cropWidth, cropHeight, displayWidth, displayHeight, this.thumbWidth());
      formData.append('image', image);
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    } else if (existingImageElement && existingImageElement.complete) {
      const thumbnail = await cropThumbnailFromElement(existingImageElement, cropX, cropY, cropWidth, cropHeight, this.thumbWidth());
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    }

    const response = await firstValueFrom(
      this.http.put<EntryResponse>(`${this.apiUrl()}/entries/${entryId}`, formData)
    );
    return response.entry;
  }

  //========== DELETE ==========//

  async deleteCategory(categoryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.apiUrl()}/categories/${categoryId}`)
    );
  }

  async deleteEntry(entryId: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<DeleteResponse>(`${this.apiUrl()}/entries/${entryId}`)
    );
  }

  async deleteCategories(categoryIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post<DeleteResponse>(`${this.apiUrl()}/categories/batch-delete`, { categoryIds })
    );
  }

  async deleteEntries(entryIds: number[]): Promise<void> {
    await firstValueFrom(
      this.http.post<DeleteResponse>(`${this.apiUrl()}/entries/batch-delete`, { entryIds })
    );
  }
}
