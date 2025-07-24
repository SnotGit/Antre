import { Component, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { PublicStoriesService } from '../../../../services/public-stories.service';
import { PrivateStoriesService } from '../../../../services/private-stories.service';

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

  private stories = this.publicStories;

  private routeParams = toSignal(
    this.route.params.pipe(map(params => ({ 
      username: params['username'],
      storyTitle: params['title']
    }))),
    { initialValue: { username: '', storyTitle: '' } }
  );

  storyData = resource({
    params: () => ({ username: this.routeParams().username, title: this.routeParams().storyTitle }),
    loader: async ({ params }) => {
      const userStories = await this.stories.getUserStories(params.username);
      const currentIndex = userStories.findIndex(s => s.title === params.title);
      const story = currentIndex !== -1 ? await this.stories.getStoryById(userStories[currentIndex].id) : null;
      if (!story) return null;

      // Ensure isliked property exists on story
      const storyWithIsLiked = { ...story, isliked: typeof story.isliked === 'boolean' ? story.isliked : false };

      return {
        story: storyWithIsLiked,
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
    const data = this.storyData.value();
    if (!data?.story || !this.canLike()) return;
    await this.privateStories.toggleLike(data.story.id);
    this.storyData.reload();
  }

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;
    
    this.router.navigate(['/chroniques', this.routeParams().username, data.nextStory.title]);
  }

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory) return;
    
    this.router.navigate(['/chroniques', this.routeParams().username, data.previousStory.title]);
  }
}