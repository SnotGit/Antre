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
  
  // Computed pour déterminer le contexte
  isInChroniques = computed(() => this.currentRoute().includes('/chroniques'));
  shouldShowAdminButtons = computed(() => 
    this.isLoggedIn() && this.isAdmin() && !this.isInChroniques()
  );
  shouldShowUserButtons = computed(() => 
    this.isLoggedIn() && this.isInChroniques()
  );

  ngOnInit(): void {
    // Écouter les changements de route
    this.updateCurrentRoute();
    
    // Optionnel: écouter les changements de route en temps réel
    this.router.events.subscribe(() => {
      this.updateCurrentRoute();
    });
  }

  private updateCurrentRoute(): void {
    this.currentRoute.set(this.router.url);
  }

  // ============ AUTHENTIFICATION ============

  openLogin(): void {
    console.log('Opening login...');
    this.router.navigate(['/auth/login']);
  }

  openRegister(): void {
    console.log('Opening register...');
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

  // ============ ACTIONS ADMIN ============

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

  // ============ ACTIONS CHRONIQUES ============

  newStory(): void {
    console.log('New story clicked');
    this.router.navigate(['/chroniques/editor/new']);
  }

  myStories(): void {
    console.log('My stories clicked');
    this.router.navigate(['/chroniques/story-board']);
  }

  // Actions contextuelles pour StoryDetail (TODO: à implémenter)
  editCurrentStory(): void {
    console.log('Edit current story');
    // TODO: Éditer l'histoire actuellement consultée
  }

  deleteCurrentStory(): void {
    console.log('Delete current story');
    // TODO: Supprimer l'histoire actuellement consultée
  }

  publishCurrentStory(): void {
    console.log('Publish current story');
    // TODO: Publier l'histoire actuellement consultée
  }

  // ============ UTILITAIRES ============

  // Getters pour le template
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