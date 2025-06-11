// navbar.component.ts 
import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  
  private router = inject(Router);
  
  // Signal pour l'état du menu mobile - replié par défaut
  mobileMenuOpen = signal<boolean>(false);
  
  // Signals pour l'état de l'utilisateur
  private user = signal<any>(null);
  private connected = signal<boolean>(false);

  // Computed pour les infos utilisateur
  currentUser = computed(() => this.user()?.username || 'GUEST');
  userLevel = computed(() => this.user()?.role?.toUpperCase() || 'VISITOR');

  constructor() {
    // Initialiser avec le service d'authentification
    this.loadUserData();
    
    //  FERMER LE MENU AUTOMATIQUEMENT LORS DE LA NAVIGATION
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  // Toggle du menu mobile
  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  // Fermer le menu mobile
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // GÉRER LE CLIC SUR UN LIEN DE NAVIGATION
  onNavigationClick(): void {
    // Fermer le menu après un court délai pour permettre l'animation de clic
    setTimeout(() => {
      this.closeMobileMenu();
    }, 150);
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
    // TODO: Implémenter l'ajout de catégorie
  }

  addList(): void {
    // TODO: Implémenter l'ajout de liste
  }

  addItem(): void {
    // TODO: Implémenter ajout d'item
  }

  newStory(): void {
    // TODO: Naviguer vers le formulaire de création d'histoire
  }

  myStories(): void {
    // TODO: Naviguer vers les histoires de l'utilisateur
  }

  settings(): void {
    // TODO: Ouvrir les paramètres utilisateur
  }

  logout(): void {
    this.user.set(null);
    this.connected.set(false);
    // TODO: Implémenter la déconnexion
  }
}