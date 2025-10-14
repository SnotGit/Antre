import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveStoriesService, StoryFormData } from '@features/chroniques/services/save-stories.service';
import { PublishedStoriesService } from '@features/chroniques/services/published-stories.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';
import { ConfirmationDialogService } from '@features/chroniques/services/confirmation-dialog.service';
import { AuthService } from '@features/auth/services/auth.service';

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
  private readonly saveStoriesService = inject(SaveStoriesService);
  private readonly publishedStoriesService = inject(PublishedStoriesService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Modifier Histoire Publiée';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUTS =======

  username = input.required<string>();
  titleUrl = input.required<string>();

  //======= ROUTER STATE =======

  private readonly routerState = history.state;
  private readonly routerStateStoryId = this.routerState?.storyId || 0;

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  originalData = signal<StoryFormData>({ title: '', content: '' });

  //======= RESOURCES =======

  private readonly publishedStoryResource = resource({
    loader: async () => {
      if (!this.authService.isLoggedIn()) {
        this.router.navigate(['/auth/login']);
        return null;
      }
      
      if (!this.routerStateStoryId) {
        const username = this.authService.currentUser()?.username;
        this.router.navigate(['/chroniques', username, 'mes-histoires']);
        return null;
      }

      try {
        const story = await this.publishedStoriesService.getPublishedStory(this.routerStateStoryId);
        return { story, storyId: this.routerStateStoryId };
      } catch (error) {
        const username = this.authService.currentUser()?.username;
        this.router.navigate(['/chroniques', username, 'mes-histoires']);
        return null;
      }
    }
  });

  //======= COMPUTED =======

  storyId = computed(() => this.publishedStoryResource.value()?.storyId || 0);

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  isEdited = computed(() => {
    const current = this.storyData();
    const original = this.originalData();
    return current.title !== original.title || current.content !== original.content;
  });

  canSaveToDraft = computed(() => {
    return this.storyTitle().trim().length > 0 && this.storyContent().trim().length > 0;
  });

  canUpdate = computed(() => {
    return this.canSaveToDraft() && this.isEdited();
  });

  //======= EFFECTS =======

  private readonly initializeStoryDataEffect = effect(() => {
    const resourceData = this.publishedStoryResource.value();
    
    if (resourceData?.story) {
      this.storyTitle.set(resourceData.story.title);
      this.storyContent.set(resourceData.story.content);
      this.originalData.set({ title: resourceData.story.title, content: resourceData.story.content });
    }
  });

  private readonly localSaveEffect = effect(() => {
    if (this.storyId() && this.isEdited()) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveStoriesService.saveLocal(key, this.storyData());
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
    this.restoreLocalModifications();
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= LOCAL STORAGE =======

  private restoreLocalModifications(): void {
    if (!this.storyId()) return;
    
    const key = `published-${this.storyId()}-modifications`;
    const saved = this.saveStoriesService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  private clearLocalStorage(): void {
    if (!this.storyId()) return;
    
    const key = `published-${this.storyId()}-modifications`;
    this.saveStoriesService.clearLocal(key);
  }

  //======= ACTIONS =======

  async saveToDraft(): Promise<void> {
    if (!this.storyId()) return;

    try {
      await this.saveStoriesService.createDraftFromPublished(this.storyId(), this.storyData());
      
      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();
      
      const username = this.authService.currentUser()?.username;
      this.router.navigate(['/chroniques', username, 'mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  async update(): Promise<void> {
    if (!this.canUpdate() || !this.storyId()) return;

    try {
      await this.saveStoriesService.updateStory(this.storyId(), this.storyData());
      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();
      
      const username = this.authService.currentUser()?.username;
      this.router.navigate(['/chroniques', username, 'mes-histoires']);
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
      if (!this.storyId()) return;
      
      try {
        await this.saveStoriesService.createDraftFromPublished(this.storyId(), this.storyData());
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