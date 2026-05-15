import { Component, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { MobileMenuService } from '../../services/mobile-menu.service';
import { Searchbar } from '@shared/components/searchbar/searchbar';

@Component({
  selector: 'app-navbar',
  imports: [NgClass, RouterLink, RouterLinkActive, Searchbar],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mobileMenuService = inject(MobileMenuService);

  //======= SIGNALS =======

  openMenu = this.mobileMenuService.isNavbarOpen;
  isAdmin = this.authService.isAdmin;
  isLoggedIn = this.authService.isLoggedIn;

  private readonly navigationEvents = toSignal(
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  //======= COMPUTED =======

  flameClass = computed(() => {
    const event = this.navigationEvents();
    if (!event) return '';
    const url = (event as NavigationEnd).url;
    if (url.includes('/marsball')) return 'marsball';
    if (url.includes('/terraformars')) return 'terraformars';
    if (url.includes('/chroniques')) return 'chroniques';
    if (url.includes('/archives')) return 'archives';
    return '';
  });

  //======= ACTIONS =======

  toggleMenu(): void {
    this.mobileMenuService.toggleNavbar();
  }

  onClick(): void {
    this.mobileMenuService.closeAll();
  }

  //======= AUTH ACTIONS =======

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

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
    this.onClick();
  }
}