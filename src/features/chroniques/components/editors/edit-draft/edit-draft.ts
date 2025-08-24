import { Component, OnInit, OnDestroy, inject, signal, computed, effect, input, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
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
  private readonly loadService = inject(LoadService);
  private readonly chroniquesResolver = inject(ChroniquesResolver);
  private readonly typingService = inject(TypingEffectService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly authService = inject(AuthService);

  //======= TYPING EFFECT =======

  private readonly title = 'Modifier Brouillon';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= ROUTER INPUT =======

  titleUrl = input.required<string>();

  //======= DRAFT RESOURCE =======

  private readonly draftResource = resource({
    params: () => ({
      titleUrl: this.titleUrl(),
      isAuthenticated: this.authService.isLoggedIn()
    }),
    loader: async ({ params }) => {
      if (!params.isAuthenticated) {
        this.router.navigate(['/auth/login']);
        return null;
      }

      try {
        const resolved = await this.chroniquesResolver.encodeTitle(params.titleUrl);
        const story = await this.loadService.getDraftStory(resolved.storyId);
        
        return {
          story,
          storyId: resolved.storyId
        };
      } catch (error) {
        this.router.navigate(['/chroniques/mes-histoires']);
        return null;
      }
    }
  });

  //======= COMPUTED FROM RESOURCE =======

  storyId = computed(() => this.draftResource.value()?.storyId || 0);

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');

  //======= COMPUTED =======

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  canPublish = computed(() => {
    return this.storyTitle().trim().length > 0 && 
           this.storyContent().trim().length > 0;
  });

  //======= EFFECTS =======

  private readonly dataLoadEffect = effect(() => {
    const resourceData = this.draftResource.value();
    
    if (resourceData?.story) {
      this.storyTitle.set(resourceData.story.title);
      this.storyContent.set(resourceData.story.content);
      this.restoreLocalModifications();
    }
  });

  private readonly autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && (this.storyTitle() || this.storyContent())) {
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= LOCAL STORAGE =======

  private restoreLocalModifications(): void {
    if (!this.storyId()) return;
    
    const key = `draft-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  private clearLocalStorage(): void {
    if (!this.storyId()) return;
    
    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
  }

  //======= ACTIONS =======

  async cancel(): Promise<void> {
    this.clearLocalStorage();
    this.navigateBack();
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish() || !this.storyId()) return;

    try {
      await this.saveService.save(this.storyId(), this.storyData());
      await this.saveService.publish(this.storyId());
      this.clearLocalStorage();
      this.confirmationService.showSuccessMessage();
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      this.confirmationService.showErrorMessage();
    }
  }

  //======= NAVIGATION =======

  async goBack(): Promise<void> {
    if (this.storyId()) {
      try {
        await this.saveService.save(this.storyId(), this.storyData());
      } catch (error) {
        this.confirmationService.showErrorMessage();
        return;
      }
    }
    
    this.clearLocalStorage();
    this.navigateBack();
  }

  private navigateBack(): void {
    this.location.back();
  }
}