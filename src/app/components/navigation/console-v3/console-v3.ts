import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MobileMenuService } from '../../../services/mobile-menu.service';

@Component({
  selector: 'app-console-v3',
  imports: [CommonModule],
  templateUrl: './console-v3.html',
  styleUrls: ['./console-v3.scss']
})
export class ConsoleV3 {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mobileMenuService = inject(MobileMenuService);

  //============ SIGNALS ============

  private _currentRoute = signal<string>('');

  //============ COMPUTED ============

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  openMenu = this.mobileMenuService.isConsoleOpen;

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

  //============ INITIALISATION ============

  constructor() {
    this._currentRoute.set(this.router.url);
  }

  //============ CONSOLE ACTIONS ============

  toggleMenu(): void {
    this.mobileMenuService.toggleConsole();
  }

  onClick(): void {
    this.mobileMenuService.closeAll();
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