import { Component, signal, inject, effect } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [NgClass, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly STORAGE_KEY = 'navbar-mobile-open';

  //============ SIGNAL ============
  
  private _openMenu = signal<boolean>(false);

  //============ COMPUTED ============

  openMenu = this._openMenu.asReadonly();
  isAdmin = this.authService.isAdmin;

  //============ HELPERS ============

  private getState(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  private updateState(isOpen: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, isOpen.toString());
  }

  //============ EFFECT ============

  localStorageEffect = effect(() => {
    this.updateState(this._openMenu());
  });

  //============ INITIALISATION ============

  constructor() {
    if (this.getState()) {
      this._openMenu.set(true);
    }
  }

  //============ ACTIONS ============

  toggleMobileMenu(): void {
    this._openMenu.update(open => !open);
  }

  onClick(): void {
    this._openMenu.set(false);
  }
}