import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
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
  private readonly chroniquesResolver = inject(ChroniquesResolver);
  private readonly loadService = inject(LoadService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Continuer Brouillon';

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

  hasModifications = computed(() => {
    const current = this.storyData();
    const original = this.originalData();
    return current.title !== original.title || current.content !== original.content;
  });

  canPublish = computed(() => {
    const data = this.storyData();
    return data.title.length >= 3 && data.content.length >= 100;
  });

  //======= EFFECTS =======

  private autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && this.hasModifications()) {
      const key = `draft-${this.storyId()}-modifications`;
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
    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
    this.router.navigate(['/chroniques/mes-histoires']);
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    try {
      if (this.hasModifications()) {
        this.saveService.save(this.storyId(), this.storyData());
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
    if (this.hasModifications()) {
      this.saveService.save(this.storyId(), this.storyData());
    }
    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
    this.location.back();
  }
}