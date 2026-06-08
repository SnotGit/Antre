import { Component, input, output, computed, inject } from '@angular/core';
import { resource } from '@angular/core';
import { StoriesService } from './stories-list.service';

@Component({
  selector: 'app-stories-list',
  templateUrl: './stories-list.html',
  styleUrls: ['./stories-list.scss']
})
export class StoriesListComponent {
  //========== INJECTIONS ==========//
  private readonly storiesService = inject(StoriesService);

  //========== SIGNALS & INPUTS ==========//
  readonly mode = input.required<'draft' | 'published'>();
  readonly username = input.required<string>();
  readonly storySelected = output<string>();

  //========== RESOURCES ==========//
  readonly storiesResource = resource({
    request: () => ({ mode: this.mode(), user: this.username() }),
    loader: async ({ request }) => {
      return request.mode === 'draft'
        ? await this.storiesService.getDrafts()
        : await this.storiesService.getPublished();
    },
  });

  //========== COMPUTED ==========//
  readonly stories = computed(() => this.storiesResource.value() ?? []);

  //========== METHODS ==========//
  selectStory(id: string): void {
    this.storySelected.emit(id);
  }
}
