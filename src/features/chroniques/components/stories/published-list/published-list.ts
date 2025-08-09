import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { LoadService, PublishedStory } from '@features/chroniques/services/load.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';

@Component({
  selector: 'app-published-list',
  imports: [CommonModule],
  templateUrl: './published-list.html',
  styleUrl: './published-list.scss'
})
export class PublishedList implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly deleteService = inject(DeleteService);
  private readonly likeService = inject(LikeService);
  private readonly typingService = inject(TypingEffectService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);

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
      
      return await this.loadService.getPublishedStories();
    }
  });

  publishedStories = computed((): PublishedStory[] => {
    return this.publishedStoriesResource.value() || [];
  });

  //======= COMPUTED =======

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
    this.publishedStoriesResource.reload();
  }

  //======= NAVIGATION =======

  onCardClick(publishedStory: PublishedStory): void {
    const resolvedTitle = this.chroniquesResolver.encodeTitle(publishedStory.title);
    this.router.navigate(['/chroniques/mes-histoires/publiée/edition', resolvedTitle]);
  }

  goBack(): void {
    this.router.navigate(['/chroniques/mes-histoires']);
  }
}