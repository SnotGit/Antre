import { Component, inject, computed, resource, input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { PublicStoriesService } from '@features/chroniques/services/public-stories.service';
import { LikeService } from '@features/user/services/like.service';
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
  private readonly API_URL = environment.apiUrl;

  //======= ROUTER INPUTS =======

  username = input.required<string>();
  slug = input.required<string>();

  //======= STORY DATA RESOURCE =======

  storyData = resource({
    params: () => ({
      username: this.username(),
      slug: this.slug()
    }),
    loader: async ({ params }) => {
      try {
        const story = await this.publicStoriesService.getStoryBySlug(params.username, params.slug);

        if (!story) {
          this.router.navigate(['/chroniques']);
          return null;
        }

        const userStories = await this.publicStoriesService.getUserStories(story.user.id);
        const currentStory = userStories.findIndex(s => s.id === story.id);

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
      } catch {
        this.router.navigate(['/chroniques']);
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
      this.storyData.reload();
    } catch {
      // Ignore like errors
    }
  }

  //======= NAVIGATION =======

  goToNextStory(): void {
    const data = this.storyData.value();
    if (!data?.hasNext || !data.nextStory?.slug) return;

    this.router.navigate(['/chroniques', this.username(), data.nextStory.slug]);
  }

  goToPreviousStory(): void {
    const data = this.storyData.value();
    if (!data?.hasPrevious || !data.previousStory?.slug) return;

    this.router.navigate(['/chroniques', this.username(), data.previousStory.slug]);
  }

  goBack(): void {
    this.router.navigate(['/chroniques']);
  }
}
