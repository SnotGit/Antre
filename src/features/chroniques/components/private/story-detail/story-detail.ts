import { Component, OnDestroy, computed, effect, inject, input, linkedSignal, output, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PrivateStoriesService } from '@features/chroniques/services/private-stories.service';
import { ConfirmationDialogService } from '@shared/services/dialog/confirmation-dialog.service';

interface PendingSave {
  isDraft: boolean;
  storyId: number;
  revisionId: number | null;
  form: { title: string; content: string };
}

@Component({
  selector: 'app-story-detail',
  imports: [FormsModule],
  templateUrl: './story-detail.html',
  styleUrls: ['./story-detail.scss']
})
export class StoryDetailComponent implements OnDestroy {

  //========== INJECTIONS ==========//

  private readonly storiesService = inject(PrivateStoriesService);

  private readonly confirmationDialog = inject(ConfirmationDialogService);

  //========== INPUTS / OUTPUTS ==========//

  readonly storyId = input.required<number>();

  readonly mode = input.required<'draft' | 'published'>();

  readonly storyDeleted = output<void>();

  readonly storyPublished = output<number>();

  readonly draftSaved = output<void>();

  //========== RESOURCE ==========//

  readonly storyResource = resource({
    params: () => ({
      id: this.storyId(),
      mode: this.mode()
    }),

    loader: async ({ params }) => {
      return await this.storiesService.getStoryDetail(
        params.id,
        params.mode === 'draft'
      );
    }
  });

  //========== COMPUTED ==========//

  readonly story = computed(() => this.storyResource.value());

  readonly isRepublication = computed(() => !!this.story()?.originalStoryId);

  readonly hasRevision = computed(() => {
    const drafts = this.storiesService.draftStories.value() ?? [];
    return drafts.some(draft => draft.originalStoryId === this.storyId());
  });

  //========== UI STATE ==========//

  readonly isEditing = linkedSignal(() => {
    const story = this.story();
    return !!story && !story.title && !story.content;
  });

  private readonly syncEditing = effect(() => {
    this.storiesService.editing.set(this.isEditing());
  });

  readonly busy = signal(false);

  readonly error = signal<string | null>(null);

  private readonly saveState = this.storiesService.saveState;

  //========== FORM ==========//

  readonly form = linkedSignal(() => ({
    title: this.story()?.title ?? '',
    content: this.story()?.content ?? ''
  }));

  updateTitle(title: string): void {
    this.form.update(f => ({ ...f, title }));
    this.scheduleAutoSave();
  }

  updateContent(content: string): void {
    this.form.update(f => ({ ...f, content }));
    this.scheduleAutoSave();
  }

  private isDirty(): boolean {
    const story = this.story();
    const form = this.form();

    return !!story && (
      form.title !== story.title ||
      form.content !== (story.content ?? '')
    );
  }

  //========== REVISION (publiée -> brouillon lié) ==========//

  private readonly revisionDraftId = linkedSignal<number | null>(() => {
    this.storyId();
    return null;
  });

  //========== AUTO-SAVE ==========//

