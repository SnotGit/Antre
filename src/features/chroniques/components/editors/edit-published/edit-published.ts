import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
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
  private readonly chroniquesResolver = inject(ChroniquesResolver);
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

  titleUrl = input.required<string>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);
  originalData = signal<StoryFormData>({ title: '', content: '' });

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
    return this.isEdited() && data.title.length >= 3 && data.content.length >= 100;
  });

  //======= EFFECTS =======

  private autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && this.isEdited()) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= LIFECYCLE =======

  async ngOnInit(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);

    try {
      const resolved = await this.chroniquesResolver.resolveStoryByTitle(this.titleUrl());
      const story = await this.loadService.getStoryForEdit(resolved.storyId);
      
      this.storyId.set(story.id);
      this.storyTitle.set(story.title);
      this.storyContent.set(story.content);
      this.originalData.set({ title: story.title, content: story.content });
      this.restoreLocalModifications();
      
    } catch (error) {
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= SAVE =======

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