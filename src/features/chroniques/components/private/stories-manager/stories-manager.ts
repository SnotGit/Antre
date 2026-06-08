import { Component, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { AuthService } from '@features/auth/services/auth.service';
import { StoriesService } from '@features/chroniques/services/stories.service';

import { CommonModule } from '@angular/common';

import { StoriesListComponent } from '../stories-list/stories-list';
import { StoryDetailComponent } from '../story-detail/story-detail';

@Component({
  selector: 'app-stories-manager',
  imports: [CommonModule, StoriesListComponent, StoryDetailComponent],
  templateUrl: './stories-manager.html',
  styleUrl: './stories-manager.scss'
})

export class StoriesManager {

  //========== INJECTIONS ==========

  private readonly route = inject(ActivatedRoute);

  protected readonly authService = inject(AuthService);

  private readonly storiesService = inject(StoriesService);

  //========== MODE ==========

  readonly mode = toSignal(
    this.route.data.pipe(
      map(data => data['mode'] as 'draft' | 'published')
    ),
    {
      initialValue: 'draft' as 'draft' | 'published'
    }
  );

  //========== SELECTION ==========

  readonly selectedId = linkedSignal<number | null>(() => {
    this.mode();
    return null;
  });

  //========== METHODS ==========

  onSelect(id: number): void {
    this.selectedId.set(id);
  }

  async createNewStory(): Promise<void> {
    const newId = await this.storiesService.createStory();
    this.selectedId.set(newId);
  }

  handleStorySaved(): void {
    // Les resources du service se rechargent déjà.
  }

  handleStoryDeleted(): void {
    this.selectedId.set(null);
  }
}