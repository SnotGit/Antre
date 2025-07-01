import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicStoriesService } from '../../../core/services/public-stories.service';
import { TypingEffectService } from '../../../core/services/typing-effect.service';
import { StoryCardComponent } from './shared/story-card/story-card.component';

interface UserLatestStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  slug: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCardComponent],
  templateUrl: './chroniques.html',
  styleUrl: './chroniques.scss'
})
export class Chroniques implements OnInit, OnDestroy {

  private router = inject(Router);
  private publicStoriesService = inject(PublicStoriesService);
  private typingService = inject(TypingEffectService);

  stories = signal<UserLatestStory[]>([]);
  loading = signal(false);

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  showCursor = this.typingEffect.showCursor;
  typingComplete = this.typingEffect.typingComplete;

  ngOnInit(): void {
    this.typingEffect.startTyping();
    this.loadLatestStories();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  private async loadLatestStories(): Promise<void> {
    this.loading.set(true);
    try {
      const latestStories = await this.publicStoriesService.getLatestStories();
      this.stories.set(latestStories);
    } catch (error) {
      this.stories.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  navigateToStory(slug: string): void {
    this.router.navigate(['/chroniques/story', slug]);
  }

  navigateToUserProfile(username: string): void {
    this.router.navigate(['/user-profile', username]);
  }
}