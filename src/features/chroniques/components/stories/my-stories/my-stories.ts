import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LoadService } from '@features/chroniques/services/load.service';
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
  private readonly loadService = inject(LoadService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Mes Histoires';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING ============

  private statsResource = resource({
    loader: async () => {
      return await this.loadService.loadStats();
    }
  });

  stats = computed(() => {
    return this.statsResource.value() || { drafts: 0, published: 0 };
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