import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { StatsService } from '@features/user/services/stats.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-my-stories',
  imports: [CommonModule],
  templateUrl: './my-stories.html',
  styleUrl: './my-stories.scss'
})
export class MyStories implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly statsService = inject(StatsService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Mes Histoires';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING AVEC GESTION D'ERREUR ============

  private statsResource = resource({
    loader: async () => {
      try {
        return await this.statsService.getStats();
      } catch (error) {
        console.warn('Erreur lors du chargement des stats:', error);
        return { drafts: 0, published: 0 };
      }
    }
  });

  stats = computed(() => {
    const resourceValue = this.statsResource.value();
    
    if (this.statsResource.isLoading()) {
      return { drafts: 0, published: 0 };
    }
    
    if (this.statsResource.error()) {
      console.warn('Resource en erreur:', this.statsResource.error());
      return { drafts: 0, published: 0 };
    }
    
    return resourceValue || { drafts: 0, published: 0 };
  });

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //============ NAVIGATION ============

  goToDrafts(): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }

  goToPublished(): void {
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }
}