import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth';
import { MobileMenuService } from '@features/menus/services/mobile-menu.service';

interface SectionConfig {
  itemLabel: string;
  itemRoute: string;
}

@Component({
  selector: 'app-console-v3',
  imports: [CommonModule],
  templateUrl: './console-v3.html',
  styleUrls: ['./console-v3.scss']
})
export class ConsoleV3 {

  //======= INJECTIONS =======
  
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly mobileMenuService = inject(MobileMenuService);

  //======= CONFIGURATION =======

  private readonly sectionsConfig: Record<string, SectionConfig> = {
    marsball: {
      itemLabel: 'AJOUTER ITEM',
      itemRoute: '/marsball/admin/nouvel-item'
    },
    archives: {
      itemLabel: 'AJOUTER ARCHIVE',
      itemRoute: '/archives/admin/nouvelle-archive'
    },
    terraformars: {
      itemLabel: 'AJOUTER ITEM',
      itemRoute: '/terraformars/admin/nouvel-item'
    }
  };

  //======= SIGNALS =======

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;
  openMenu = this.mobileMenuService.isConsoleOpen;

  //======= COMPUTED =======

  currentSection(): string | null {
    const url = this.router.url;
    return Object.keys(this.sectionsConfig).find(section => url.includes(`/${section}`)) || null;
  }

  sectionConfig(): SectionConfig | null {
    const section = this.currentSection();
    return section ? this.sectionsConfig[section] : null;
  }

  categoryLabel(): string {
    return 'AJOUTER CATEGORIE';
  }

  itemLabel(): string {
    return this.sectionConfig()?.itemLabel || 'AJOUTER ITEM';
  }

  showUserActions(): boolean {
    return this.isLoggedIn() && this.router.url.includes('/chroniques');
  }

  showAdminActions(): boolean {
    return this.isAdmin() && this.currentSection() !== null;
  }

  CurrentStatus(): string {
    return this.currentUser() ? 'CONNECTÉ' : 'DÉCONNECTÉ';
  }

  CurrentUserName(): string {
    return this.currentUser()?.username || 'INCONNU';
  }

  CurrentUserLevel(): string {
    return this.currentUser()?.role?.toUpperCase() || 'VISITEUR';
  }

  //======= CONSOLE ACTIONS =======

  toggleMenu(): void {
    this.mobileMenuService.toggleConsole();
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

  //======= USER ACTIONS =======

  newStory(): void {
    const username = this.authService.currentUser()?.username;
    this.router.navigate(['/chroniques', username, 'edition', 'nouvelle-histoire']);
    this.onClick();
  }

  myStories(): void {
    const username = this.authService.currentUser()?.username;
    this.router.navigate(['/chroniques', username, 'mes-histoires']);
    this.onClick();
  }

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
    this.onClick();
  }

  //======= ADMIN CONTENT ACTIONS =======

  addCategory(): void {
    const section = this.currentSection();
    if (!section) return;
    this.router.navigate([`/${section}/admin/nouvelle-categorie`]);
    this.onClick();
  }

  addItem(): void {
    const config = this.sectionConfig();
    if (!config) return;
    this.router.navigate([config.itemRoute]);
    this.onClick();
  }
}