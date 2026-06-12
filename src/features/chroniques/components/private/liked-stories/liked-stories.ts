import { Component, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';

import { LikeService, LikedStory, ReceivedLike } from '@features/chroniques/services/like.service';
import { AuthService } from '@shared/services/auth/auth.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-liked-stories',
  imports: [],
  templateUrl: './liked-stories.html',
  styleUrl: './liked-stories.scss',
})
export class LikedStories {

  //======= INJECTIONS =======

  private readonly likeService = inject(LikeService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly API_URL = environment.apiUrl;

  //======= MODE =======

  mode = signal<'received' | 'posted'>('posted');

  //======= DATA LOADING =======

  private readonly likesResource = resource({
    params: () => ({ mode: this.mode() }),
    loader: async ({ params }) => {
      if (params.mode === 'received') {
        const response = await this.likeService.getReceivedLikesList();
        return { type: 'received' as const, data: response.receivedLikes };
      } else {
        const response = await this.likeService.getPostedLikesList();
        return { type: 'posted' as const, data: response.likedStories };
      }
    }
  });

  receivedLikes = computed((): ReceivedLike[] => {
    const value = this.likesResource.value();
    return value?.type === 'received' ? value.data : [];
  });

  postedLikes = computed((): LikedStory[] => {
    const value = this.likesResource.value();
    return value?.type === 'posted' ? value.data : [];
  });

  //======= COMPUTED =======

  hasLikes = computed(() => {
    return this.mode() === 'received'
      ? this.receivedLikes().length > 0
      : this.postedLikes().length > 0;
  });

  //======= MODE METHODS =======

  setMode(mode: 'received' | 'posted'): void {
    this.mode.set(mode);
  }

  //======= ACTIONS =======

  onPostedStoryClick(story: LikedStory): void {
    if (!story.slug) return;
    this.router.navigate(['/chroniques', story.user.username, story.slug]);
  }

  onReceivedStoryClick(story: ReceivedLike): void {
    if (!story.slug) return;
    const username = this.authService.currentUser()?.username;
    if (!username) return;
    this.router.navigate(['/chroniques', username, story.slug]);
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
