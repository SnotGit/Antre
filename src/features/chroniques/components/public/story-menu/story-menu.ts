import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { PublicStoriesService } from '@features/chroniques/services/public-stories.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { StoryCard } from '@features/chroniques/models/chroniques.models';

@Component({
  selector: 'app-story-menu',
  imports: [DatePipe],
  templateUrl: './story-menu.html',
  styleUrl: './story-menu.scss'
})
export class StoryMenu implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly publicStoriesService = inject(PublicStoriesService);
  private readonly typingService = inject(TypingEffectService);

  private readonly API_URL = environment.apiUrl;

  //======= TYPING EFFECT =======

  private readonly title = 'Les Chroniques de Mars';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA LOADING =======

  protected readonly latestStoriesResource = this.publicStoriesService.latestStories;

  storyCards = computed((): StoryCard[] => {
    return this.latestStoriesResource.value() || [];
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= AVATAR =======

  avatarBackground(story: StoryCard): string {
    const avatar = story.user.avatar;
    if (!avatar) return '';

    let baseUrl = this.API_URL.replace('/api', '');
    if (baseUrl.endsWith('/') && avatar.startsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    return `url('${baseUrl}${avatar}')`;
  }

  //======= ACTIONS =======

  onStoryCardClick(storyCard: StoryCard): void {
    if (!storyCard.slug) return;

    this.router.navigate([
      '/chroniques',
      storyCard.user.username,
      storyCard.slug
    ]);
  }
}
