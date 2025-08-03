import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SaveService } from '@features/chroniques/services/save.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

//========= INTERFACE =========

interface StoryData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-edit-new',
  imports: [FormsModule],
  templateUrl: './edit-new.html',
  styleUrl: './edit-new.scss'
})
export class EditNew implements OnInit, OnDestroy {

  //========= INJECTIONS =========

  private readonly router = inject(Router);
  private readonly saveService = inject(SaveService);
  private readonly deleteService = inject(DeleteService);
  private readonly typingService = inject(TypingEffectService);
  private readonly confirmationService = inject(ConfirmationDialogService);

  //========= SIGNALS =========

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //========= COMPUTED =========

  storyData = computed((): StoryData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  newStory = computed(() =>
    this.storyTitle().trim().length > 0 || this.storyContent().trim().length > 0
  );

  canPublish = computed(() =>
    this.storyTitle().trim().length > 0 &&
    this.storyContent().trim().length > 0
  );

  //========= TYPING-EFFECT =========

  private readonly title = 'Nouvelle Histoire';
  
  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //========= EFFECT =========

  private readonly autoSaveEffect = effect(async () => {
    const data = this.storyData();
    if (this.newStory()) {
      await this.Story();
      if (this.storyId() > 0) {
        this.saveService.save(this.storyId(), data);
      }
    }
  });

  //========= SAVE =========

  async save(): Promise<void> {
    if (!this.newStory()) return;

    try {
      await this.Story();
      if (this.storyId() > 0) {
        const data = this.storyData();
        this.saveService.save(this.storyId(), data);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  }

  //========= STORY =========

  private async Story(): Promise<void> {
    if (this.storyId() === 0) {
      try {
        const id = await this.saveService.createStory();
        this.storyId.set(id);
      } catch (error) {
        alert('Erreur lors de la création de l\'histoire');
      }
    }
  }

  //========= PUBLISH =========

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    const confirmed = await this.confirmationService.confirmPublishStory();
    if (!confirmed) return;

    try {
      await this.Story();
      if (this.storyId() > 0) {
        await this.saveService.publish(this.storyId());
        this.router.navigate(['/chroniques/mes-histoires']);
      }
    } catch (error) {
      alert('Erreur lors de la publication');
    }
  }

  //========= DELETE =========

  async deleteStory(): Promise<void> {
    if (this.storyId() === 0) {
      this.router.navigate(['/chroniques/mes-histoires']);
      return;
    }

    try {
      await this.deleteService.delete(this.storyId());
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //========= LIFECYCLE =========

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.autoSaveEffect.destroy();
  }

}