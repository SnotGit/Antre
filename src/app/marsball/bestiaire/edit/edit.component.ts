import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageData } from '../data/storage.data'; // Assurez-vous que l'importation est correcte
import { Model } from '../model/model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bestiaire-item-edit',
  standalone: true,  
  imports: [CommonModule, FormsModule],
  templateUrl: './edit.component.html', 
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit {
  item: Model | undefined;

  constructor(
    private route: ActivatedRoute,
    private storageData: StorageData,  // Injection du service de stockage
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.item = this.storageData.getItems().find(item => item.id === id);
    }
  }

  // Méthode pour enregistrer les modifications de l'item
  saveItem() {
    if (this.item) {
      this.storageData.addItem(this.item);
      this.router.navigate(['/marsball/bestiaire/list']);
    }
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
      if (this.item) {
        const imageBase64 = e.target?.result as string;
        this.storageData.saveImage(this.item.id, imageBase64);  // Sauvegarder l'image
        this.item.imageUrl = imageBase64;  // Mettre à jour l'URL dans l'item
      }
    };
    reader.readAsDataURL(file);
  }

  // Empêcher le comportement par défaut du dragover
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Méthode appelée lorsqu'une URL est saisie manuellement
  onImageUrlChange(url: string) {
    if (this.item) {
      this.item.imageUrl = url;
      this.storageData.saveImage(this.item.id, url);  // Sauvegarder l'image via URL dans le storage
    }
  }

  // Méthode pour supprimer un item
  deleteItem() {
    if (this.item && this.item.id) {
      this.storageData.removeItem(this.item.id);
      this.router.navigate(['/marsball/bestiaire/list']);
    }
  }
}