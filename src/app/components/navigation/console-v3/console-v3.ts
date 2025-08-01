import { Component, signal, computed, inject, effect } from '@angular/core';
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
export class ConsoleV3 {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly STORAGE_KEY = 'console-collapsed';

  //============ SIGNAL ============

  private _currentRoute = signal<string>('');
  private _openMenu = signal<boolean>(true);

  //============ COMPUTED  ============

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  openMenu = this._openMenu.asReadonly();

  showUserActions = computed(() => {
    return this.isLoggedIn() && this._currentRoute().includes('/chroniques');
  });

  showAdminActions = computed(() => {
    return this.isAdmin() && !this._currentRoute().includes('/chroniques');
  });

  getCurrentStatus = computed(() => {
    return this.currentUser() ? 'CONNECTÉ' : 'DÉCONNECTÉ';
  });

  getCurrentUserName = computed(() => {
    return this.currentUser()?.username || 'INCONNU';
  });

  getCurrentUserLevel = computed(() => {
    return this.currentUser()?.role?.toUpperCase() || 'VISITEUR';
  });

  //============ HELPERS ============

  private getState(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'false'; 
  }

  private updateState(isCollapsed: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, isCollapsed.toString());
  }

  //============ EFFECT ============

  localStorageEffect = effect(() => {
    this.updateState(this._openMenu());
  });

  //============ INITIALISATION ============

  constructor() {
    this._currentRoute.set(this.router.url);

    if (this.getState()) {
      this._openMenu.set(false);
    }
  }

  //============ CONSOLE ACTIONS ============

  toggleMenu(): void {
    this._openMenu.update(open => !open);
  }

  onClick(): void {
    this._openMenu.set(true);
  }

  //============ AUTH ACTIONS ============

  openLogin(): void {
    this.router.navigate(['/auth/login']);
    this.onClick();
  }

  openRegister(): void {
    this.router.navigate(['/auth/register']);
    this.onClick();
  }

  logout(): void {
    this.authService.logout();
    this.onClick();
  }

  //============ USER ACTIONS ============

  newStory(): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillon/edition/nouvelle-histoire']);
    this.onClick();
  }

  myStories(): void {
    this.router.navigate(['/chroniques/mes-histoires']);
    this.onClick();
  }

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
    this.onClick();
  }

  //============ ADMIN ACTIONS ============

  addCategory(): void {
    // TODO: Implémenter + onClick()
  }

  addList(): void {
    // TODO: Implémenter + onClick()
  }

  addItem(): void {
    // TODO: Implémenter + onClick()
  }
}