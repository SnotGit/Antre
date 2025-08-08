import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { LoadService, Published } from '@features/chroniques/services/load.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { LikeService } from '@features/chroniques/services/like.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-published-list',
  imports: [CommonModule],
  templateUrl: './published-list.html',
  styleUrl: './published-list.scss'
})
export class PublishedList implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly deleteService = inject(DeleteService);
  private readonly likeService = inject(LikeService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Histoires Publiées';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ SIGNAL ============

  selectedStories = signal<Set<number>>(new Set());

  //============ DATA LOADING ============

  private readonly Resource = resource({
    loader: async () => {
      return await this.loadService.getPublished();
    }
  });

  Stories = computed((): Published[] => {
    return this.Resource.value() || [];
  });

  //============ COMPUTED ============

  Selection = computed(() => this.selectedStories().size > 0);

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //============ SELECTION METHODS ============

  toggle(id: number): void {
    const newSelection = this.deleteService.toggle(id, this.selectedStories());
    this.selectedStories.set(newSelection);
  }

  isSelected(id: number): boolean {
    return this.selectedStories().has(id);
  }

  //============ DELETE METHODS ============

  async deleteSelected(): Promise<void> {
    const selectedIds = Array.from(this.selectedStories());

    await this.deleteService.deleteSelected(selectedIds);
    this.selectedStories.set(new Set());
    this.Resource.reload();
  }

  //============ NAVIGATION ============

  onCardClick(story: Published): void {
    this.router.navigate(['/chroniques/mes-histoires/publiée/edition', story.title]);
  }

  goBack(): void {
    this.router.navigate(['/chroniques/mes-histoires']);
  }
}