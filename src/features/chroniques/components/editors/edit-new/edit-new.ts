import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveStoriesService, StoryFormData } from '@features/chroniques/services/save-stories.service';
import { DeleteStoriesService } from '@features/chroniques/services/delete-stories.service';
import { ConfirmationDialogService } from '@features/chroniques/services/chroniques-dialog.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-edit-new',
  imports: [FormsModule],
  templateUrl: './edit-new.html',
  styleUrl: './edit-new.scss'
})
export class EditNew implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly saveStoriesService = inject(SaveStoriesService);
  private readonly deleteStoriesService = inject(DeleteStoriesService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Nouvelle Histoire';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //======= COMPUTED =======

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  isEdited = computed(() => {
    const data = this.storyData();
    return data.title.trim().length > 0 || data.content.trim().length > 0;
  });

  canPublish = computed(() => {
    const data = this.storyData();
    return data.title.trim().length >= 3 && data.content.trim().length >= 3;
  });

  isDraftCreated = computed(() => this.storyId() > 0);

  //======= EFFECTS =======

  private firstCharacterEffect = effect(async () => {
    if (this.isEdited() && !this.isDraftCreated()) {
      await this.createInitialDraft();
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.isDraftCreated() && this.isEdited()) {
      this.saveStoriesService.saveLocal('new-story', this.storyData());
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
    this.saveStoriesService.saveLocal('new-story', this.storyData());
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= CREATE DRAFT =======

  private async createInitialDraft(): Promise<void> {
    try {
      const id = await this.saveStoriesService.createStory();
      this.storyId.set(id);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= ACTIONS =======

  async cancel(): Promise<void> {
    if (!this.isEdited()) {
      this.saveStoriesService.clearLocal('new-story');
      this.navigateBack();
      return;
    }

    const confirmed = await this.confirmationService.confirmCancelStory();
    if (!confirmed) return;

    this.saveStoriesService.clearLocal('new-story');
    
    if (this.isDraftCreated()) {
      try {
        await this.deleteStoriesService.deleteStory(this.storyId(), 'draft');
      } catch (error) {
        this.confirmationService.showErrorMessage();
      }
    }

    this.navigateBack();
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    if (!this.isDraftCreated()) {
      await this.createInitialDraft();
      if (!this.isDraftCreated()) return;
    }

    try {
      await this.saveStoriesService.publishStory(this.storyId());
      this.saveStoriesService.clearLocal('new-story');
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  async goBack(): Promise<void> {
    if (this.isDraftCreated() && this.isEdited()) {
      try {
        await this.saveStoriesService.saveStory(this.storyId(), this.storyData());
      } catch (error) {
        this.confirmationService.showErrorMessage();
        return;
      }
    }
    
    this.saveStoriesService.clearLocal('new-story');
    this.navigateBack();
  }

  private navigateBack(): void {
    this.location.back();
  }
}