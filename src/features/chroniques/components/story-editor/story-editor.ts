import { Component, OnInit, OnDestroy, inject, signal, computed, effect, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SaveStoriesService, StoryFormData } from '@features/chroniques/services/save-stories.service';
import { DraftStoriesService } from '@features/chroniques/services/draft-stories.service';
import { DeleteStoriesService } from '@features/chroniques/services/delete-stories.service';
import { ConfirmationDialogService } from '@features/chroniques/services/chroniques-dialog.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-story-editor',
  imports: [FormsModule],
  templateUrl: './story-editor.html',
  styleUrl: './story-editor.scss'
})
export class StoryEditor implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly saveStoriesService = inject(SaveStoriesService);
  private readonly draftStoriesService = inject(DraftStoriesService);
  private readonly deleteStoriesService = inject(DeleteStoriesService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTE PARAMS =======

  private readonly routeStoryId = Number(this.route.snapshot.paramMap.get('storyId')) || 0;
  private readonly isCreationMode = this.routeStoryId === 0;

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);
  originalStoryId = signal<number>(0);
  private isCreatingDraft = signal(false);
  private originalData = signal<StoryFormData>({ title: '', content: '' });

  //======= COMPUTED =======

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  isEdited = computed(() => {
    if (this.isCreationMode) {
      const data = this.storyData();
      return data.title.trim().length > 0 || data.content.trim().length > 0;
    }
    const current = this.storyData();
    const original = this.originalData();
    return current.title !== original.title || current.content !== original.content;
  });

  canPublish = computed(() => {
    const data = this.storyData();
    return data.title.trim().length >= 3 && data.content.trim().length >= 3;
  });

  isDraftCreated = computed(() => this.storyId() > 0);

  isRepublishMode = computed(() => this.originalStoryId() > 0);

  //======= RESOURCE (mode edition) =======

  private readonly draftResource = resource({
    loader: async () => {
      if (this.isCreationMode) return null;

      try {
        const story = await this.draftStoriesService.getDraftStory(this.routeStoryId);
        this.storyId.set(this.routeStoryId);
        this.storyTitle.set(story.title);
        this.storyContent.set(story.content);
        this.originalData.set({ title: story.title, content: story.content });

        if (story.originalStoryId) {
          this.originalStoryId.set(story.originalStoryId);
        }

        this.restoreLocalModifications();
        return story;
      } catch {
        const username = this.authService.currentUser()?.username;
        this.router.navigate(['/chroniques', username, 'mes-histoires']);
        return null;
      }
    }
  });

  //======= EFFECTS =======

  private readonly createDraftEffect = effect(async () => {
    if (this.isCreationMode && this.isEdited() && !this.isDraftCreated() && !this.isCreatingDraft()) {
      await this.createDraft();
    }
  });

  private readonly localSaveEffect = effect(() => {
    if (this.isDraftCreated() && this.isEdited()) {
      const key = this.localStorageKey();
      this.saveStoriesService.saveLocal(key, this.storyData());
    }
  });

  private readonly serverSaveEffect = effect(() => {
    const data = this.storyData();
    if (this.isDraftCreated() && this.isEdited()) {
      this.scheduleSaveDraft();
    }
  });

  //======= DEBOUNCE =======

  private saveDraftTimeout: number | undefined;

  //======= LIFECYCLE =======

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const title = this.isCreationMode ? 'Nouvelle Histoire' : 'Modifier Histoire';
    this.typingService.title(title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
    this.flushSaveDraft();
  }

  //======= LOCAL STORAGE =======

  private localStorageKey(): string {
    if (this.isCreationMode) return 'new-story';
    return `draft-${this.storyId()}-modifications`;
  }

  private restoreLocalModifications(): void {
    if (!this.storyId()) return;
    const key = this.localStorageKey();
    const saved = this.saveStoriesService.restoreLocal(key);
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  private clearLocalStorage(): void {
    const key = this.localStorageKey();
    this.saveStoriesService.clearLocal(key);
  }

  //======= DRAFT (private, invisible) =======

  private async createDraft(): Promise<void> {
    this.isCreatingDraft.set(true);
    try {
      const id = await this.saveStoriesService.createStory();
      this.storyId.set(id);
    } catch {
      this.confirmationService.showErrorMessage();
    } finally {
      this.isCreatingDraft.set(false);
    }
  }

  private scheduleSaveDraft(): void {
    clearTimeout(this.saveDraftTimeout);
    this.saveDraftTimeout = window.setTimeout(async () => {
      try {
        await this.saveStoriesService.saveStory(this.storyId(), this.storyData());
      } catch {
        // Silencieux — pas de feedback pour l'auto-save
      }
    }, 3000);
  }

  private async saveDraft(): Promise<void> {
    clearTimeout(this.saveDraftTimeout);
    await this.saveStoriesService.saveStory(this.storyId(), this.storyData());
  }

  private flushSaveDraft(): void {
    clearTimeout(this.saveDraftTimeout);
    if (this.isDraftCreated() && this.isEdited()) {
      this.saveStoriesService.saveStory(this.storyId(), this.storyData());
    }
  }

  //======= ACTIONS =======

  async publish(): Promise<void> {
    if (!this.canPublish() || !this.isDraftCreated()) return;

    try {
      await this.saveDraft();

      if (this.isRepublishMode()) {
        await this.saveStoriesService.republishFromDraft(this.storyId());
      } else {
        await this.saveStoriesService.publishStory(this.storyId());
      }

      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();

      const username = this.authService.currentUser()?.username;
      this.router.navigate(['/chroniques', username, 'mes-histoires']);
    } catch {
      this.confirmationService.showErrorMessage();
    }
  }

  async cancel(): Promise<void> {
    if (!this.isEdited()) {
      this.clearLocalStorage();
      this.navigateBack();
      return;
    }

    if (this.isCreationMode) {
      const confirmed = await this.confirmationService.confirmCancelStory();
      if (!confirmed) return;

      this.clearLocalStorage();

      if (this.isDraftCreated()) {
        try {
          await this.deleteStoriesService.deleteStory(this.storyId(), 'draft');
        } catch {
          this.confirmationService.showErrorMessage();
        }
      }

      this.navigateBack();
    } else {
      this.clearLocalStorage();
      this.navigateBack();
    }
  }

  goBack(): void {
    if (this.isDraftCreated() && this.isEdited()) {
      this.saveDraft().then(() => {
        this.clearLocalStorage();
        this.navigateBack();
      }).catch(() => {
        this.confirmationService.showErrorMessage();
      });
    } else {
      this.clearLocalStorage();
      this.navigateBack();
    }
  }

  //======= NAVIGATION =======

  private navigateBack(): void {
    this.location.back();
  }
}
