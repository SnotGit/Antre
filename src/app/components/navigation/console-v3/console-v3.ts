import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
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

  //============ SIGNALS ÉTAT ============

  private _currentRoute = signal<string>('');
  private _isCollapsed = signal<boolean>(true);

  //============ COMPUTED PUBLICS ============

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  isCollapsed = this._isCollapsed.asReadonly();

  showUserActions = computed(() => {
    return this.isLoggedIn() && this._currentRoute().includes('/chroniques');
  });

  showAdminActions = computed(() => {
    return this.isAdmin() && !this._currentRoute().includes('/chroniques');
  });

  //============ INITIALISATION ============

  constructor() {
    this._currentRoute.set(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this._currentRoute.set(this.router.url);
    });

    effect(() => {
      localStorage.setItem('console-collapsed', this._isCollapsed().toString());
    });

    const savedState = localStorage.getItem('console-collapsed');
    if (savedState === 'false') {
      this._isCollapsed.set(false);
    }
  }

  //============ ACTIONS CONSOLE ============

  toggleConsole(): void {
    this._isCollapsed.set(!this._isCollapsed());
  }

  //============ ACTIONS AUTHENTIFICATION ============

  openLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  openRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  logout(): void {
    this.authService.logout();
  }

  //============ ACTIONS UTILISATEUR ============

  newStory(): void {
    this.router.navigate(['/chroniques/editor']);
  }

  myStories(): void {
    this.router.navigate(['/chroniques/stories']);
  }

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
  }

  //============ ACTIONS ADMIN ============

  addCategory(): void {
    // TODO: Implémenter quand composant archives sera créé
  }

  addList(): void {
    // TODO: Implémenter quand composant terraformars sera créé  
  }

  addItem(): void {
    // TODO: Implémenter quand composant marsball sera créé
  }

  //============ ACTIONS STORY CONTEXTUELLES ============

  editCurrentStory(): void {
    // TODO: Implémenter édition histoire courante
  }

  deleteCurrentStory(): void {
    // TODO: Implémenter suppression histoire courante
  }

  publishCurrentStory(): void {
    // TODO: Implémenter publication histoire courante
  }

  //============ GETTERS DISPLAY ============

  getCurrentStatus(): string {
    return this.currentUser() ? 'CONNECTÉ' : 'DÉCONNECTÉ';
  }

  getCurrentUserName(): string {
    return this.currentUser()?.username || 'INCONNU';
  }

  getCurrentUserLevel(): string {
    return this.currentUser()?.role?.toUpperCase() || 'VISITEUR';
  }

  //============ HELPERS ============

  isInRoute(route: string): boolean {
    return this._currentRoute().includes(route);
  }
}