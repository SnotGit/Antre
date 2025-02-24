import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageData } from '../data/storage.data'; // Assurez-vous que l'importation est correcte
import { Model } from '../model/model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add',
    templateUrl: './add.component.html',
    styleUrls: ['./add.component.css'],
    imports: [CommonModule, FormsModule]
})
export class AddComponent {
  newItem: Model = {
    id: '',
    imageUrl: '',
    isBoss: false,
    type: '',
    zone: '',
    lootItems: [],
    description: ''
  };

  image: string | ArrayBuffer | null = null; // Propriété pour stocker l'image

  constructor(
    private storageData: StorageData,  // Injection du service de stockage
    private router: Router
  ) {}

  // Méthode pour ajouter un item
  addItem() {
    // Mettre à jour l'URL de l'image dans l'item
    this.newItem.imageUrl = this.image as string;
    // Ajout de l'item au service de stockage
    this.storageData.addItem(this.newItem);
    // Redirection vers la liste des items
    this.router.navigate(['/marsball/bestiaire/list']);
  }

  // Méthode pour gérer le drop de l'image
  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.readFileAsDataURL(file);
    }
  }

  // Méthode pour lire le fichier en base64 et le stocker via le service
  readFileAsDataURL(file: File) {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const imageBase64 = e.target?.result as string;
      // Sauvegarder l'image dans le service de stockage
      this.storageData.saveImage(this.newItem.id, imageBase64);
      // Mettre à jour l'URL de l'image dans l'item
      this.newItem.imageUrl = imageBase64;
      // Mettre à jour la propriété image
      this.image = imageBase64;
    };
    reader.readAsDataURL(file);
  }

  // Empêcher le comportement par défaut du dragover (pour drag and drop)
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Méthode appelée lorsqu'une URL d'image est saisie manuellement
  onImageUrlChange(url: string) {
    // Mettre à jour l'image avec l'URL saisie
    this.newItem.imageUrl = url;
    // Sauvegarder l'image avec l'URL dans le service de stockage
    this.storageData.saveImage(this.newItem.id, url);
    // Mettre à jour la propriété image
    this.image = url;
  }
}