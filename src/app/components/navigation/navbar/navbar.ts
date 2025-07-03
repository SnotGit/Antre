import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  //============ SIGNALS ÉTAT ============

  private _mobileMenuOpen = signal<boolean>(false);

  //============ COMPUTED PUBLICS ============

  mobileMenuOpen = this._mobileMenuOpen.asReadonly();
  isAdmin = this.authService.isAdmin;

  //============ INITIALISATION ============

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this._mobileMenuOpen.set(false);
    });

    effect(() => {
      localStorage.setItem('navbar-mobile-open', this._mobileMenuOpen().toString());
    });

    const savedState = localStorage.getItem('navbar-mobile-open');
    if (savedState === 'true') {
      this._mobileMenuOpen.set(true);
    }
  }

  //============ ACTIONS MENU MOBILE ============

  toggleMobileMenu(): void {
    this._mobileMenuOpen.set(!this._mobileMenuOpen());
  }

  onNavigationClick(): void {
    setTimeout(() => {
      this._mobileMenuOpen.set(false);
    }, 150);
  }
}