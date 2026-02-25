import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { PublishedStoriesService, PublishedStory } from '@features/chroniques/services/published-stories.service';
import { SaveStoriesService } from '@features/chroniques/services/save-stories.service';
import { DeleteStoriesService } from '@features/chroniques/services/delete-stories.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';

@Component({
  selector: 'app-published-list',
  imports: [],
  templateUrl: './published-list.html',
  styleUrl: './published-list.scss'
})
export class PublishedList implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly publishedStoriesService = inject(PublishedStoriesService);
  private readonly saveStoriesService = inject(SaveStoriesService);
  private readonly deleteStoriesService = inject(DeleteStoriesService);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Histoires Publiées';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SELECTION STATE =======

  selectedStories = signal<Set<number>>(new Set());

  //======= DATA LOADING =======

  private readonly publishedStoriesResource = resource({
    params: () => ({
      isLoggedIn: this.authService.isLoggedIn()
    }),
    loader: async ({ params }) => {
      if (!params.isLoggedIn) {
        this.router.navigate(['/auth/login']);
        return [];
      }
      
      return await this.publishedStoriesService.getPublishedStories();
    }
  });

  publishedStories = computed((): PublishedStory[] => {
    return this.publishedStoriesResource.value() || [];
  });

  selection = computed(() => this.selectedStories().size > 0);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= SELECTION METHODS =======

  toggleSelection(id: number): void {
    const newSelection = this.deleteStoriesService.toggleSelection(id, this.selectedStories());
    this.selectedStories.set(newSelection);
  }

  isSelected(id: number): boolean {
    return this.selectedStories().has(id);
  }

  //======= DELETE METHODS =======

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedStories());

    await this.deleteStoriesService.deleteSelection(selectedIds, 'published');
    this.selectedStories.set(new Set());
    this.publishedStoriesResource.reload();
  }

  //======= NAVIGATION =======

  async onCardClick(publishedStory: PublishedStory): Promise<void> {
    try {
      const story = await this.publishedStoriesService.getPublishedStory(publishedStory.id);
      const draftId = await this.saveStoriesService.createDraftFromPublished(
        publishedStory.id,
        { title: story.title, content: story.content }
      );
      const username = this.authService.currentUser()?.username;
      this.router.navigate(['/chroniques', username, 'edition', draftId]);
    } catch {
      // Erreur silencieuse
    }
  }

  goBack(): void {
    const username = this.authService.currentUser()?.username;
    this.router.navigate(['/chroniques', username, 'mes-histoires']);
  }
}