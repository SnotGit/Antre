import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';
import { StoryCard } from '../story-card/story-card';

interface StoryCardData {
  id: number;
  storyTitle: string;
  storyDate: string;
}

@Component({
  selector: 'app-stories',
  imports: [CommonModule, StoryCard],
  templateUrl: './my-stories.html',
  styleUrl: './my-stories.scss'
})
export class MyStories implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);
  private typingService = inject(TypingEffectService);

  //============ SIGNALS ============

  currentMode = signal<string>('overview');

  //============ COMPUTED ============

  stats = this.privateStoriesService.stats;
  
  isOverviewMode = computed(() => this.currentMode() === 'overview');
  isListMode = computed(() => this.currentMode() === 'drafts' || this.currentMode() === 'published');

  stories = computed((): StoryCardData[] => {
    if (this.currentMode() === 'drafts') {
      return this.privateStoriesService.drafts().map(draft => ({
        id: draft.id,
        storyTitle: draft.title,
        storyDate: this.formatDate(draft.lastModified)
      }));
    }
    
    if (this.currentMode() === 'published') {
      return this.privateStoriesService.published().map(story => ({
        id: story.id,
        storyTitle: story.title,
        storyDate: this.formatDate(story.lastModified)
      }));
    }
    
    return [];
  });

  //============ TYPING EFFECT ============

  private typingEffect: any;
  headerTitle: any;
  typing: any;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.detectModeFromUrl();
    this.initializeTypingEffect();
    this.loadUserData();
  }

  private async loadUserData(): Promise<void> {
    await this.privateStoriesService.initializeUserData();
  }

  private initializeTypingEffect(): void {
    this.typingEffect = this.typingService.createTypingEffect({
      text: this.getHeaderText(),
      speed: 100,
      finalBlinks: 3
    });
    
    this.headerTitle = this.typingEffect.headerTitle;
    this.typing = this.typingEffect.typingComplete;
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    if (this.typingEffect) {
      this.typingEffect.cleanup();
    }
  }

  //============ MODE MANAGEMENT ============

  private detectModeFromUrl(): void {
    const url = this.router.url;
    
    if (url.includes('/drafts')) {
      this.currentMode.set('drafts');
    } else if (url.includes('/published')) {
      this.currentMode.set('published');
    } else {
      this.currentMode.set('overview');
    }
  }

  private getHeaderText(): string {
    const mode = this.currentMode();
    switch (mode) {
      case 'drafts': return 'Brouillons';
      case 'published': return 'Histoires Publiées';
      default: return 'Mes Histoires';
    }
  }

  //============ NAVIGATION ============

  goToDrafts(): void {
    this.router.navigate(['/chroniques/my-stories/drafts']);
  }

  goToPublished(): void {
    this.router.navigate(['/chroniques/my-stories/published']);
  }

  onStoryClick(story: StoryCardData): void {
    this.router.navigate(['/chroniques/editor', story.id]);
  }

  //============ UTILITIES ============

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}