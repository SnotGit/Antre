import { Component, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { PublicStoriesService } from '../../../../services/public-stories.service';

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
  private stories = inject(PublicStoriesService);

  private routeParams = toSignal(
    this.route.params.pipe(map(params => ({ 
      username: params['username'],
      storyId: parseInt(params['id']) 
    }))),
    { initialValue: { username: '', storyId: 0 } }
  );

  storyData = resource({
    params: () => ({ storyId: this.routeParams().storyId }),
    loader: async ({ params }) => {
      const story = await this.stories.getStoryById(params.storyId);
      if (!story) return null;
      
      const userStories = await this.stories.getUserStories(story.user!.id);
      const currentIndex = userStories.findIndex(s => s.id === params.storyId);
      
      return {
        story: story!,
        userStories,
        currentIndex,
        hasNext: currentIndex > 0,
        hasPrevious: currentIndex < userStories.length - 1,
        nextStory: currentIndex > 0 ? userStories[currentIndex - 1] : null,
        previousStory: currentIndex < userStories.length - 1 ? userStories[currentIndex + 1] : null
      };
    }
  });

  canLike = computed(() => {
    const user = this.auth.currentUser();
    const data = this.storyData.value();
    return this.auth.isLoggedIn() && 
           user && 
           data?.story && 
           user.id !== data.story.user!.id;
  });

  async toggleLike(): Promise<void> {
    const storyId = this.routeParams().storyId;
    if (!storyId || !this.canLike()) return;

    await this.stories.toggleLike(storyId);
    this.storyData.reload();
  }

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;
    
    this.router.navigate(['/chroniques', this.routeParams().username, data.nextStory.id]);
  }

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory) return;
    
    this.router.navigate(['/chroniques', this.routeParams().username, data.previousStory.id]);
  }
}