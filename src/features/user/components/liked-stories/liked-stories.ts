import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LikeService, LikedStory } from '@features/user/services/like.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-liked-stories',
  imports: [CommonModule],
  templateUrl: './liked-stories.html',
  styleUrl: './liked-stories.scss',
})
export class LikedStories implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly likeService = inject(LikeService);
  private readonly router = inject(Router);
  private readonly chroniquesResolver = inject(ChroniquesResolver);
  private readonly typingService = inject(TypingEffectService);
  private readonly API_URL = environment.apiUrl;

  //======= TYPING EFFECT =======

  private readonly title = 'Histoires Likées';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA LOADING =======

  private readonly likedStoriesResource = resource({
    loader: async () => {
      const response = await this.likeService.getLikedStories();
      return response.likedStories;
    }
  });

  likedStories = computed((): LikedStory[] => {
    return this.likedStoriesResource.value() || [];
  });

  //======= COMPUTED =======

  hasLikedStories = computed(() => this.likedStories().length > 0);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= ACTIONS =======

  onStoryClick(story: LikedStory): void {
    const titleUrl = this.chroniquesResolver.encodeTitle(story.title);
    
    this.router.navigate(['/chroniques', story.user.username, titleUrl], {
      state: {
        storyId: story.storyId,
        userId: story.user.id,
        username: story.user.username,
        title: story.title
      }
    });
  }

  getAvatarUrl(avatar: string): string {
    return avatar ? `url(${this.API_URL.replace('/api', '')}${avatar})` : '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}