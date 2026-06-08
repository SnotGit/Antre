import { Component, input, output, computed, signal, inject } from '@angular/core';
import { resource } from '@angular/core';
import { StoriesService, StoryFormData } from './stories-list.service';

@Component({
  selector: 'app-story-detail',
  templateUrl: './story-detail.html',
  styleUrls: ['./story-detail.scss']
})
export class StoryDetailComponent {
  //========== INJECTIONS ==========//
  private readonly storiesService = inject(StoriesService);

  //========== SIGNALS & INPUTS ==========//
  readonly storyId = input.required<number>();
  readonly mode = input.required<'draft' | 'published'>();

  readonly isEditing = signal(false);

  readonly storySaved = output<void>();
  readonly storyDeleted = output<void>();

  //========== RESOURCES ==========//
  readonly storyResource = resource({
    request: () => ({ id: this.storyId(), mode: this.mode() }),
    loader: async ({ request }) => {
      return await this.storiesService.getStory(request.id, request.mode);
    },
  });

  //========== COMPUTED ==========//
  readonly story = computed(() => this.storyResource.value());

  //========== METHODS ==========//
  toggleEdit(): void {
    this.isEditing.set(!this.isEditing());
  }

  async save(): Promise<void> {
    const currentStory = this.story();
    if (!currentStory) return;

    const formData: StoryFormData = {
      title: currentStory.title,
      content: currentStory.content,
      originalStoryId: currentStory.originalStoryId
    };

    await this.storiesService.saveStory(currentStory.id, formData);
    this.isEditing.set(false);
    this.storySaved.emit();
  }

  async publish(): Promise<void> {
    const currentStory = this.story();
    if (!currentStory) return;

    await this.storiesService.publishStory(currentStory.id);
    this.isEditing.set(false);
    this.storySaved.emit();
  }

  async delete(): Promise<void> {
    const currentStory = this.story();
    if (!currentStory) return;

    await this.storiesService.deleteStory(currentStory.id);
    this.storyDeleted.emit();
  }

  cancel(): void {
    this.isEditing.set(false);
  }
}