  private pending: PendingSave | null = null;

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private savedIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleAutoSave(): void {
    this.clearTimer();

    if (!this.isEditing() || !this.isDirty()) {
      this.pending = null;
      return;
    }

    this.pending = {
      isDraft: this.mode() === 'draft',
      storyId: this.storyId(),
      revisionId: this.revisionDraftId(),
      form: this.form()
    };

    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      void this.flushPending();
    }, 1500);
  }

  private async flushPending(): Promise<void> {
    this.clearTimer();

    const pending = this.pending;
    this.pending = null;

    if (!pending) return;

    this.error.set(null);

    try {

      if (pending.isDraft) {

        await this.storiesService.saveDraft(pending.storyId, pending.form);

      } else if (pending.revisionId !== null) {

        await this.storiesService.saveDraft(pending.revisionId, pending.form);

      } else {

        const draftId = await this.storiesService.createDraft({
          ...pending.form,
          originalStoryId: pending.storyId
        });

        if (this.storyId() === pending.storyId) {
          this.revisionDraftId.set(draftId);
        }

      }

      this.showSavedIndicator();

    } catch (error: unknown) {
      this.saveState.set('idle');
      this.error.set(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde automatique');
    }
  }

  private showSavedIndicator(): void {
    if (this.savedIndicatorTimer !== null) {
      clearTimeout(this.savedIndicatorTimer);
    }

    this.saveState.set('saved');

    this.savedIndicatorTimer = setTimeout(() => {
      this.savedIndicatorTimer = null;
      this.saveState.set('idle');
    }, 2000);
  }

  private discardPending(): void {
    this.clearTimer();
    this.pending = null;
  }

  private clearTimer(): void {
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  //========== LIFECYCLE ==========//

  ngOnDestroy(): void {
    void this.flushPending();
    this.storiesService.editing.set(false);
  }

  //========== EDIT ==========//

  startEdit(): void {
    this.saveState.set('idle');
    this.isEditing.set(true);
  }

  async cancel(): Promise<void> {
    this.discardPending();

    const story = this.story();

    if (!story) return;

    await this.run('Erreur lors de l\'annulation', async () => {

      if (this.mode() === 'draft') {

        if (!story.title && !story.content) {
          await this.storiesService.deleteStory(story.id);
          this.storyDeleted.emit();
          return;
        }

        await this.storiesService.saveDraft(story.id, {
          title: story.title,
          content: story.content ?? ''
        });

      } else {

        const revisionId = this.revisionDraftId();

        if (revisionId !== null) {
          await this.storiesService.deleteStory(revisionId);
          this.revisionDraftId.set(null);
        }

      }

      this.form.set({
        title: story.title,
        content: story.content ?? ''
      });

      this.saveState.set('idle');
      this.isEditing.set(false);

    });
  }

  async saveAndClose(): Promise<void> {
    await this.flushPending();

    if (this.error()) return;

    this.isEditing.set(false);
    this.draftSaved.emit();
  }

  //========== PUBLISH ==========//

  async publish(): Promise<void> {
    await this.flushPending();

    const story = this.story();

    if (!story) return;

    await this.run('Erreur lors de la publication', async () => {

      if (this.mode() === 'draft') {

        if (story.originalStoryId) {
          await this.storiesService.republishFromDraft(story.id);
          this.storyPublished.emit(story.originalStoryId);
        } else {
          await this.storiesService.publishStory(story.id);
          this.storyPublished.emit(story.id);
        }

      } else {

        const revisionId = this.revisionDraftId();

        if (revisionId === null) {
          this.isEditing.set(false);
          return;
        }

        await this.storiesService.republishFromDraft(revisionId);

        this.revisionDraftId.set(null);
        this.storyResource.reload();
        this.isEditing.set(false);

        this.storyPublished.emit(story.id);

      }

    });
  }

  //========== DELETE ==========//

  async delete(): Promise<void> {
    const story = this.story();

    if (!story) return;

    const confirmed = await this.confirmationDialog.showDialog({
      title: this.mode() === 'draft' ? 'Suppression brouillon' : 'Suppression histoire',
      message: this.mode() === 'draft'
        ? 'Êtes-vous sûr de vouloir supprimer ce brouillon ?'
        : 'Êtes-vous sûr de vouloir supprimer cette histoire ?',
      items: [story.title || 'Sans titre'],
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    });

    if (!confirmed) return;

    this.discardPending();

    await this.run('Erreur lors de la suppression', async () => {

      await this.storiesService.deleteStory(story.id);

      this.storyDeleted.emit();

    });
  }

  //========== HELPER ==========//

  private async run(fallback: string, action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set(null);

    try {
      await action();
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : fallback);
    } finally {
      this.busy.set(false);
    }
  }
}
