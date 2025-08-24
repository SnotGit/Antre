import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { LoadService, DraftStory } from '@features/chroniques/services/load.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { TypingEffectService } from '@shared/services/typing-effect.service';

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
  private readonly loadService = inject(LoadService);
  private readonly deleteService = inject(DeleteService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);
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
      
      return await this.loadService.getDraftStories();
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
    const newSelection = this.deleteService.toggle(id, this.selectedStories());
    this.selectedStories.set(newSelection);
  }

  isSelected(id: number): boolean {
    return this.selectedStories().has(id);
  }

  //======= DELETE METHODS =======

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedStories());

    await this.deleteService.deleteSelected(selectedIds);
    this.selectedStories.set(new Set());
    this.draftStoriesResource.reload();
  }

  //======= NAVIGATION =======

  onCardClick(draftStory: DraftStory): void {
    const username = this.authService.currentUser()?.username;
    const titleUrl = this.chroniquesResolver.encodeTitle(draftStory.title);
    
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