import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { AuthService } from '@features/user/services/auth.service';

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
  private readonly saveService = inject(SaveService);
  private readonly deleteService = inject(DeleteService);
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

  hasContent = computed(() => {
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
    if (this.hasContent() && !this.isDraftCreated()) {
      await this.createInitialDraft();
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.isDraftCreated() && this.hasContent()) {
      this.saveService.saveLocal('new-story', this.storyData());
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
    this.saveService.saveLocal('new-story', this.storyData());
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= DELETE =======

  private async createInitialDraft(): Promise<void> {
    try {
      const id = await this.saveService.createStory();
      this.storyId.set(id);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= ACTIONS =======

  async cancel(): Promise<void> {
    this.saveService.clearLocal('new-story');
    if (this.isDraftCreated()) {
      const confirmed = await this.confirmationService.confirmDeleteStory(true);
      if (!confirmed) return;

      try {
        await this.deleteService.deleteStory(this.storyId());
      } catch (error) {
        this.confirmationService.showErrorMessage();
      }
    }

    this.goBack();
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    if (!this.isDraftCreated()) {
      await this.createInitialDraft();
      if (!this.isDraftCreated()) return;
    }

    try {
      await this.saveService.publish(this.storyId());
      this.saveService.clearLocal('new-story');
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  goBack(): void {
    if (this.isDraftCreated()) {
      this.saveService.save(this.storyId(), this.storyData());
    }
    this.saveService.clearLocal('new-story');
    this.location.back();
  }
}