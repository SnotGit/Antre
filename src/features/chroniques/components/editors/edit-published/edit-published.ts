import { Component, inject, signal, computed, effect, input } from '@angular/core';
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
export class PublishedEditor {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly saveService = inject(SaveService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);
  private readonly loadService = inject(LoadService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= ROUTER INPUT =======

  title = input.required<string>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //======= COMPUTED =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  publishedStory = computed(() => {
    const data = this.storyData();
    return data.title.length > 0 || data.content.length > 0;
  });

  canUpdate = computed(() => {
    const data = this.storyData();
    return data.title.length >= 3 && data.content.length >= 100;
  });

  //======= EFFECTS =======

  private loadStoryEffect = effect(async () => {
    const titleParam = this.title();
    if (!titleParam) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    try {
      const resolved = await this.chroniquesResolver.resolveStoryByTitle(titleParam);
      const story = await this.loadService.getStoryForEdit(resolved.storyId);
      
      this.storyId.set(story.id);
      this.storyTitle.set(story.title);
      this.storyContent.set(story.content);
      
      this.typingService.title(`Édition: ${story.title}`);
      this.restoreModifications();
    } catch (error) {
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && this.publishedStory()) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= ACTIONS =======

  async saveToDraft(): Promise<void> {
    if (!this.publishedStory()) return;

    try {
      const draftId = await this.saveService.createDraftFromPublished(
        this.storyId(), 
        this.storyData()
      );
      
      this.saveService.clearLocal(`published-${this.storyId()}-modifications`);
      alert(`Sauvegardé comme brouillon (ID: ${draftId})`);
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  }

  async update(): Promise<void> {
    if (!this.canUpdate()) return;

    const confirmed = await this.confirmationService.confirmPublishStory();
    if (!confirmed) return;

    try {
      await this.saveService.update(this.storyId(), this.storyData());
      this.saveService.clearLocal(`published-${this.storyId()}-modifications`);
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la republication');
    }
  }

  async cancel(): Promise<void> {
    const key = `published-${this.storyId()}-modifications`;
    const hasModifications = this.saveService.restoreLocal(key) !== null;

    if (hasModifications) {
      const confirmed = await this.confirmationService.confirmDeleteStory(false);
      if (!confirmed) return;
    }

    this.saveService.clearLocal(key);
    this.router.navigate(['/chroniques/mes-histoires']);
  }

  //======= NAVIGATION =======

  goBack(): void {
    this.location.back();
  }

  //======= PRIVATE METHODS =======

  private restoreModifications(): void {
    const key = `published-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }
}