import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { resource } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PrivateStoriesService } from '@features/chroniques/services/private-stories.service';

import { Story } from '@features/chroniques/models/chroniques.models';

@Component({
  selector: 'app-story-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './story-detail.html',
  styleUrls: ['./story-detail.scss']
})
export class StoryDetailComponent {

  //========== INJECTIONS ==========

  private readonly storiesService = inject(PrivateStoriesService);

  //========== INPUTS ==========

  readonly storyId = input.required<number>();

  readonly mode = input.required<'draft' | 'published'>();

  //========== UI STATE ==========

  readonly isEditing = signal(false);

  readonly saving = signal(false);

  readonly publishing = signal(false);

  readonly deleting = signal(false);

  readonly error = signal<string | null>(null);

  //========== OUTPUTS ==========

  readonly storySaved = output<void>();

  readonly storyDeleted = output<void>();

  //========== RESOURCE ==========

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

  //========== COMPUTED ==========

  readonly story = computed(() => this.storyResource.value());

  //========== FORM STATE ==========

  readonly form = signal<Partial<Story>>({
    title: '',
    content: '',
    originalStoryId: undefined
  });

  //========== FORM SYNC ==========

  private readonly syncForm = effect(() => {
    const story = this.story();

    if (!story) return;

    this.form.set({
      title: story.title,
      content: story.content,
      originalStoryId: story.originalStoryId
    });
  });

  //========== METHODS ==========

  toggleEdit(): void {
    this.isEditing.update(v => !v);
  }

  async save(): Promise<void> {
    const story = this.story();

    if (!story) return;

    this.saving.set(true);
    this.error.set(null);

    try {

      await this.storiesService.saveDraft(
        story.id,
        this.form()
      );

      this.storyResource.reload();

      this.isEditing.set(false);

      this.storySaved.emit();

    } catch (error: unknown) {

      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la sauvegarde';

      this.error.set(message);

    } finally {

      this.saving.set(false);

    }
  }

  async publish(): Promise<void> {
    const story = this.story();

    if (!story) return;

    this.publishing.set(true);
    this.error.set(null);

    try {

      await this.storiesService.publishStory(story.id);

      this.storyResource.reload();

      this.isEditing.set(false);

      this.storySaved.emit();

    } catch (error: unknown) {

      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la publication';

      this.error.set(message);

    } finally {

      this.publishing.set(false);

    }
  }

  async delete(): Promise<void> {
    const story = this.story();

    if (!story) return;

    this.deleting.set(true);
    this.error.set(null);

    try {

      await this.storiesService.deleteStory(story.id);

      this.storyDeleted.emit();

    } catch (error: unknown) {

      const message =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la suppression';

      this.error.set(message);

    } finally {

      this.deleting.set(false);

    }
  }

  cancel(): void {
    const story = this.story();

    if (!story) return;

    this.form.set({
      title: story.title,
      content: story.content,
      originalStoryId: story.originalStoryId
    });

    this.isEditing.set(false);
  }
}