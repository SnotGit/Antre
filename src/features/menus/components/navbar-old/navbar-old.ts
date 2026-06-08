import { Component, inject, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { MobileMenuService } from '../../services/mobile-menu.service';
import { Searchbar } from '@shared/components/searchbar/searchbar';

@Component({
  selector: 'app-navbar-old',
  imports: [NgClass, RouterLink, RouterLinkActive, Searchbar],
  templateUrl: './navbar-old.html',
  styleUrls: ['./navbar-old.scss']
})
export class NavbarOld {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mobileMenuService = inject(MobileMenuService);

  //======= SIGNALS =======

  openMenu = this.mobileMenuService.isNavbarOpen;
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;

  //======= COMPUTED =======

  avatarUrl = computed(() => {
    const user = this.currentUser();
    if (!user?.avatar) {
      return '/assets/images/default-avatar.png';
    }
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}${user.avatar}`;
  });

  //======= ACTIONS =======

  toggleMenu(): void {
    this.mobileMenuService.toggleNavbar();
  }

  onClick(): void {
    this.mobileMenuService.closeAll();
  }

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
    this.onClick();
  }
}
