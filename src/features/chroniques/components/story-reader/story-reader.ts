import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../user/services/auth.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-story-reader',
  imports: [CommonModule],
  templateUrl: './story-reader.html',
  styleUrl: './story-reader.scss'
})
export class StoryReader implements OnInit, OnDestroy {
  
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly likeService = inject(LikeService);
  private readonly API_URL = environment.apiUrl;

  private resolvedData = computed(() => {
    return this.route.snapshot.data['data'] as { storyId: number; userId: number };
  });

  storyData = resource({
    params: () => {
      const data = this.resolvedData();
      return { 
        storyId: data?.storyId, 
        userId: data?.userId 
      };
    },
    loader: async ({ params }) => {
      if (!params.storyId || !params.userId) return null;

      try {
        const [story, userStories] = await Promise.all([
          this.loadService.getStory(params.storyId),
          this.loadService.getStories(params.userId)
        ]);

        if (!story) return null;

        const currentStory = userStories.findIndex(s => s.id === params.storyId);

        return {
          story: { 
            ...story, 
            isliked: typeof story.isliked === 'boolean' ? story.isliked : false 
          },
          userStories,
          currentStory,
          hasNext: currentStory > 0,
          hasPrevious: currentStory < userStories.length - 1,
          nextStory: currentStory > 0 ? userStories[currentStory - 1] : null,
          previousStory: currentStory < userStories.length - 1 ? userStories[currentStory + 1] : null
        };
      } catch (error) {
        return null;
      }
    }
  });

  canLike = computed(() => {
    const user = this.authService.currentUser();
    const data = this.storyData.value();
    return this.authService.isLoggedIn() && 
           user && 
           data?.story && 
           user.id !== data.story.user?.id;
  });

  avatarUrl = computed(() => {
    const data = this.storyData.value();
    const avatar = data?.story?.user?.avatar;
    return avatar ? `url(${this.API_URL.replace('/api', '')}${avatar})` : '';
  });

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  async toggleLike(): Promise<void> {
    const data = this.storyData.value();
    if (!data?.story || !this.canLike()) return;
    
    try {
      await this.likeService.toggle(data.story.id);
      this.storyData.reload();
    } catch (error) {
    }
  }

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory) return;
    
    const story = data.story;
    this.router.navigate(['/chroniques', story.user?.username, data.previousStory.title]);
  }

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;
    
    const story = data.story;
    this.router.navigate(['/chroniques', story.user?.username, data.nextStory.title]);
  }
}