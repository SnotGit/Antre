import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';

interface CardData {
  id: number;
  storyTitle: string;
  storyDate: string;
}

@Component({
  selector: 'app-my-stories',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-stories.html',
  styleUrl: './my-stories.scss'
})
export class MyStories implements OnInit, OnDestroy {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);
  private typingService = inject(TypingEffectService);
  private confirmationService = inject(ConfirmationDialogService);

  //============ SÉLECTION INDIVIDUELLE ============

  private _selectedStoryIds = signal<Set<number>>(new Set());

  //============ COMPUTED POUR MODE DELETE ============

  isDeleteMode = computed(() => this._selectedStoryIds().size > 0);

  // Exposer selectedStoryIds pour le template
  selectedStoryIds = this._selectedStoryIds.asReadonly();

  currentMode = toSignal(
    this.route.url.pipe(map(segments => {
      const lastPath = segments[segments.length - 1]?.path;
      if (lastPath === 'brouillons') return 'drafts';
      if (lastPath === 'publiées') return 'published';
      return 'overview';
    })),
    { initialValue: 'overview' }
  );

  stats = this.privateStoriesService.stats;

  isOverviewMode = computed(() => this.currentMode() === 'overview');
  isListMode = computed(() => this.currentMode() !== 'overview');

  stories = computed((): CardData[] => {
    const mode = this.currentMode();
    if (mode === 'drafts') {
      return this.privateStoriesService.drafts().map(draft => ({
        id: draft.id,
        storyTitle: draft.title,
        storyDate: this.formatDate(draft.lastModified)
      }));
    }

    if (mode === 'published') {
      return this.privateStoriesService.published().map(storyItem => ({
        id: storyItem.id,
        storyTitle: storyItem.title,
        storyDate: this.formatDate(storyItem.lastModified)
      }));
    }

    return [];
  });

  headerText = computed(() => {
    const mode = this.currentMode();
    switch (mode) {
      case 'drafts': return 'Brouillons';
      case 'published': return 'Histoires Publiées';
      default: return 'Mes Histoires';
    }
  });

  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
  });

  headerTitle = this.typingEffect.headerTitle;
  typing = this.typingEffect.typingComplete;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.typingEffect.startTyping();
    this.privateStoriesService.initializeUserData();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  //============ GESTION SÉLECTION ============

  isStorySelected(storyId: number): boolean {
    return this._selectedStoryIds().has(storyId);
  }

  toggleStorySelection(storyId: number): void {
    const currentSet = this._selectedStoryIds();
    const newSet = new Set(currentSet);
    
    if (newSet.has(storyId)) {
      newSet.delete(storyId);
    } else {
      newSet.add(storyId);
    }
    
    this._selectedStoryIds.set(newSet);
  }

  clearSelection(): void {
    this._selectedStoryIds.set(new Set());
  }

  //============ ACTIONS ============

  onCheckboxClick(event: Event, storyId: number): void {
    event.stopPropagation();
    this.toggleStorySelection(storyId);
  }

  async onCardClick(story: CardData): Promise<void> {
    // Navigation normale vers l'éditeur - pas de suppression ici
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    if (this.currentMode() === 'drafts') {
      this.router.navigate(['/chroniques/editor', story.id]);
    } else {
      this.router.navigate(['/chroniques', currentUser.username, 'édition', story.storyTitle]);
    }
  }

  async deleteSelectedStories(): Promise<void> {
    const selectedIds = Array.from(this._selectedStoryIds());
    
    if (selectedIds.length === 0) return;

    // Confirmation avec le service existant
    const confirmed = await this.confirmationService.confirmDeleteStory(false);
    if (!confirmed) return;

    try {
      // Supprimer chaque story via le service existant
      // Backend route: DELETE /api/private-stories/story/:id
      for (const storyId of selectedIds) {
        await this.privateStoriesService.deleteStory(storyId);
      }
      
      // Nettoyer la sélection
      this.clearSelection();
      
      // Recharger les données via le service existant
      await this.privateStoriesService.initializeUserData();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  //============ NAVIGATION ============

  goToDrafts(): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }

  goToPublished(): void {
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }

  //============ UTILITAIRES ============

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}