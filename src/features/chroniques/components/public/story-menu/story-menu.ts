import { Component, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { PublicStoriesService } from '@features/chroniques/services/public-stories.service';
import { StoryCard } from '@features/chroniques/models/chroniques.models';

@Component({
  selector: 'app-story-menu',
  imports: [DatePipe],
  templateUrl: './story-menu.html',
  styleUrl: './story-menu.scss'
})
export class StoryMenu {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly publicStoriesService = inject(PublicStoriesService);

  private readonly API_URL = environment.apiUrl;

  //======= DATA LOADING =======

  protected readonly latestStoriesResource = this.publicStoriesService.latestStories;

  storyCards = computed((): StoryCard[] => {
    return this.latestStoriesResource.value() || [];
  });

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
