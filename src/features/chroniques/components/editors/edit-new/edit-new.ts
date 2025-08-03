import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SaveService } from '../../../services/save.service';
import { DeleteService } from '../../../services/delete.service';
import { TypingEffectService } from '../../../../../shared/services/typing-effect.service';

//========= INTERFACE =========

interface StoryData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-edit-new',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-new.html',
  styleUrl: './edit-new.scss'
})
export class EditNew implements OnInit, OnDestroy {

  //========= INJECTIONS =========

  private readonly router = inject(Router);
  private readonly saveService = inject(SaveService);
  private readonly deleteService = inject(DeleteService);
  private readonly typingService = inject(TypingEffectService);

  //========= SIGNALS =========

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //========= COMPUTED =========

  storyData = computed((): StoryData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  story = computed(() =>
    this.storyTitle().trim().length > 0 || this.storyContent().trim().length > 0
  );

  canPublish = computed(() =>
    this.storyTitle().trim().length > 0 &&
    this.storyContent().trim().length > 0
  );

  //========= TYPING-EFFECT =========

  private readonly title = 'Nouvelle Histoire';
  
  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;

  //========= EFFECT =========

  private readonly autoSaveEffect = effect(() => {
    const data = this.storyData();
    if (this.story()) {
      this.saveService.save(this.storyId(), data);
    }
  });

  //========= SAVE =========

  async save(): Promise<void> {
    if (!this.story()) return;

    try {
      const data = this.storyData();
      this.saveService.save(this.storyId(), data);
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  }

  //========= STORY =========

  private async createNewStory(): Promise<void> {
    try {
      const id = await this.saveService.createStory();
      this.storyId.set(id);
    } catch (error) {
      alert('Erreur lors de la création de l\'histoire');
    }
  }

  //========= PUBLISH =========

  async publishStory(): Promise<void> {
    if (!this.canPublish()) return;

    try {
      await this.saveService.publish(this.storyId());
      this.router.navigate(['/chroniques/my-stories']);
    } catch (error) {
      alert('Erreur lors de la publication');
    }
  }

  //========= DELETE =========

  async deleteStory(): Promise<void> {
    try {
      await this.deleteService.delete(this.storyId());
      this.router.navigate(['/chroniques/my-stories']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //========= LIFECYCLE =========

  ngOnInit(): void {
    this.typingService.title(this.title);
    this.createNewStory();
  }

  ngOnDestroy(): void {
    this.autoSaveEffect.destroy();
  }

}