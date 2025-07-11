import { Component, inject, signal, computed, resource } from '@angular/core';
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
  private authService = inject(AuthService);
  private storiesService = inject(PublicStoriesService);

  //======= SIGNALS ======
  
  private currentLikes = signal<number>(0);
  private userIsLiked = signal<boolean>(false);
  
  private routeParams = toSignal(
    this.route.params.pipe(map(params => ({ 
      username: params['username'],
      storyId: parseInt(params['id']) 
    }))),
    { initialValue: { username: '', storyId: 0 } }
  );

  //======= RESOURCES ======
  
  private storyResource = resource({
    params: () => ({ id: this.routeParams().storyId }),
    loader: async ({ params }) => {
      const story = await this.storiesService.getStoryById(params.id);
      if (story) {
        this.currentLikes.set(story.likes);
      }
      return story;
    }
  });

  private userStoriesResource = resource({
    params: () => {
      const story = this.storyResource.value();
      return story?.user ? { userId: story.user.id } : null;
    },
    loader: async ({ params }) => {
      if (!params) return [];
      const data = await this.storiesService.getUserProfile(params.userId);
      return data?.stories?.sort((a, b) => 
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
      ) || [];
    }
  });

  //======= COMPUTED ======

  private currentStoryIndex = computed(() => {
    const stories = this.userStoriesResource.value();
    const currentId = this.routeParams().storyId;
    return stories?.findIndex(s => s.id === currentId) ?? -1;
  });

  avatarUrl = computed(() => {
    const avatar = this.storyResource.value()?.user?.avatar;
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  username = computed(() => this.storyResource.value()?.user?.username || '');
  
  userDescription = computed(() => this.storyResource.value()?.user?.description || '');

  likesCount = computed(() => this.currentLikes());

  isLiked = computed(() => this.userIsLiked());

  storyTitle = computed(() => this.storyResource.value()?.title || '');

  publishDate = computed(() => this.storyResource.value()?.publishDate || '');

  story = computed(() => this.storyResource.value()?.content || '');

  //======= NAVIGATION ======

  canLike = computed(() => {
    const user = this.authService.currentUser();
    const currentStory = this.storyResource.value();
    return this.authService.isLoggedIn() && 
           user && 
           currentStory?.user && 
           user.id !== currentStory.user.id;
  });

  hasPreviousStory = computed(() => {
    const stories = this.userStoriesResource.value();
    const index = this.currentStoryIndex();
    return stories && stories.length > 0 && index < stories.length - 1;
  });

  hasNextStory = computed(() => {
    const stories = this.userStoriesResource.value();
    const index = this.currentStoryIndex();
    return stories && stories.length > 0 && index > 0;
  });

  //======= ACTIONS ======

  async toggleLike(): Promise<void> {
    const storyId = this.routeParams().storyId;
    if (!storyId || !this.canLike()) return;

    const result = await this.storiesService.toggleLike(storyId);
    this.userIsLiked.set(result.liked);
    this.currentLikes.set(result.totalLikes);
  }

  goToPreviousStory(): void {
    if (!this.hasPreviousStory()) return;
    
    const stories = this.userStoriesResource.value();
    const index = this.currentStoryIndex();
    const previousStory = stories![index + 1];
    
    this.router.navigate(['/chroniques', this.username(), previousStory.id]);
  }

  goToNextStory(): void {
    if (!this.hasNextStory()) return;
    
    const stories = this.userStoriesResource.value();
    const index = this.currentStoryIndex();
    const nextStory = stories![index - 1];
    
    this.router.navigate(['/chroniques', this.username(), nextStory.id]);
  }
}