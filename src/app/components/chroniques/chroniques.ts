import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicStoriesService } from '../../services/public-stories.service';
import { TypingEffectService } from '../../services/typing-effect.service';
import { StoryCard } from './stories/story-card/story-card';

interface StoryData {
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

interface FormattedStory {
  slug: string;
  username: string;
  storyTitle: string;
  storyDate: string;
  avatar: string;
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

  private apiStories = signal<StoryData[]>([]);
  loading = signal(false);

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  showCursor = this.typingEffect.showCursor;
  typing = this.typingEffect.typingComplete;

  stories = computed(() => {
    return this.apiStories().map(story => ({
      slug: story.slug,
      username: story.user.username,
      storyTitle: story.title,
      storyDate: story.publishDate,
      avatar: story.user.avatar || ''
    }));
  });

  ngOnInit(): void {
    this.typingEffect.startTyping();
    this.loadLatestStories();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  private async loadLatestStories(): Promise<void> {
    this.loading.set(true);
    
    const stories = await this.publicStoriesService.getLatestStories();
    this.apiStories.set(stories);
    
    this.loading.set(false);
  }

  onStoryClick(story: FormattedStory): void {
    this.router.navigate(['/chroniques/story', story.slug]);
  }
}