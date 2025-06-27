import { Component, inject, signal, computed, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { StoryService, StoryFromAPI } from '../../../../../core/services/story.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-story-detail',
  imports: [CommonModule],
  templateUrl: './story-detail.html',
  styleUrl: './story-detail.scss'
})
export class StoryDetail {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private storyService = inject(StoryService);
  private authService = inject(AuthService);

  private storyId = signal<number>(0);
  private userStories = signal<StoryFromAPI[]>([]);
  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);

  isUserLoggedIn = computed(() => this.authService.isLoggedIn());

  currentSlug = toSignal(
    this.route.params.pipe(map(params => params['slug'] || '')),
    { initialValue: '' }
  );

  storyResource = resource({
    loader: () => {
      const slug = this.currentSlug();
      if (!slug) throw new Error('Slug manquant');
      return this.storyService.getStoryBySlug(slug);
    }
  });

  story = computed(() => this.storyResource.value()?.story || null);
  loading = computed(() => this.storyResource.isLoading());
  error = computed(() => this.storyResource.error() ? 'Histoire non trouvée' : null);

  avatarUrl = computed(() => {
    const avatar = this.story()?.user?.avatar;
    return avatar ? `http://localhost:3000${avatar}` : null;
  });

  formattedDate = computed(() => {
    const story = this.story();
    if (!story) return '';
    const date = story.publishedAt || story.updatedAt || story.createdAt;
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
        this.loadUserStories(story.user?.id || 0);
        this.loadLikeStatus(story.id);
      }
    });
  }

  async loadUserStories(userId: number): Promise<void> {
    if (!userId) return;
    try {
      const response = await this.storyService.getStoriesByUser(userId);
      const publishedStories = response.stories
        .filter(story => story.status === 'PUBLISHED')
        .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime());
      this.userStories.set(publishedStories);
    } catch (error) {
      this.userStories.set([]);
    }
  }

  async loadLikeStatus(storyId: number): Promise<void> {
    if (!this.isUserLoggedIn()) {
      this.isLiked.set(false);
      this.likesCount.set(0);
      return;
    }

    const token = this.authService.getToken();
    if (!token) return;

    try {
      const response = await this.storyService.checkIfLiked(storyId, token);
      this.isLiked.set(response.isLiked);
      this.likesCount.set(response.likesCount);
    } catch (error) {
      this.isLiked.set(false);
      this.likesCount.set(0);
    }
  }

  async toggleLike(): Promise<void> {
    const currentStoryId = this.storyId();
    if (!currentStoryId || !this.isUserLoggedIn()) return;

    const token = this.authService.getToken();
    if (!token) return;

    try {
      const response = await this.storyService.toggleLike(currentStoryId, token);
      this.isLiked.set(response.isLiked);
      this.likesCount.set(response.likesCount);
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
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

  goToUserrProfile(): void {
    const userId = this.story()?.user?.id;
    if (userId) {
      this.router.navigate(['/chroniques/user', userId]);
    }
  }
}