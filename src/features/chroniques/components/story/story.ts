import { Component, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/services/auth.service';
import { PublicStoriesService } from '../../services/public-stories.service';
import { PrivateStoriesService } from '../../services/private-stories.service';

interface PublicStoryData {
  storyId: number;
  userId: number;
}

@Component({
  selector: 'app-story',
  imports: [CommonModule],
  templateUrl: './story.html',
  styleUrl: './story.scss'
})
export class Story {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private publicStories = inject(PublicStoriesService);
  private privateStories = inject(PrivateStoriesService);

  //============ RESOLVER DATA ============

  private routeData = toSignal(this.route.data);
  private resolvedData = computed(() => this.routeData()?.['data'] as PublicStoryData);

  //============ STORY DATA ============

  storyData = resource({
    params: () => ({ 
      storyId: this.resolvedData()?.storyId, 
      userId: this.resolvedData()?.userId 
    }),
    loader: async ({ params }) => {
      if (!params.storyId || !params.userId) return null;

      const [story, userStories] = await Promise.all([
        this.publicStories.getStoryById(params.storyId),
        this.publicStories.getUserStories(params.userId)
      ]);

      if (!story) return null;

      const currentIndex = userStories.findIndex(s => s.id === params.storyId);

      return {
        story: { 
          ...story, 
          isliked: typeof story.isliked === 'boolean' ? story.isliked : false 
        },
        userStories,
        currentIndex,
        hasNext: currentIndex > 0,
        hasPrevious: currentIndex < userStories.length - 1,
        nextStory: currentIndex > 0 ? userStories[currentIndex - 1] : null,
        previousStory: currentIndex < userStories.length - 1 ? userStories[currentIndex + 1] : null
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
    
    await this.privateStories.toggleLike(data.story.id);
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