import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { PublicStoriesService, StoryCard } from '@features/chroniques/services/public-stories.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { StoryCardComponent } from './story-card/story-card';

@Component({
  selector: 'app-chroniques',
  imports: [StoryCardComponent],
  templateUrl: './chroniques.html',
  styleUrl: './chroniques.scss'
})
export class Chroniques implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly publicStoriesService = inject(PublicStoriesService);
  private readonly typingService = inject(TypingEffectService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);

  //======= TYPING EFFECT =======

  private readonly title = 'Les Chroniques de Mars';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA LOADING =======
  
  private readonly storiesResource = resource({
    loader: async () => {
      return await this.publicStoriesService.getLatestStories();
    }
  });

  storyCards = computed((): StoryCard[] => {
    return this.storiesResource.value() || [];
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= ACTIONS =======

  onStoryCardClick(storyCard: StoryCard): void {
    const titleUrl = this.chroniquesResolver.encodeTitle(storyCard.title);
    
    this.router.navigate(['/chroniques', storyCard.user.username, titleUrl], {
      state: { 
        storyId: storyCard.id,
        userId: storyCard.user.id,
        username: storyCard.user.username,
        title: storyCard.title
      }
    });
  }
}