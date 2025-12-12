import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LikeService, LikedStory, ReceivedLike } from '@features/user/services/like.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
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
  private readonly route = inject(ActivatedRoute);
  private readonly titleResolver = inject(TitleResolver);
  private readonly typingService = inject(TypingEffectService);
  private readonly API_URL = environment.apiUrl;

  //======= MODE =======

  private readonly _mode = (this.route.snapshot.data['mode'] as 'received' | 'posted') || 'posted';
  
  mode = computed(() => this._mode);

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA LOADING =======

  private readonly likesResource = resource({
    params: () => ({ mode: this._mode }),
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
    return this._mode === 'received' 
      ? this.receivedLikes().length > 0 
      : this.postedLikes().length > 0;
  });

  title = computed(() => {
    return this._mode === 'received' ? 'Likes Reçus' : 'Histoires Likées';
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title());
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= ACTIONS =======

  onPostedStoryClick(story: LikedStory): void {
    const titleUrl = this.titleResolver.encodeTitle(story.title);
    
    this.router.navigate(['/chroniques', story.user.username, titleUrl], {
      state: {
        storyId: story.storyId,
        userId: story.user.id,
        username: story.user.username,
        title: story.title
      }
    });
  }

  onReceivedStoryClick(story: ReceivedLike): void {
    const username = this.router.getCurrentNavigation()?.extras?.state?.['username'] 
      || history.state?.username;
    
    if (!username) return;

    const titleUrl = this.titleResolver.encodeTitle(story.title);

    this.router.navigate(['/chroniques', username, titleUrl], {
      state: {
        storyId: story.storyId,
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

  //======= NAVIGATION =======

  goBack(): void {
    this.router.navigate(['/mon-compte/mes-likes']);
  }
}