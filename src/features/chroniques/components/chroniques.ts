import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoadService } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { StoryCard } from './story-card/story-card';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCard],
  templateUrl: './chroniques.html',
  styleUrl: './chroniques.scss'
})
export class Chroniques implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly loadService = inject(LoadService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Les Chroniques de Mars';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING ============
  
  private storiesResource = resource({
    loader: async () => {
      return await this.loadService.getLatest();
    }
  });

  storyCards = computed(() => {
    const stories = this.storiesResource.value() || [];
    return stories.map(story => ({
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
    this.typingService.destroy();
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