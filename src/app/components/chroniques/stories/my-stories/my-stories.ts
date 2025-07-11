import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';

interface CardData {
  id: number;
  storyTitle: string;
  storyDate: string;
  slug: string;
}

@Component({
  selector: 'app-my-stories',
  imports: [CommonModule],
  templateUrl: './my-stories.html',
  styleUrl: './my-stories.scss'
})
export class MyStories implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);
  private typingService = inject(TypingEffectService);

  currentMode = toSignal(
    this.route.url.pipe(map(segments => {
      const lastPath = segments[segments.length - 1]?.path;
      if (lastPath === 'drafts') return 'drafts';
      if (lastPath === 'published') return 'published';
      return 'overview';
    })),
    { initialValue: 'overview' }
  );
  
  stats = this.privateStoriesService.stats;
  
  isOverviewMode = computed(() => this.currentMode() === 'overview');
  isListMode = computed(() => this.currentMode() !== 'overview');

  stories = computed((): CardData[] => {
    const mode = this.currentMode();
    if (mode === 'drafts') {
      return this.privateStoriesService.drafts().map(draft => ({
        id: draft.id,
        storyTitle: draft.title,
        storyDate: this.formatDate(draft.lastModified),
        slug: draft.slug
      }));
    }
    
    if (mode === 'published') {
      return this.privateStoriesService.published().map(storyItem => ({
        id: storyItem.id,
        storyTitle: storyItem.title,
        storyDate: this.formatDate(storyItem.lastModified),
        slug: storyItem.slug
      }));
    }
    
    return [];
  });

  headerText = computed(() => {
    const mode = this.currentMode();
    switch (mode) {
      case 'drafts': return 'Brouillons';
      case 'published': return 'Histoires Publiées';
      default: return 'Mes Histoires';
    }
  });

  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  typing = this.typingEffect.typingComplete;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.typingEffect.startTyping();
    this.privateStoriesService.initializeUserData();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  goToDrafts(): void {
    this.router.navigate(['/chroniques/my-stories/drafts']);
  }

  goToPublished(): void {
    this.router.navigate(['/chroniques/my-stories/published']);
  }

  onCardClick(story: CardData): void {
    if (!story.slug) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    if (this.currentMode() === 'drafts') {
      this.router.navigate(['/chroniques/editor', story.slug]);
    } else {
      this.router.navigate(['/chroniques', currentUser.username, 'édition', story.slug]);
    }
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}