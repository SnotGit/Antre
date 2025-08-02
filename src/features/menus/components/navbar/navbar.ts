import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { MobileMenuService } from '../../services/mobile-menu.service';

@Component({
  selector: 'app-navbar',
  imports: [NgClass, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss']
})
export class Navbar {
  private readonly authService = inject(AuthService);
  private readonly mobileMenuService = inject(MobileMenuService);

  //============ COMPUTED ============

  openMenu = this.mobileMenuService.isNavbarOpen;
  isAdmin = this.authService.isAdmin;

  //============ ACTIONS ============

  toggleMenu(): void {
    this.mobileMenuService.toggleNavbar();
  }

  onClick(): void {
    this.mobileMenuService.closeAll();
  }
}