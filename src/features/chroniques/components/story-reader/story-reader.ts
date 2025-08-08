import { Component, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../user/services/auth.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { LikeService } from '@features/chroniques/services/like.service';

interface PublicStoryData {
  storyId: number;
  userId: number;
}

@Component({
  selector: 'app-story-reader',
  imports: [CommonModule],
  templateUrl: './story-reader.html',
  styleUrl: './story-reader.scss'
})
export class Story {
  
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly likeService = inject(LikeService);

  //============ RESOLVER DATA ============

  private resolvedData = computed(() => {
    return this.route.snapshot.data['data'] as PublicStoryData;
  });

  //============ STORY DATA ============

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
    }
  });

  //============ PERMISSIONS ============

  canLike = computed(() => {
    const user = this.auth.currentUser();
    const data = this.storyData.value();
    return this.auth.isLoggedIn() && 
           user && 
           data?.story && 
           user.id !== data.story.user?.id;
  });

  //============ ACTIONS ============

  async toggleLike(): Promise<void> {
    const data = this.storyData.value();
    if (!data?.story || !this.canLike()) return;
    
    await this.likeService.toggle(data.story.id);
    this.storyData.reload();
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