import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LoadService, Published } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-published-list',
  imports: [CommonModule],
  templateUrl: './published-list.html',
  styleUrl: './published-list.scss'
})
export class PublishedList implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Histoires Publiées';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING ============

  private readonly publishedResource = resource({
    loader: async () => {
      return await this.loadService.getPublished();
    }
  });

  publishedCards = computed((): Published[] => {
    return this.publishedResource.value() || [];
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

  //============ ACTIONS ============

  onPublishedCardClick(story: Published): void {
    this.router.navigate(['/chroniques/mes-histoires/publiée/edition', story.title]);
  }

  //============ UTILS ============

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}