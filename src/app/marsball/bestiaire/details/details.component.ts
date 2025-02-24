import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageData } from '../data/storage.data'; // Assurez-vous que l'importation est correcte
import { Model } from '../model/model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-bestiaire-item-details',
    imports: [CommonModule, RouterModule],
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {
  item: Model | undefined;

  constructor(
    private route: ActivatedRoute,
    private storageData: StorageData // Injection du service de stockage
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.item = this.storageData.getItems().find(item => item.id === id);
    }
  }
}