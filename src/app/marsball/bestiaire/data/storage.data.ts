import { Injectable } from '@angular/core';
import { Model } from '../model/model';

@Injectable({
  providedIn: 'root'
})
export class StorageData {
  removeItem(id: string) {
    throw new Error('Method not implemented.');
  }
  private items: Model[] = [];

  constructor() {
    this.loadItems();
  }

  addItem(item: Model) {
    this.items.push(item);
    this.saveItems();
  }

  saveImage(id: string, imageBase64: string) {
    // Logique pour sauvegarder l'image
  }

  private saveItems() {
    localStorage.setItem('items', JSON.stringify(this.items));
  }

  private loadItems() {
    const items = localStorage.getItem('items');
    if (items) {
      this.items = JSON.parse(items);
    }
  }

  getItems(): Model[] {
    return this.items;
  }
}