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
  
  private _mobileMenuOpen = signal<boolean>(false);

  //============ COMPUTED ============

  mobileMenuOpen = this._mobileMenuOpen.asReadonly();
  isAdmin = this.authService.isAdmin;

  //============ HELPERS ============

  private getStoredState(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) === 'true';
  }

  private updateStoredState(isOpen: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, isOpen.toString());
  }

  //============ EFFECT ============

  localStorageEffect = effect(() => {
    this.updateStoredState(this._mobileMenuOpen());
  });

  //============ INITIALISATION ============

  constructor() {
    if (this.getStoredState()) {
      this._mobileMenuOpen.set(true);
    }
  }

  //============ ACTIONS ============

  toggleMobileMenu(): void {
    this._mobileMenuOpen.update(open => !open);
  }

  onClick(): void {
    this._mobileMenuOpen.set(false);
  }
}