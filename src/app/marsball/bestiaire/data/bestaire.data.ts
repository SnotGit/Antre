import { Injectable } from '@angular/core';
import { Model } from '../model/model';

@Injectable({
  providedIn: 'root',
})
export class BestiaireData {
  public static data: Model[] = [
    {
      id: '1',
      imageUrl: 'https://example.com/image1.jpg',
      isBoss: false,
      type: 'Type1',
      zone: 'Zone1',
      lootItems: ['Loot1', 'Loot2'],
      description: 'Description de l\'item 1'
    },
    // Ajoutez d'autres items ici
  ];

  addItem(item: Model): void {
    BestiaireData.data.push(item);
  }
}