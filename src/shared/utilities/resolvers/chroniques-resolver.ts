import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface ResolvedStoryData {
  storyId: number;
  userId: number;
  username: string;
  title: string;
}

//======= SERVICE CHRONIQUES RESOLVER =======

@Injectable({
  providedIn: 'root'
})
export class ChroniquesResolver {

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= URL ENCODING/DECODING =======

  encodeTitle(title: string): string {
    return encodeURIComponent(title);
  }

  decodeTitle(encodedTitle: string): string {
    return decodeURIComponent(encodedTitle);
  }

  //======= STORY RESOLUTION =======

  async resolveStoryByUsernameAndTitle(username: string, encodedTitle: string): Promise<ResolvedStoryData> {
    try {
      const title = this.decodeTitle(encodedTitle);

      const [userResponse, storyResponse] = await Promise.all([
        firstValueFrom(this.http.get<{ userId: number }>(`${this.API_URL}/resolve/username/${username}`)),
        firstValueFrom(this.http.get<{ storyId: number }>(`${this.API_URL}/resolve/story/${username}/${this.encodeTitle(title)}`))
      ]);

      return {
        storyId: storyResponse.storyId,
        userId: userResponse.userId,
        username,
        title
      };
    } catch (error) {
      throw new Error(`Impossible de résoudre l'histoire pour ${username}/${encodedTitle}`);
    }
  }

  async resolveStoryByTitle(encodedTitle: string): Promise<{ storyId: number; title: string }> {
    try {
      const title = this.decodeTitle(encodedTitle);
      
      const response = await firstValueFrom(
        this.http.get<{ storyId: number }>(`${this.API_URL}/private/resolve/title/${this.encodeTitle(title)}`)
      );
      
      return {
        storyId: response.storyId,
        title
      };
    } catch (error) {
      throw new Error(`Impossible de résoudre l'histoire privée pour ${encodedTitle}`);
    }
  }

  async resolveUserByUsername(username: string): Promise<{ userId: number }> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ userId: number }>(`${this.API_URL}/resolve/username/${username}`)
      );
      return response;
    } catch (error) {
      throw new Error(`Impossible de résoudre l'utilisateur ${username}`);
    }
  }

  //======= URL BUILDING =======

  storyUrl(username: string, title: string): string {
    return `/chroniques/${username}/${title}`;
  }

  editDraftUrl(title: string): string {
    return `/chroniques/mes-histoires/brouillon/edition/${title}`;
  }

  editPublishedUrl(title: string): string {
    return `/chroniques/mes-histoires/publiée/edition/${title}`;
  }
}