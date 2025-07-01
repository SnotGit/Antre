import { Component, inject, signal, computed, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PublicStoriesService } from '../../../../../core/services/public-stories.service';
import { AuthService } from '../../../../../core/services/auth.service';

interface StoryData {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  likes: number;
  slug: string;
  user: {
    id: number;
    username: string;
    avatar: string;
    description: string;
  };
}

@Component({
  selector: 'app-story-detail',
  imports: [CommonModule],
  templateUrl: './story-detail.html',
  styleUrl: './story-detail.scss'
})
export class StoryDetail {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private publicStoriesService = inject(PublicStoriesService);
  private authService = inject(AuthService);

  private storyId = signal<number>(0);
  private userStories = signal<StoryData[]>([]);
  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);
  showSnackBar = signal<boolean>(false);
  snackBarMessage = signal<string>('');

  isUserLoggedIn = computed(() => this.authService.isLoggedIn());

  currentSlug = toSignal(
    this.route.params.pipe(map(params => params['slug'] || '')),
    { initialValue: '' }
  );

  storyResource = resource({
    loader: async () => {
      const slug = this.currentSlug();
      if (!slug) throw new Error('Slug manquant');
      const story = await this.publicStoriesService.getStoryDetailBySlug(slug);
      return { story };
    }
  });

  story = computed(() => this.storyResource.value()?.story ?? null);
  loading = computed(() => this.storyResource.isLoading());
  error = computed(() => this.storyResource.error() ? 'Histoire non trouvée' : null);

  avatarUrl = computed(() => {
    const story = this.story();
    return story?.user?.avatar ? `http://localhost:3000${story.user.avatar}` : null;
  });

  formattedDate = computed(() => {
    const story = this.story();
    if (!story) return '';
    const date = story.publishDate;
    return new Date(date).toLocaleDateString('fr-FR');
  });

  currentStoryIndex = computed(() => {
    const stories = this.userStories();
    const currentId = this.storyId();
    return stories.findIndex(s => s.id === currentId);
  });

  constructor() {
    effect(() => {
      const slug = this.currentSlug();
      if (slug) {
        this.storyResource.reload();
      }
    });

    effect(() => {
      const story = this.story();
      if (story) {
        this.storyId.set(story.id);
        this.loadUserStories(story.user.id);
        this.loadLikeStatus(story.id);
      }
    });
  }

  async loadUserStories(userId: number): Promise<void> {
    if (!userId) return;
    try {
      const userProfile = await this.publicStoriesService.getUserProfile(userId.toString());
      if (userProfile?.stories) {
        const storyDetails = userProfile.stories.map(story => ({
          id: story.id,
          title: story.title,
          content: '',
          publishDate: story.publishDate,
          likes: story.likes,
          slug: story.slug,
          user: userProfile.user
        }));
        this.userStories.set(storyDetails);
      }
    } catch (error) {
      this.userStories.set([]);
    }
  }

  async loadLikeStatus(storyId: number): Promise<void> {
    if (!this.isUserLoggedIn()) {
      this.isLiked.set(false);
      const story = this.story();
      this.likesCount.set(story?.likes || 0);
      return;
    }

    try {
      const story = this.story();
      this.likesCount.set(story?.likes || 0);
      this.isLiked.set(false);
    } catch (error) {
      this.isLiked.set(false);
      this.likesCount.set(0);
    }
  }

  async toggleLike(): Promise<void> {
    const currentStoryId = this.storyId();
    if (!currentStoryId) return;

    if (!this.isUserLoggedIn()) {
      this.showSnackBarMessage("Connectez-vous pour liker cette histoire !");
      return;
    }

    try {
      const response = await this.publicStoriesService.toggleLike(currentStoryId);
      this.isLiked.set(response.liked);
      this.likesCount.set(response.totalLikes);
      
      const message = response.liked ? "Histoire likée !" : "Like retiré";
      this.showSnackBarMessage(message);
    } catch (error) {
      this.showSnackBarMessage("Erreur lors du like");
    }
  }

  private showSnackBarMessage(message: string): void {
    this.snackBarMessage.set(message);
    this.showSnackBar.set(true);
    
    setTimeout(() => {
      this.showSnackBar.set(false);
    }, 3000);
  }

  goToPreviousStory(): void {
    const stories = this.userStories();
    const currentIndex = this.currentStoryIndex();
    
    if (currentIndex > 0) {
      const previousStory = stories[currentIndex - 1];
      if (previousStory.slug) {
        this.router.navigate(['/chroniques/story', previousStory.slug]);
      }
    }
  }

  goToNextStory(): void {
    const stories = this.userStories();
    const currentIndex = this.currentStoryIndex();
    
    if (currentIndex >= 0 && currentIndex < stories.length - 1) {
      const nextStory = stories[currentIndex + 1];
      if (nextStory.slug) {
        this.router.navigate(['/chroniques/story', nextStory.slug]);
      }
    }
  }

  hasPreviousStory(): boolean {
    return this.currentStoryIndex() > 0;
  }

  hasNextStory(): boolean {
    const stories = this.userStories();
    const currentIndex = this.currentStoryIndex();
    return currentIndex >= 0 && currentIndex < stories.length - 1;
  }

  goToUserProfile(): void {
    const story = this.story();
    if (story?.user?.id) {
      this.router.navigate(['/chroniques/user', story.user.id]);
    }
  }
}