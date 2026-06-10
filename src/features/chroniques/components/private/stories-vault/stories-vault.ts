import { Component, computed, inject, signal } from '@angular/core';

import { PrivateStoriesService } from '@features/chroniques/services/private-stories.service';

import { StoriesListComponent } from '../stories-list/stories-list';
import { StoryDetailComponent } from '../story-detail/story-detail';
import { LikedStories } from '../liked-stories/liked-stories';

type VaultTab = 'draft' | 'published' | 'likes';

@Component({
  selector: 'app-stories-vault',
  imports: [StoriesListComponent, StoryDetailComponent, LikedStories],
  templateUrl: './stories-vault.html',
  styleUrl: './stories-vault.scss'
})
export class StoriesVault {

  //========== INJECTIONS ==========//

  private readonly privateStoriesService = inject(PrivateStoriesService);

  //========== EDIT STATE ==========//

  readonly saveState = this.privateStoriesService.saveState;

  readonly editing = this.privateStoriesService.editing;

  //========== TABS ==========//

  readonly tab = signal<VaultTab>('draft');

  readonly mode = computed<'draft' | 'published'>(() =>
    this.tab() === 'published' ? 'published' : 'draft'
  );

  //========== SELECTION ==========//

  readonly selectedId = signal<number | null>(null);

  readonly draftSavedMessage = signal(false);

  //========== METHODS ==========//

  setTab(tab: VaultTab): void {
    if (tab === this.tab()) return;

    this.tab.set(tab);
    this.selectedId.set(null);
    this.draftSavedMessage.set(false);
    this.saveState.set('idle');
  }

  onSelect(id: number): void {
    this.selectedId.set(id);
    this.draftSavedMessage.set(false);
  }

  async createNewStory(): Promise<void> {
    const newId = await this.privateStoriesService.createDraft();

    this.tab.set('draft');
    this.selectedId.set(newId);
    this.draftSavedMessage.set(false);
  }

  handleDraftSaved(): void {
    this.selectedId.set(null);
    this.draftSavedMessage.set(true);
  }

  handleStoryPublished(storyId: number): void {
    this.tab.set('published');
    this.selectedId.set(storyId);
  }

  handleStoryDeleted(): void {
    this.selectedId.set(null);
  }
}
