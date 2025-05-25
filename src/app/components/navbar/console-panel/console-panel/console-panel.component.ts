// console-panel.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-console-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console-panel.component.html',
  styleUrls: ['./console-panel.component.scss']
})
export class ConsolePanelComponent implements OnInit {
  
  private router = inject(Router);
  private authService = inject(AuthService);

  // Signals depuis AuthService
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  isDevMode = this.authService.isDevMode;

  // Signals pour l'état du composant
  private currentRoute = signal<string>('');
  
  // Computed pour la logique des boutons
  isInChroniques = computed(() => this.currentRoute().includes('/chroniques'));
  
  // LOGIQUE CORRIGÉE :
  // Si dans chroniques -> fonctions USER (même pour admin)
  // Si hors chroniques -> fonctions ADMIN (seulement pour admin)
  showUserButtons = computed(() => {
    return this.isLoggedIn() && this.isInChroniques();
  });
  
  showAdminButtons = computed(() => {
    return this.isLoggedIn() && this.isAdmin() && !this.isInChroniques();
  });

  // Alias pour le template (compatibilité)
  shouldShowUserButtons = this.showUserButtons;
  shouldShowAdminButtons = this.showAdminButtons;

  ngOnInit(): void {
    this.updateCurrentRoute();
    this.router.events.subscribe(() => {
      this.updateCurrentRoute();
    });
  }

  private updateCurrentRoute(): void {
    this.currentRoute.set(this.router.url);
    console.log('Route actuelle:', this.router.url);
    console.log('Dans chroniques:', this.isInChroniques());
    console.log('Boutons user:', this.showUserButtons());
    console.log('Boutons admin:', this.showAdminButtons());
  }

  // ============ AUTHENTIFICATION ============

  openLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  openRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  logout(): void {
    this.authService.logout();
  }

  // ============ MODE DÉVELOPPEMENT ============

  switchToElena(): void {
    this.authService.switchToDevUser('elena');
  }

  exitDevMode(): void {
    this.authService.exitDevMode();
  }

  // ============ ACTIONS ADMIN (hors chroniques seulement) ============

  addCategory(): void {
    console.log('Add category clicked');
  }

  addList(): void {
    console.log('Add list clicked');
  }

  addItem(): void {
    console.log('Add item clicked');
  }

  // ============ ACTIONS USER (dans chroniques seulement) ============

  newStory(): void {
    console.log('New story clicked');
    this.router.navigate(['/chroniques/editor/new']);
  }

  myStories(): void {
    console.log('My stories clicked');
    this.router.navigate(['/chroniques/story-board']);
  }

  // Actions contextuelles (quand une histoire est sélectionnée)
  editCurrentStory(): void {
    console.log('Edit current story');
    // TODO: Implémenter selon l'histoire sélectionnée
  }

  deleteCurrentStory(): void {
    console.log('Delete current story');
    // TODO: Implémenter selon l'histoire sélectionnée
  }

  publishCurrentStory(): void {
    console.log('Publish current story');
    // TODO: Implémenter selon l'histoire sélectionnée
  }

  // ============ ACTIONS COMMUNES (utilisateurs connectés) ============

  openAccount(): void {
    console.log('Mon compte clicked');
    this.router.navigate(['/mon-compte']);
  }

  // ============ UTILITAIRES ============

  getCurrentUserName(): string {
    return this.currentUser()?.username || 'GUEST';
  }

  getCurrentUserLevel(): string {
    if (this.isDevMode()) {
      return 'DEV-MODE';
    }
    return this.currentUser()?.role?.toUpperCase() || 'VISITOR';
  }
}