import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { LoadService, StoryData } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

@Component({
  selector: 'app-edit-published',
  imports: [FormsModule],
  templateUrl: './edit-published.html',
  styleUrl: './edit-published.scss'
})
export class PublishedEditor implements OnInit, OnDestroy {

  //========= INJECTIONS =========

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly saveService = inject(SaveService);
  private readonly loadService = inject(LoadService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);


  //========= SIGNALS =========

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //========= COMPUTED =========

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  publishedStory = computed(() =>
    this.storyTitle().trim().length > 0 || this.storyContent().trim().length > 0
  );

  canUpdate = computed(() =>
    this.storyTitle().trim().length > 0 &&
    this.storyContent().trim().length > 0
  );

  //========= TYPING-EFFECT =========

  private readonly title = 'Modifier Histoire Publiée';
  
  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //========= EFFECT =========

  private readonly autoSaveEffect = effect(() => {
    const data = this.storyData();
    if (this.publishedStory() && this.storyId() > 0) {
      const key = `published-${this.storyId()}-modifications`;
      this.saveService.saveLocal(key, data);
    }
  });

  //========= SAVE TO DRAFT =========

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

  //========= UPDATE =========

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

  //========= CANCEL =========

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

  //========= NAVIGATION =========

  goBack(): void {
    this.location.back();
  }

  //========= LIFECYCLE =========

  ngOnInit(): void {
    this.typingService.title(this.title);
    this.loadPublishedStory();
  }

  //========= LOAD PUBLISHED STORY =========

  private async loadPublishedStory(): Promise<void> {
    try {
      const id = Number(this.route.snapshot.params['id']);
      const story = await this.loadService.getStory(id);
      
      this.storyId.set(story.id);
      this.storyTitle.set(story.title);
      this.storyContent.set(story.content);
      
      this.restoreModifications();
    } catch (error) {
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  }

  //========= RESTORE MODIFICATIONS =========

  private restoreModifications(): void {
    const key = `published-${this.storyId()}-modifications`;
    const saved = this.saveService.restoreLocal(key);
    
    if (saved) {
      this.storyTitle.set(saved.title);
      this.storyContent.set(saved.content);
    }
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
    this.autoSaveEffect.destroy();
  }

}