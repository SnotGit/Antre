import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { LoadService } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

interface PrivateStoryResolve {
  storyId: number;
  title: string;
  content: string;
}

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

  //========= RESOLVER DATA =========

  private resolvedData = computed(() => {
    return this.route.snapshot.data['data'] as PrivateStoryResolve;
  });

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

  private readonly title = 'Modifier Histoire';
  
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
    this.loadResolvedStory();
  }

  //========= LOAD FROM RESOLVER =========

  private loadResolvedStory(): void {
    const resolved = this.resolvedData();
    if (!resolved) {
      this.router.navigate(['/chroniques/mes-histoires']);
      return;
    }

    this.storyId.set(resolved.storyId);
    this.storyTitle.set(resolved.title);
    this.storyContent.set(resolved.content);
    
    this.restoreModifications();
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