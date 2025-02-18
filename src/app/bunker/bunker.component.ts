import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Item {
  name: string;
  image: string;
  type: string;
  zone: string;
  attack: string[];
  pointsdevie: string;
  damage: string;
  loot: string[];
}

@Component({
  selector: 'app-bunker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bunker.component.html',
  styleUrl: './bunker.component.css'
})
export class BunkerComponent implements OnInit {
  item: Item;  // Utilisation de l'interface Item

  constructor() {
    this.item = {
      name: 'Greeny',
      image: '/images/Greeny.png',
      type: 'Machine',
      zone: 'RoverLand',
      attack: ['Strike', 'Boom',],
      pointsdevie: '7000',
      damage: '200 - 400',
      loot: ['Calculateur 2 axes', 'Boite de transfert robuste', 'Phare de balisage']
    };
  }

  ngOnInit(): void {
    // Logique supplémentaire lors de l'initialisation si nécessaire
  }
}