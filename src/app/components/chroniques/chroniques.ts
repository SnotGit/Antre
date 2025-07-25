import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicStoriesService } from '../../services/public-stories.service';
import { TypingEffectService } from '../../services/typing-effect.service';
import { StoryCard } from './stories/story-card/story-card';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCard],
  templateUrl: './chroniques.html',
  styleUrl: './chroniques.scss'
})
export class Chroniques implements OnInit, OnDestroy {

  private router = inject(Router);
  private storiesService = inject(PublicStoriesService);
  private typingService = inject(TypingEffectService);

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
  });

  headerTitle = this.typingEffect.headerTitle;
  typing = this.typingEffect.typingComplete;

  private storiesResource = resource({
    loader: async () => {
      return await this.storiesService.getLatestStories();
    }
  });

  storyCards = computed(() => {
    const apiStories = this.storiesResource.value() || [];
    return apiStories.map(story => ({
      storyId: story.id,
      username: story.user?.username || '',
      avatar: story.user?.avatar || '',
      storyTitle: story.title,
      storyDate: story.publishDate
    }));
  });

  ngOnInit(): void {
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  onStoryCardClick(storyCard: any): void {
    this.router.navigate(['/chroniques', storyCard.username, storyCard.storyTitle]);
  }
}