import { Component, inject, computed, resource, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-story-reader',
  imports: [],
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
  titleUrl = input.required<string>();

  //======= ROUTER STATE =======

  private readonly routerState = history.state;
  private readonly storyId = this.routerState?.storyId || 0;
  private readonly userId = this.routerState?.userId || 0;

  //======= STORY DATA RESOURCE =======

  storyData = resource({
    params: () => ({
      storyId: this.storyId,
      userId: this.userId,
      username: this.username(),
      titleUrl: this.titleUrl()
    }),
    loader: async ({ params }) => {
      try {
        if (params.storyId && params.userId) {
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
        } else {
          this.router.navigate(['/chroniques']);
          return null;
        }
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
    
    const resolvedTitle = this.chroniquesResolver.encodeTitle(data.previousStory.title);
    this.router.navigate(['/chroniques', data.story.user?.username, resolvedTitle], {
      state: {
        storyId: data.previousStory.id,
        userId: data.story.user?.id,
        username: data.story.user?.username,
        title: data.previousStory.title
      }
    });
  }

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;
    
    const resolvedTitle = this.chroniquesResolver.encodeTitle(data.nextStory.title);
    this.router.navigate(['/chroniques', data.story.user?.username, resolvedTitle], {
      state: {
        storyId: data.nextStory.id,
        userId: data.story.user?.id,
        username: data.story.user?.username,
        title: data.nextStory.title
      }
    });
  }
}