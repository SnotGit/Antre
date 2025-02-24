import { Component, OnInit } from '@angular/core';
import { StorageData } from '../data/storage.data'; // Assurez-vous que l'importation est correcte
import { Model } from '../model/model';  
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-list',
    templateUrl: './list.component.html',
    styleUrls: ['./list.component.css'],
    imports: [CommonModule, RouterModule]
})
export class ListComponent implements OnInit {
  items: Model[] = [];

  constructor(private storageData: StorageData) {
    console.log('ListComponent initialized');
  }

  ngOnInit(): void {
    // Initialiser les items depuis le service
    this.items = this.storageData.getItems();
    
    // Trier les items par ordre alphabétique
    this.sortItemsAlphabetically();
  }

  sortItemsAlphabetically(): void {
    this.items.sort((a, b) => a.id.localeCompare(b.id)); // Trie selon l'id (ou utilise title si nécessaire)
  }
}