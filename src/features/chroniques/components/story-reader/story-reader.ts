import { Component, inject, computed, resource, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../user/services/auth.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-story-reader',
  imports: [CommonModule],
  templateUrl: './story-reader.html',
  styleUrl: './story-reader.scss'
})
export class StoryReader {
  
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly likeService = inject(LikeService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);
  private readonly API_URL = environment.apiUrl;

  //======= ROUTER INPUTS =======
  
  username = input.required<string>();
  title = input.required<string>();

  //======= STORY DATA RESOURCE =======

  storyData = resource({
    params: () => ({
      username: this.username(),
      title: this.title()
    }),
    loader: async ({ params }) => {
      if (!params.username || !params.title) return null;

      try {
        const resolved = await this.chroniquesResolver.resolveStoryByUsernameAndTitle(
          params.username, 
          params.title
        );

        const [story, userStories] = await Promise.all([
          this.loadService.getStory(resolved.storyId),
          this.loadService.getStories(resolved.userId)
        ]);

        if (!story) return null;

        const currentStory = userStories.findIndex(s => s.id === resolved.storyId);

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

  //======= COMPUTED PROPERTIES =======

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

  //======= ACTIONS =======

  async toggleLike(): Promise<void> {
    const data = this.storyData.value();
    if (!data?.story || !this.canLike()) return;
    
    try {
      await this.likeService.toggle(data.story.id);
      this.storyData.reload();
    } catch (error) {
    }
  }

  //======= NAVIGATION =======

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory) return;
    
    const story = data.story;
    const url = this.chroniquesResolver.storyUrl(story.user?.username!, data.previousStory.title);
    this.router.navigateByUrl(url);
  }

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;
    
    const story = data.story;
    const url = this.chroniquesResolver.storyUrl(story.user?.username!, data.nextStory.title);
    this.router.navigateByUrl(url);
  }
}