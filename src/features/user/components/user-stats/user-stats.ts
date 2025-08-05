import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { UserService } from '@features/user/services/user.service';

@Component({
  selector: 'app-user-stats',
  imports: [],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.scss'
})
export class UserStats {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly UserService = inject(LUserService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  stats = this.userService.getStats();

  //============ COMPUTED ============

  UserStats = computed(() => {
    const stats = this.getStats();
    return {
      totalStories: stats.drafts + stats.published,
      publishedStories: stats.published,
      drafts: stats.drafts,
      totalLikes: stats.totalLikes
    };
  });

  accountCreatedDate = computed(() => {
    const user = this.currentUser();
    return user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '';
  });

  userRole = computed(() => {
    return this.currentUser()?.role?.toUpperCase() || 'USER';
  });

  //============ NAVIGATION ============

  showMyStories(): void {
    this.router.navigate(['/chroniques/mes-histoires']);
  }

  showMyPublishedStories(): void {
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }

  showMyDrafts(): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }
}