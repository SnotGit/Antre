import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { SaveService, StoryFormData } from '@features/chroniques/services/save.service';
import { DeleteService } from '@features/chroniques/services/delete.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';

interface PrivateStoryResolve {
  storyId: number;
  title: string;
  content: string;
}

@Component({
  selector: 'app-edit-draft',
  imports: [FormsModule],
  templateUrl: './edit-draft.html',
  styleUrl: './edit-draft.scss'
})
export class DraftEditor implements OnInit, OnDestroy {

  //========= INJECTIONS =========

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly saveService = inject(SaveService);
  private readonly deleteService = inject(DeleteService);
  private readonly confirmationService = inject(ConfirmationDialogService);
  private readonly typingService = inject(TypingEffectService);

  //========= RESOLVER DATA =========

  private routeData = toSignal(this.route.data);
  private resolvedData = computed(() => this.routeData()?.['data'] as PrivateStoryResolve);

  //========= SIGNALS =========

  storyTitle = signal('');
  storyContent = signal('');
  storyId = signal<number>(0);

  //========= COMPUTED =========

  storyData = computed((): StoryFormData => ({
    title: this.storyTitle(),
    content: this.storyContent()
  }));

  draftStory = computed(() =>
    this.storyTitle().trim().length > 0 || this.storyContent().trim().length > 0
  );

  canPublish = computed(() =>
    this.storyTitle().trim().length > 0 &&
    this.storyContent().trim().length > 0
  );

  //========= TYPING-EFFECT =========

  private readonly title = 'Modifier Brouillon';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //========= EFFECT =========

  private readonly autoSaveEffect = effect(() => {
    const data = this.storyData();
    if (this.draftStory() && this.storyId() > 0) {
      this.saveService.save(this.storyId(), data);
    }
  });

  //========= LIFECYCLE =========

  ngOnInit(): void {
    this.typingService.title(this.title);
    this.loadResolvedStory();
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
    this.autoSaveEffect.destroy();
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
  }

  //========= SAVE =========

  async save(): Promise<void> {
    if (!this.draftStory()) return;

    try {
      if (this.storyId() > 0) {
        const data = this.storyData();
        this.saveService.save(this.storyId(), data);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
  }

  //========= PUBLISH =========

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

  //========= DELETE =========

  async deleteStory(): Promise<void> {
    try {
      await this.deleteService.delete(this.storyId());
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  }

  //========= NAVIGATION =========

  goBack(): void {
    this.location.back();
  }
}