import { Component, inject, computed, resource } from '@angular/core';
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
  private readonly userService = inject(UserService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;

  //============ DATA LOADING ============

  private statsResource = resource({
    loader: async () => {
      return await this.userService.getStats();
    }
  });

  stats = computed(() => {
    return this.statsResource.value() || { drafts: 0, published: 0, totalLikes: 0 };
  });

  //============ COMPUTED ============

  userStats = computed(() => {
    const statsData = this.stats();
    return {
      totalStories: statsData.drafts + statsData.published,
      publishedStories: statsData.published,
      draftsStories: statsData.drafts,
      totalLikes: statsData.totalLikes
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