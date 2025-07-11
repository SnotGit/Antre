import { Component, inject, signal, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { PublicStoriesService } from '../../../../services/public-stories.service';

interface StoryData {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

interface UserStoryList {
  stories: Array<{ id: number; publishDate: string }>;
  currentIndex: number;
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
  private authService = inject(AuthService);
  private storiesService = inject(PublicStoriesService);

  // ============ ROUTE PARAMS ============
  
  private routeParams = toSignal(
    this.route.params.pipe(map(params => ({ id: parseInt(params['id']) }))),
    { initialValue: { id: 0 } }
  );

  // ============ RESOURCES ============
  
  storyResource = resource({
    params: () => ({ id: this.routeParams().id }),
    loader: async ({ params }) => {
      return await this.storiesService.getStoryById(params.id);
    }
  });

  userStoriesResource = resource({
    params: () => {
      const story = this.storyResource.value();
      return story ? { userId: story.user.id, currentId: story.id } : null;
    },
    loader: async ({ params }) => {
      if (!params) return null;
      const userData = await this.storiesService.getUserProfile(params.userId.toString());
      if (!userData) return null;
      const stories = userData.stories || [];
      const currentIndex = stories.findIndex((s: any) => s.id === params.currentId);
      return {
        stories: stories.map((s: any) => ({ id: s.id, publishDate: s.publishDate })),
        currentIndex
      } as UserStoryList;
    }
  });

  // ============ STATE ============
  
  private likeCount = signal<number>(0);
  private isLikedState = signal<boolean>(false);
  private likePending = signal<boolean>(false);

  // ============ COMPUTED ============
  
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  
  story = computed(() => this.storyResource.value()?.story || '');
  storyTitle = computed(() => this.storyResource.value()?.title || '');
  publishDate = computed(() => this.storyResource.value()?.publishDate || '');
  
  username = computed(() => this.storyResource.value()?.user.username || '');
  userDescription = computed(() => this.storyResource.value()?.user.description || '');
  avatarUrl = computed(() => {
    const avatar = this.storyResource.value()?.user.avatar;
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  likesCount = computed(() => {
    const resourceLikes = this.storyResource.value()?.likes || 0;
    return this.likeCount() || resourceLikes;
  });

  isLiked = computed(() => this.isLikedState());

  canLike = computed(() => {
    const user = this.currentUser();
    const story = this.storyResource.value();
    return this.isLoggedIn() && user && story && user.id !== story.user.id;
  });

  hasPreviousStory = computed(() => {
    const nav = this.userStoriesResource.value();
    return nav ? nav.currentIndex < nav.stories.length - 1 : false;
  });

  hasNextStory = computed(() => {
    const nav = this.userStoriesResource.value();
    return nav ? nav.currentIndex > 0 : false;
  });

  // ============ ACTIONS ============
  
  async toggleLike(): Promise<void> {
    const story = this.storyResource.value();
    if (!story || !this.canLike() || this.likePending()) return;

    this.likePending.set(true);
    const result = await this.storiesService.toggleLike(story.id);
    this.isLikedState.set(result.liked);
    this.likeCount.set(result.totalLikes);
    this.likePending.set(false);
  }

  goToPreviousStory(): void {
    const nav = this.userStoriesResource.value();
    if (!nav || !this.hasPreviousStory()) return;
    const previousStory = nav.stories[nav.currentIndex + 1];
    if (previousStory) {
      this.router.navigate(['/chroniques', this.username(), previousStory.id]);
    }
  }

  goToNextStory(): void {
    const nav = this.userStoriesResource.value();
    if (!nav || !this.hasNextStory()) return;
    const nextStory = nav.stories[nav.currentIndex - 1];
    if (nextStory) {
      this.router.navigate(['/chroniques', this.username(), nextStory.id]);
    }
  }
}