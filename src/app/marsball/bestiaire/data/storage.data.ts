import { Injectable } from '@angular/core';
import { Model } from '../model/model';
import { BestiaireData } from './bestaire.data';

@Injectable({
  providedIn: 'root',
})
export class StorageData {
  private localStorageKey = 'bestiaireData';

  constructor() {
    this.initializeData();
  }

  // Initialise les données dans le localStorage si elles n'existent pas encore.
  private initializeData(): void {
    const storedData = localStorage.getItem(this.localStorageKey);
    if (!storedData) {
      localStorage.setItem(this.localStorageKey, JSON.stringify(BestiaireData.data));
    }
  }

  // Récupère la liste des items depuis le localStorage.
  private getDataFromStorage(): Model[] {
    this.initializeData();
    const data = localStorage.getItem(this.localStorageKey);
    return data ? JSON.parse(data) : [];
  }

  // Sauvegarde la liste des items dans le localStorage.
  private saveDataToStorage(data: Model[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
  }

  // Retourne la liste de tous les items.
  getItems(): Model[] {
    return this.getDataFromStorage();
  }

  // Ajoute ou met à jour un item.
  addItem(item: Model): void {
    const data = this.getDataFromStorage();
    const index = data.findIndex(i => i.id === item.id);
    if (index !== -1) {
      data[index] = item;
    } else {
      data.push(item);
    }
    this.saveDataToStorage(data);
  }

  // Supprime un item.
  removeItem(id: string): void {
    let data = this.getDataFromStorage();
    data = data.filter(item => item.id !== id);
    this.saveDataToStorage(data);
  }

  // Sauvegarde l'image d'un item.
  saveImage(id: string, imageBase64: string): void {
    const data = this.getDataFromStorage();
    const item = data.find(i => i.id === id);
    if (item) {
      item.imageUrl = imageBase64;
      this.saveDataToStorage(data);
    }
  }
}