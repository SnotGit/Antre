// console-panel.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-console-v3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console-v3.html',
  styleUrls: ['./console-v3.scss']
})
export class ConsoleV3 implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);

  // Signals depuis AuthService
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;

  // Signals pour l'état du composant
  private currentRoute = signal<string>('');

  // Computed pour la logique des boutons
  isInChroniques = computed(() => this.currentRoute().includes('/chroniques'));
  isInAccount = computed(() => this.currentRoute().includes('/mon-compte'));

  // Logique des boutons - exclure la page account
  showUserButtons = computed(() => {
    return this.isLoggedIn() && this.isInChroniques() && !this.isInAccount();
  });

  showAdminButtons = computed(() => {
    return this.isLoggedIn() && this.isAdmin() && !this.isInChroniques() && !this.isInAccount();
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

  // ============ ACTIONS ADMIN (hors chroniques seulement) ============

  addCategory(): void {
    // TODO: Implémenter ajout de catégorie
  }

  addList(): void {
    // TODO: Implémenter ajout de liste
  }

  addItem(): void {
    // TODO: Implémenter ajout d'item
  }

  // ============ ACTIONS USER (dans chroniques seulement) ============

  newStory(): void {
    this.router.navigate(['/chroniques/editor/new']);
  }

  myStories(): void {
    this.router.navigate(['/chroniques/story-board']);
  }

  // Actions contextuelles (quand une histoire est sélectionnée)
  editCurrentStory(): void {
    // TODO: Implémenter édition d'histoire
  }

  deleteCurrentStory(): void {
    // TODO: Implémenter suppression d'histoire
  }

  publishCurrentStory(): void {
    // TODO: Implémenter publication d'histoire
  }

  // ============ ACTIONS COMMUNES (utilisateurs connectés) ============

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
  }

  // ============ UTILITAIRES ============

  getCurrentUserName(): string {
    return this.currentUser()?.username || 'GUEST';
  }

  getCurrentUserLevel(): string {
    return this.currentUser()?.role?.toUpperCase() || 'VISITOR';
  }
}