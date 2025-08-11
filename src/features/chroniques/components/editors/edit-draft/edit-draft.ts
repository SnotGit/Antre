import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { AuthService } from '@features/user/services/auth.service';

@Component({
  selector: 'app-edit-draft',
  imports: [FormsModule],
  templateUrl: './edit-draft.html',
  styleUrl: './edit-draft.scss'
})
export class DraftEditor implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly saveService = inject(SaveService);
  private readonly deleteService = inject(DeleteService);
  private readonly loadService = inject(LoadService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Modifier Brouillon';

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
      const key = `draft-${this.storyId()}-modifications`;
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

  canPublish = computed(() => {
    const data = this.storyData();
    return data.title.trim().length > 0 && data.content.trim().length > 0;
  });

  //======= LIFECYCLE =======

  async ngOnInit(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);

    try {
      const story = await this.loadService.getStoryForEdit(this.storyId());
      
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

  //======= LOCAL STORAGE =======

  private restoreLocalModifications(): void {
    const key = `draft-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  //======= DELETE =======

  async deleteStory(): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteStory(true);
    if (!confirmed) return;

    try {
      await this.deleteService.deleteStory(this.storyId());
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.clearLocal(key);
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= ACTIONS =======

  async cancel(): Promise<void> {
    if (!this.isEdited()) {
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.clearLocal(key);
      this.navigateBack();
      return;
    }

    const confirmed = await this.confirmationService.confirmCancelStory();
    if (!confirmed) return;

    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
    this.navigateBack();
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    try {
      if (this.isEdited()) {
        await this.saveService.save(this.storyId(), this.storyData());
      }
      
      await this.saveService.publish(this.storyId());
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.clearLocal(key);
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  async goBack(): Promise<void> {
    if (this.isEdited()) {
      try {
        await this.saveService.save(this.storyId(), this.storyData());
      } catch (error) {
        this.confirmationService.showErrorMessage();
        return;
      }
    }
    
    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
    this.navigateBack();
  }

  private navigateBack(): void {
    this.location.back();
  }
}