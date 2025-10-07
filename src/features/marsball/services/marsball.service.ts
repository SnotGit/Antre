import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

//======= INTERFACES =======

export interface MarsballCategory {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarsballList {
  id: number;
  title: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MarsballItem {
  id: number;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  listId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithLists extends MarsballCategory {
  lists: MarsballList[];
}

export interface ListWithItems extends MarsballList {
  items: Pick<MarsballItem, 'id' | 'thumbnailUrl' | 'createdAt'>[];
  category: Pick<MarsballCategory, 'id' | 'title'>;
}

export interface ItemDetail extends MarsballItem {
  list: {
    id: number;
    title: string;
    categoryId: number;
    category: {
      id: number;
      title: string;
    };
  };
}

//======= SERVICE =======

@Injectable({
  providedIn: 'root'
})
export class MarsballService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/marsball`;

  //======= PUBLIC METHODS =======

  getCategories(): Observable<MarsballCategory[]> {
    return this.http.get<MarsballCategory[]>(`${this.apiUrl}/categories`);
  }

  getCategoryWithLists(categoryId: number): Observable<CategoryWithLists> {
    return this.http.get<CategoryWithLists>(`${this.apiUrl}/categories/${categoryId}`);
  }

  getListWithItems(listId: number): Observable<ListWithItems> {
    return this.http.get<ListWithItems>(`${this.apiUrl}/lists/${listId}`);
  }

  getItemDetail(itemId: number): Observable<ItemDetail> {
    return this.http.get<ItemDetail>(`${this.apiUrl}/items/${itemId}`);
  }

  //======= ADMIN METHODS =======

  createCategory(title: string): Observable<MarsballCategory> {
    return this.http.post<MarsballCategory>(`${this.apiUrl}/categories`, { title });
  }

  createList(title: string, categoryId: number): Observable<MarsballList> {
    return this.http.post<MarsballList>(`${this.apiUrl}/lists`, { title, categoryId });
  }

  createItem(title: string, listId: number, imageFile: File): Observable<MarsballItem> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('listId', listId.toString());
    formData.append('image', imageFile);

    return this.http.post<MarsballItem>(`${this.apiUrl}/items`, formData);
  }
}