import { Component, computed, effect, inject, input, OnDestroy, resource, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { AuthService } from '@features/auth/services/auth.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { PublicStoriesService } from '@features/chroniques/services/public-stories.service';
import { TitleService } from '@shared/components/title/services/title.service';

@Component({
  selector: 'app-story-reader',
  standalone: true,
  imports: [],
  templateUrl: './story-reader.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './story-reader.scss'
})
export class StoryReader implements OnDestroy {

  //======= INJECTIONS =======//

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly publicStoriesService = inject(PublicStoriesService);
  private readonly likeService = inject(LikeService);
  private readonly titleService = inject(TitleService);

  private readonly API_URL = environment.apiUrl;

  //======= ROUTER INPUTS =======//

  readonly username = input.required<string>();
  readonly slug = input.required<string>();

  //======= STORY DATA RESOURCE =======//

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

        const userStories = await this.publicStoriesService.getStoryById(story.user.id);
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

  //======= COMPUTED =======//

  readonly canLike = computed(() => {

    const user = this.authService.currentUser();

    const data = this.storyData.value();

    return !!(
      this.authService.isLoggedIn() &&
      user &&
      data?.story &&
      user.id !== data.story.user?.id
    );

  });

  readonly avatarUrl = computed(() => {

    const data = this.storyData.value();

    const avatar = data?.story?.user?.avatar;

    return avatar
      ? `url(${this.API_URL.replace('/api', '')}${avatar})`
      : '';

  });

  readonly storyCode = computed(() => {

    const id = this.storyData.value()?.story?.id;

    return id
      ? `TEM-${String(id).padStart(4, '0')}`
      : '';

  });

  //======= EFFECTS =======//

  private readonly titleEffect = effect(() => {

    const data = this.storyData.value();

    if (data?.story?.title) {
      this.titleService.setOverrideTitle(data.story.title);
    }

  });

  //======= LIFECYCLE =======//

  ngOnDestroy(): void {
    this.titleService.setOverrideTitle(null);
  }

  //======= LIKE ACTIONS =======//

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

  //======= NAVIGATION =======//

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