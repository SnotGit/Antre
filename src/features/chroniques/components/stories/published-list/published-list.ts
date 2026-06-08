import { Component, inject, computed, resource, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { PublishedStoriesService, PublishedStory } from '@features/chroniques/services/published-stories.service';

@Component({
  selector: 'app-published-list',
  imports: [],
  templateUrl: './published-list.html',
  styleUrl: './published-list.scss'
})
export class PublishedList {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly publishedStoriesService = inject(PublishedStoriesService);

  //======= INPUTS / OUTPUTS =======

  selectedId = input<number | null>(null);
  refreshKey = input<number>(0);
  select = output<number>();

  //======= DATA LOADING =======

  private readonly publishedStoriesResource = resource({
    params: () => ({
      isLoggedIn: this.authService.isLoggedIn(),
      refresh: this.refreshKey()
    }),
    loader: async ({ params }) => {
      if (!params.isLoggedIn) {
        this.router.navigate(['/auth/login']);
        return [];
      }

      return await this.publishedStoriesService.getPublishedStories();
    }
  });

  publishedStories = computed((): PublishedStory[] => {
    return this.publishedStoriesResource.value() || [];
  });
}
