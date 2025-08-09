import { Component, inject, signal, computed, effect, input } from '@angular/core';
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
  isLoading = signal(true);

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
      this.isLoading.set(false);
      
      this.typingService.title(`Édition: ${story.title}`);
    } catch (error) {
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  });

  private autoSaveEffect = effect(() => {
    if (this.storyId() > 0 && this.draftStory() && !this.isLoading()) {
      this.saveService.save(this.storyId(), this.storyData());
    }
  });

  //======= ACTIONS =======

  async save(): Promise<void> {
    if (!this.draftStory()) return;

    try {
      if (this.storyId() > 0) {
        await this.saveService.save(this.storyId(), this.storyData());
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  }

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    const confirmed = await this.confirmationService.confirmPublishStory();
    if (!confirmed) return;

    try {
      await this.saveService.publish(this.storyId());
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la publication');
    }
  }

  async deleteStory(): Promise<void> {
    try {
      await this.deleteService.deleteStory(this.storyId());
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //======= NAVIGATION =======

  goBack(): void {
    this.location.back();
  }
}