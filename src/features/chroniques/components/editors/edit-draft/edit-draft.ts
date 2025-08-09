import { Component, inject, signal, computed, resource, input, effect } from '@angular/core';
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
export class DraftEditor {

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

  //======= ROUTER INPUT =======

  title = input.required<string>();

  //======= SIGNALS =======

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);
  originalData = signal<StoryFormData>({ title: '', content: '' });
  hasModifications = signal(false);

  //======= COMPUTED =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  draftStory = computed(() => {
    const data = this.storyData();
    return data.title.length >= 3 && data.content.length >= 10;
  });

  canPublish = computed(() => {
    const data = this.storyData();
    return data.title.length >= 3 && data.content.length >= 100;
  });

  //======= RESOURCE =======

  private readonly storyResource = resource({
    params: () => ({
      titleParam: this.title(),
      isLoggedIn: this.authService.isLoggedIn()
    }),
    loader: async ({ params }) => {
      if (!params.titleParam) return null;
      
      if (!params.isLoggedIn) {
        this.router.navigate(['/auth/login']);
        return null;
      }

      try {
        const resolved = await this.chroniquesResolver.resolveStoryByTitle(params.titleParam);
        const story = await this.loadService.getStoryForEdit(resolved.storyId);
        
        this.storyId.set(story.id);
        this.storyTitle.set(story.title);
        this.storyContent.set(story.content);
        this.originalData.set({ title: story.title, content: story.content });
        this.typingService.title(`Édition: ${story.title}`);
        this.restoreLocalModifications();
        
        return story;
      } catch (error) {
        this.router.navigate(['/chroniques/mes-histoires']);
        return null;
      }
    }
  });

  //======= EFFECTS =======

  private modificationsTrackingEffect = effect(() => {
    const current = this.storyData();
    const original = this.originalData();
    
    if (this.storyResource.value()) {
      const isModified = current.title !== original.title || current.content !== original.content;
      this.hasModifications.set(isModified);
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.storyResource.value() && this.storyId() > 0 && this.hasModifications()) {
      this.saveService.save(this.storyId(), this.storyData());
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, this.storyData());
    }
  });

  //======= ACTIONS =======

  async cancel(): Promise<void> {
    const key = `draft-${this.storyId()}-modifications`;
    this.saveService.clearLocal(key);
    this.router.navigate(['/chroniques/mes-histoires']);
  }

  async goBack(): Promise<void> {
    if (this.hasModifications()) {
      this.saveService.save(this.storyId(), this.storyData());
    }
    this.location.back();
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    const confirmed = await this.confirmationService.confirmPublishStory();
    if (!confirmed) return;

    try {
      if (this.hasModifications()) {
        this.saveService.save(this.storyId(), this.storyData());
      }
      
      await this.saveService.publish(this.storyId());
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.clearLocal(key);
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la publication');
    }
  }

  async deleteStory(): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteStory(true);
    if (!confirmed) return;

    try {
      await this.deleteService.deleteStory(this.storyId());
      const key = `draft-${this.storyId()}-modifications`;
      this.saveService.clearLocal(key);
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //======= PRIVATE METHODS =======

  private restoreLocalModifications(): void {
    const key = `draft-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }
}