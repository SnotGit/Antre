import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicStoriesService } from '../../../core/services/public-stories.service';
import { TypingEffectService } from '../../../core/services/typing-effect.service';
import { StoryCard } from './stories/story-card/story-card';

interface UserLatestStory {
  id: number;
  username: string;
  description: string;
  avatar: string | null;
  latestStory: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
  };
}

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCard],
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
      const apiStories = await this.publicStoriesService.getLatestStories();
      
      const formattedUsers = apiStories.map(story => ({
        id: story.user.id,
        username: story.user.username,
        description: story.user.description,
        avatar: story.user.avatar,
        latestStory: {
          id: story.id,
          title: story.title,
          slug: story.slug,
          publishedAt: story.publishDate
        }
      }));
      
      this.stories.set(formattedUsers);
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