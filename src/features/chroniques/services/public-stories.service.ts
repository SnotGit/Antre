import { Service, inject, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { PublicStory, PublicStoriesResponse, UserStoriesResponse, UserStoryLink } from '../models/chroniques.models';

@Service()
export class PublicStoriesService {

  //========== INJECTIONS ==========//

  private readonly http = inject(HttpClient);
  private readonly CHRONIQUES_API = `${environment.apiUrl}/chroniques`;

  //========== RESOURCES ==========//

  readonly latestStories = resource({
    loader: async () => {
      const response = await firstValueFrom(
        this.http.get<PublicStoriesResponse>(
          `${this.CHRONIQUES_API}/stories/latest`
        )
      );
      return response.stories;
    }
  });

  //========== METHODS ==========//

  async getStoryBySlug(username: string, slug: string): Promise<PublicStory> {
    const response = await firstValueFrom(
      this.http.get<{ story: PublicStory }>(
        `${this.CHRONIQUES_API}/stories/by-slug/${username}/${slug}`
      )
    );
    return response.story;
  }

  async getUserStories(userId: number): Promise<UserStoryLink[]> {
    const response = await firstValueFrom(
      this.http.get<UserStoriesResponse>(
        `${this.CHRONIQUES_API}/stories/user/${userId}`
      )
    );
    return response.stories;
  }
}