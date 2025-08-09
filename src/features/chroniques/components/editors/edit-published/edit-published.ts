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

  titleParam = input.required<string>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //======= COMPUTED =======

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  hasModifications = computed(() => {
    const data = this.storyData();
    return data.title.length > 0 || data.content.length > 0;
  });

  canUpdate = computed(() => {
    const data = this.storyData();
    return data.title.length >= 3 && data.content.length >= 100;
  });

  //======= EFFECTS =======

  private autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && this.hasModifications()) {
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
      const resolved = await this.chroniquesResolver.resolveStoryByTitle(this.titleParam());
      const story = await this.loadService.getStoryForEdit(resolved.storyId);
      
      this.storyId.set(story.id);
      this.storyTitle.set(story.title);
      this.storyContent.set(story.content);
      this.restoreModifications();
      
    } catch (error) {
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= SAVE =======

  private restoreModifications(): void {
    const key = `published-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  async saveToDraft(): Promise<void> {
    if (!this.hasModifications()) return;

    try {
      const draftId = await this.saveService.createDraftFromPublished(
        this.storyId(), 
        this.storyData()
      );
      
      this.saveService.clearLocal(`published-${this.storyId()}-modifications`);
      this.confirmationService.showSuccessMessage();
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  async update(): Promise<void> {
    if (!this.canUpdate()) return;

    try {
      await this.saveService.update(this.storyId(), this.storyData());
      this.saveService.clearLocal(`published-${this.storyId()}-modifications`);
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= ACTIONS =======

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
}