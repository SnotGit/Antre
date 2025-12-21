import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth';
import { MobileMenuService } from '@features/menus/services/mobile-menu.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';

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
  private readonly consoleState = inject(ConsoleStateService);

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

  avatarUrl = computed(() => {
    const user = this.currentUser();
    if (!user?.avatar) {
      return '/assets/images/default-avatar.png';
    }
    const baseUrl = 'http://localhost:3000';
    return `${baseUrl}${user.avatar}`;
  });

  hasSelection = this.consoleState.hasSelection;

  currentSection(): string | null {
    const url = this.router.url;
    return Object.keys(this.sectionsConfig).find(section => url.includes(`/${section}`)) || null;
  }

  sectionConfig(): SectionConfig | null {
    const section = this.currentSection();
    return section ? this.sectionsConfig[section] : null;
  }

  isInBestiaire(): boolean {
    return this.router.url.includes('/marsball/bestiaire');
  }

  isInRover(): boolean {
    return this.router.url.includes('/marsball/rover');
  }

  categoryLabel(): string {
    return 'AJOUTER CATEGORIE';
  }

  itemLabel(): string {
    if (this.isInBestiaire()) {
      return 'AJOUTER CREATURE';
    }
    if (this.isInRover()) {
      return 'AJOUTER ITEM';
    }
    return this.sectionConfig()?.itemLabel || 'AJOUTER ITEM';
  }

  showUserActions(): boolean {
    return this.router.url.includes('/chroniques');
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

  //======= ADMIN CONTENT ACTIONS =======

  addCategory(): void {
    this.consoleState.openCreateCategory();
    this.onClick();
  }

  addItem(): void {
    this.consoleState.openCreateItem();
    this.onClick();
  }

  deleteSelection(): void {
    this.consoleState.deleteSelection();
    this.onClick();
  }
}