import { Component, computed, inject, input, output } from '@angular/core';

import { CommonModule } from '@angular/common';

import { PrivateStoriesService } from '@features/chroniques/services/private-stories.service';

@Component({
  selector: 'app-stories-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stories-list.html',
  styleUrls: ['./stories-list.scss']
})
export class StoriesListComponent {

  //========== INJECTIONS ==========//

  private readonly privateStoriesService = inject(PrivateStoriesService);

  //========== INPUTS / OUTPUTS ==========//

  readonly mode = input.required<'draft' | 'published'>();

  readonly username = input.required<string>();

  readonly selectedId = input<number | null>(null);

  readonly storySelected = output<number>();

  //========== COMPUTED ==========//

  readonly stories = computed(() => {

    return this.mode() === 'draft'
      ? this.privateStoriesService.draftStories.value() ?? []
      : this.privateStoriesService.publishedStories.value() ?? [];

  });

  //========== METHODS ==========//

  selectStory(id: number): void {
    this.storySelected.emit(id);
  }
}