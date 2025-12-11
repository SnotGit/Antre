import { Component, inject, computed, resource, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { PublicStoriesService } from '@features/chroniques/services/public-stories.service';
import { LikeService } from '@features/user/services/like.service';
import { TitleResolver } from '@shared/utilities/resolvers/title-resolver';
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
  private readonly publicStoriesService = inject(PublicStoriesService);
  private readonly likeService = inject(LikeService);
  private readonly titleResolver = inject(TitleResolver);
  private readonly API_URL = environment.apiUrl;

  //======= ROUTER INPUTS =======
  
  username = input.required<string>();
  titleUrl = input.required<string>();

  //======= STORY DATA RESOURCE =======

  storyData = resource({
    params: () => ({
      storyId: history.state?.storyId || 0,
      userId: history.state?.userId || 0,
      username: this.username(),
      titleUrl: this.titleUrl()
    }),
    loader: async ({ params }) => {
      try {
        if (params.storyId && params.userId) {
          const [story, userStories] = await Promise.all([
            this.publicStoriesService.getUserStory(params.storyId),
            this.publicStoriesService.getUserStories(params.userId)
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

  //======= LIKE ACTIONS =======

  async toggleLike(): Promise<void> {
    const data = this.storyData.value();
    if (!data?.story || !this.canLike()) return;

    try {
      await this.likeService.toggleLike(data.story.id);
      
      const updatedData = {
        ...data,
        story: {
          ...data.story,
          isliked: !data.story.isliked,
          likes: data.story.isliked ? data.story.likes - 1 : data.story.likes + 1
        }
      };

      // Force resource update
      this.storyData.reload();
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  }

  //======= NAVIGATION =======

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory) return;

    const titleUrl = this.titleResolver.encodeTitle(data.nextStory.title);
    this.router.navigate(['/chroniques', this.username(), titleUrl], {
      state: {
        storyId: data.nextStory.id,
        userId: history.state?.userId,
        username: this.username(),
        title: data.nextStory.title
      }
    });
  }

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory) return;

    const titleUrl = this.titleResolver.encodeTitle(data.previousStory.title);
    this.router.navigate(['/chroniques', this.username(), titleUrl], {
      state: {
        storyId: data.previousStory.id,
        userId: history.state?.userId,
        username: this.username(),
        title: data.previousStory.title
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/chroniques']);
  }
}