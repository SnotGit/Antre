import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { AuthService } from '@features/user/services/auth.service';

@Component({
  selector: 'app-edit-published',
  imports: [FormsModule],
  templateUrl: './edit-published.html',
  styleUrl: './edit-published.scss'
})
export class PublishedEditor implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly saveService = inject(SaveService);
  private readonly loadService = inject(LoadService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Modifier Histoire Publiée';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUT =======

  storyId = input.required<number>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  originalData = signal<StoryFormData>({ title: '', content: '' });

  //======= AUTO-SAVE EFFECT =======

  private autoSaveEffect = effect(() => {
    if (this.storyId() && this.isEdited()) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= COMPUTED =======

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  isEdited = computed(() => {
    const current = this.storyData();
    const original = this.originalData();
    return current.title !== original.title || current.content !== original.content;
  });

  canUpdate = computed(() => {
    const data = this.storyData();
    return data.title.trim().length > 0 && data.content.trim().length > 0 && this.isEdited();
  });

  //======= LIFECYCLE =======

  async ngOnInit(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (typeof this.storyId() === 'string') {
      const numericId = parseInt(this.storyId() as any, 10);
      if (isNaN(numericId)) {
        this.router.navigate(['/chroniques/mes-histoires']);
        return;
      }
    }

    // Délai pour l'effet de typing
    if (this.typingService.typingComplete()) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.typingService.title(this.title);

    try {
      const story = await this.loadService.getStoryForEdit(this.storyId());
      
      this.storyTitle.set(story.title);
      this.storyContent.set(story.content);
      this.originalData.set({ title: story.title, content: story.content });
      this.restoreLocalModifications();
      
    } catch (error) {
      console.error('Erreur chargement histoire publiée:', error);
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= LOCAL STORAGE =======

  private restoreLocalModifications(): void {
    const key = `published-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  private clearLocalStorage(): void {
    const key = `published-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
  }

  //======= ACTIONS =======

  async saveToDraft(): Promise<void> {
    if (!this.isEdited()) {
      const confirmed = await this.confirmationService.confirmCancelStory();
      if (!confirmed) return;
    }

    try {
      const draftId = await this.saveService.createDraftFromPublished(
        this.storyId(), 
        this.storyData()
      );
      
      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  async update(): Promise<void> {
    if (!this.canUpdate()) return;

    const confirmed = await this.confirmationService.confirmCancelStory();
    if (!confirmed) return;

    try {
      await this.saveService.update(this.storyId(), this.storyData());
      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  async goBack(): Promise<void> {
    if (!this.isEdited()) {
      this.clearLocalStorage();
      this.navigateBack();
      return;
    }

    const saveOrQuit = await this.confirmationService.confirmSaveOrQuit();
    
    if (saveOrQuit) {
      try {
        await this.saveService.createDraftFromPublished(
          this.storyId(), 
          this.storyData()
        );
        this.clearLocalStorage();
      } catch (error) {
        this.confirmationService.showErrorMessage();
        return;
      }
    } else {
      this.clearLocalStorage();
    }

    this.navigateBack();
  }

  private navigateBack(): void {
    this.location.back();
  }
}