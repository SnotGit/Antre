import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PublicStoriesService } from '../services/public-stories.service';
import { TypingEffectService } from '../../../shared/services/typing-effect.service';
import { StoryCard } from './story-card/story-card';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCard],
  templateUrl: './chroniques.html',
  styleUrl: './chroniques.scss'
})
export class Chroniques implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private router = inject(Router);
  private storiesService = inject(PublicStoriesService);
  private typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Les Chroniques de Mars';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING ============
  
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

  //============ LIFECYCLE ============

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
  }

  //============ ACTIONS ============

  onStoryCardClick(storyCard: any): void {
    const cleanTitle = storyCard.storyTitle
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-àéèêîôùûüÿç]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    this.router.navigate(['/chroniques', storyCard.username, cleanTitle]);
  }
}