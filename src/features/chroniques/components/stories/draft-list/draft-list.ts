import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { DraftStoriesService, DraftStory } from '@features/chroniques/services/draft-stories.service';
import { DeleteStoriesService } from '@features/chroniques/services/delete-stories.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';

@Component({
  selector: 'app-draft-list',
  imports: [],
  templateUrl: './draft-list.html',
  styleUrl: './draft-list.scss'
})
export class DraftList implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly draftStoriesService = inject(DraftStoriesService);
  private readonly deleteStoriesService = inject(DeleteStoriesService);
  private readonly titleResolver = inject(TitleResolver);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Brouillons';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SELECTION STATE =======

  selectedStories = signal<Set<number>>(new Set());

  //======= DATA LOADING =======

  private readonly draftStoriesResource = resource({
    params: () => ({
      isLoggedIn: this.authService.isLoggedIn()
    }),
    loader: async ({ params }) => {
      if (!params.isLoggedIn) {
        this.router.navigate(['/auth/login']);
        return [];
      }
      
      return await this.draftStoriesService.getDraftStories();
    }
  });

  draftStories = computed((): DraftStory[] => {
    return this.draftStoriesResource.value() || [];
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

    await this.deleteStoriesService.deleteSelection(selectedIds, 'draft');
    this.selectedStories.set(new Set());
    this.draftStoriesResource.reload();
  }

  //======= NAVIGATION =======

  onCardClick(draftStory: DraftStory): void {
    const username = this.authService.currentUser()?.username;
    const titleUrl = this.titleResolver.encodeTitle(draftStory.title);
    
    this.router.navigate(['/chroniques', username, 'edition', titleUrl], {
      state: { 
        storyId: draftStory.id,
        title: draftStory.title,
        isDraft: true
      }
    });
  }

  goBack(): void {
    const username = this.authService.currentUser()?.username;
    this.router.navigate(['/chroniques', username, 'mes-histoires']);
  }
}