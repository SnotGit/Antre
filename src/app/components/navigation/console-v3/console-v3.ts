import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-console-v3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './console-v3.html',
  styleUrls: ['./console-v3.scss']
})
export class ConsoleV3 implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;

  private currentRoute = signal<string>('');
  isCollapsed = signal<boolean>(true);

  isInChroniques = computed(() => this.currentRoute().includes('/chroniques'));
  isInAccount = computed(() => this.currentRoute().includes('/mon-compte'));

  showUserButtons = computed(() => {
    return this.isLoggedIn() && this.isInChroniques() && !this.isInAccount();
  });

  showAdminButtons = computed(() => {
    return this.isLoggedIn() && this.isAdmin() && !this.isInChroniques() && !this.isInAccount();
  });

  shouldShowUserButtons = this.showUserButtons;
  shouldShowAdminButtons = this.showAdminButtons;

  ngOnInit(): void {
    this.updateCurrentRoute();
    this.router.events.subscribe(() => {
      this.updateCurrentRoute();
    });
  }

  private updateCurrentRoute(): void {
    this.currentRoute.set(this.router.url);
  }

  toggleConsole(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  openLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  openRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  logout(): void {
    this.authService.logout();
  }

  addCategory(): void {
    // TODO: Implémenter ajout de catégorie
  }

  addList(): void {
    // TODO: Implémenter ajout de liste
  }

  addItem(): void {
    // TODO: Implémenter ajout d'item
  }

  newStory(): void {
    this.router.navigate(['/chroniques/editor/new']);
  }

  myStories(): void {
    this.router.navigate(['/chroniques/story-board']);
  }

  editCurrentStory(): void {
    // TODO: Implémenter édition d'histoire
  }

  deleteCurrentStory(): void {
    // TODO: Implémenter suppression d'histoire
  }

  publishCurrentStory(): void {
    // TODO: Implémenter publication d'histoire
  }

  openAccount(): void {
    this.router.navigate(['/mon-compte']);
  }

  getCurrentUserName(): string {
    return this.currentUser()?.username || 'GUEST';
  }

  getCurrentUserLevel(): string {
    return this.currentUser()?.role?.toUpperCase() || 'VISITOR';
  }
}