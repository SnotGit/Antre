import { Component, inject, computed, resource, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { DraftStoriesService, DraftStory } from '@features/chroniques/services/draft-stories.service';

@Component({
  selector: 'app-draft-list',
  imports: [],
  templateUrl: './draft-list.html',
  styleUrl: './draft-list.scss'
})
export class DraftList {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly draftStoriesService = inject(DraftStoriesService);

  //======= INPUTS / OUTPUTS =======

  selectedId = input<number | null>(null);
  refreshKey = input<number>(0);
  select = output<number>();

  //======= DATA LOADING =======

  private readonly draftStoriesResource = resource({
    params: () => ({
      isLoggedIn: this.authService.isLoggedIn(),
      refresh: this.refreshKey()
    }),
    loader: async ({ params }) => {
      if (!params.isLoggedIn) {
        this.router.navigate(['/auth/login']);
        return [];
      }

      return await this.draftStoriesService.getDraftStories();
    }
  });

  draftStories = computed((): DraftStory[] => {
    return this.draftStoriesResource.value() || [];
  });
}
