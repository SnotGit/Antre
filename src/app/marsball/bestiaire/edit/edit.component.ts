import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageData } from '../data/storage.data';
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
  isNewItem: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private storageData: StorageData,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.item = this.storageData.getItems().find(item => item.id === id);
      if (!this.item) {
        // Si l'élément n'existe pas, c'est un nouvel élément
        this.isNewItem = true;
        this.item = { id, imageUrl: '', isBoss: false, type: '', zone: '', lootItems: [], description: '' };
      }
    } else {
      // Si aucun ID n'est fourni, c'est un nouvel élément
      this.isNewItem = true;
      this.item = { id: '', imageUrl: '', isBoss: false, type: '', zone: '', lootItems: [], description: '' };
    }
  }

  // Méthode pour enregistrer les modifications de l'item
  saveItem() {
    if (this.item) {
      if (this.isNewItem) {
        this.storageData.addItem(this.item);
      } else {
        this.storageData.updateItem(this.item);
      }
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
        this.storageData.saveImage(this.item.id, imageBase64);
        this.item.imageUrl = imageBase64;
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
      this.storageData.saveImage(this.item.id, url);
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
