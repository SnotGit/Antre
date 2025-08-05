import { Component, OnInit, OnDestroy, inject, computed, resource, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LoadService, Draft } from '@features/chroniques/services/load.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-draft-list',
  imports: [CommonModule],
  templateUrl: './draft-list.html',
  styleUrl: './draft-list.scss'
})
export class DraftList implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly deleteService = inject(DeleteService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Brouillons';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ SELECTION STATE ============

  selectedStories = signal<Set<number>>(new Set());

  //============ DATA LOADING ============

  private readonly draftsResource = resource({
    loader: async () => {
      return await this.loadService.getDrafts();
    }
  });

  draftCards = computed((): Draft[] => {
    return this.draftsResource.value() || [];
  });

  //============ COMPUTED ============

  hasSelection = computed(() => this.selectedStories().size > 0);

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

  toggleSelection(id: number): void {
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
    this.draftsResource.reload();
  }

  //============ NAVIGATION ============

  onDraftCardClick(draft: Draft): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillon/edition', draft.title]);
  }

  goBack(): void {
    this.router.navigate(['/chroniques/mes-histoires']);
  }

  //============ UTILS ============

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}