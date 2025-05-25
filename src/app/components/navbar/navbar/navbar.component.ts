// navbar.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  
  // Signals pour l'état de l'utilisateur
  private user = signal<any>(null);
  private connected = signal<boolean>(false);

  // Computed pour les infos utilisateur
  currentUser = computed(() => this.user()?.username || 'GUEST');
  userLevel = computed(() => this.user()?.role?.toUpperCase() || 'VISITOR');

  constructor() {
    // TODO: Initialiser avec le service d'authentification
    this.loadUserData();
  }

  // Méthodes pour vérifier les permissions
  isConnected(): boolean {
    return this.connected();
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }

  // Charger les données utilisateur (temporaire)
  private loadUserData(): void {
    // TODO: Remplacer par un vrai service d'auth
    // Simulation pour test
    const mockUser = {
      username: 'Snot',
      role: 'admin'
    };
    
    this.user.set(mockUser);
    this.connected.set(true);
  }

  // Actions de la console
  addCategory(): void {
    console.log('Add category clicked');
    // TODO: Implémenter l'ajout de catégorie
  }

  addList(): void {
    console.log('Add list clicked');
    // TODO: Implémenter l'ajout de liste
  }

  addItem(): void {
    console.log('Add item clicked');
    // TODO: Implémenter l'ajout d'item
  }

  newStory(): void {
    console.log('New story clicked');
    // TODO: Naviguer vers le formulaire de création d'histoire
  }

  myStories(): void {
    console.log('My stories clicked');
    // TODO: Naviguer vers les histoires de l'utilisateur
  }

  settings(): void {
    console.log('Settings clicked');
    // TODO: Ouvrir les paramètres utilisateur
  }

  logout(): void {
    console.log('Logout clicked');
    this.user.set(null);
    this.connected.set(false);
    // TODO: Implémenter la déconnexion
  }
}