import { Component, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { StatsService } from '@features/user/services/stats.service';

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
  private readonly statsService = inject(StatsService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;

  //============ DATA LOADING AVEC GESTION D'ERREUR ============

  private statsResource = resource({
    loader: async () => {
      try {
        return await this.statsService.getStats();
      } catch (error) {
        console.warn('Erreur lors du chargement des stats:', error);
        return { drafts: 0, published: 0, totalLikes: 0 };
      }
    }
  });

  stats = computed(() => {
    const resourceValue = this.statsResource.value();
    
    if (this.statsResource.isLoading()) {
      return { drafts: 0, published: 0, totalLikes: 0 };
    }
    
    if (this.statsResource.error()) {
      console.warn('Resource en erreur:', this.statsResource.error());
      return { drafts: 0, published: 0, totalLikes: 0 };
    }
    
    return resourceValue || { drafts: 0, published: 0, totalLikes: 0 };
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