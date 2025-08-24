import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input, resource } from '@angular/core';
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

  //======= ROUTER INPUTS =======

  username = input.required<string>();
  titleUrl = input.required<string>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  originalData = signal<StoryFormData>({ title: '', content: '' });

  //======= RESOURCES =======

  publishedStoryResource = resource({
    params: () => ({
      storyId: history.state?.storyId || 0,
      username: this.username(),
      titleUrl: this.titleUrl(),
      isAuthenticated: this.authService.isLoggedIn()
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated) {
        this.router.navigate(['/auth/login']);
        return null;
      }

      if (!params.storyId) {
        const username = this.authService.currentUser()?.username;
        this.router.navigate(['/chroniques', username, 'mes-histoires']);
        return null;
      }

      try {
        const story = await this.loadService.getPublishedStory(params.storyId);
        return { story, storyId: params.storyId };
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

  canUpdate = computed(() => {
    const data = this.storyData();
    return data.title.trim().length > 0 && data.content.trim().length > 0 && this.isEdited();
  });

  //======= EFFECTS =======

  private readonly dataLoadEffect = effect(() => {
    const resourceData = this.publishedStoryResource.value();
    
    if (resourceData?.story) {
      this.storyTitle.set(resourceData.story.title);
      this.storyContent.set(resourceData.story.content);
      this.originalData.set({ title: resourceData.story.title, content: resourceData.story.content });
      this.restoreLocalModifications();
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.storyId() && this.isEdited()) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
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
    if (!this.storyId()) return;

    try {
      await this.saveService.createDraftFromPublished(this.storyId(), this.storyData());
      
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
      await this.saveService.update(this.storyId(), this.storyData());
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
        await this.saveService.createDraftFromPublished(this.storyId(), this.storyData());
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