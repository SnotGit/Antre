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

@Injectable({
  providedIn: 'root'
})
export class ChroniquesResolver {

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chroniques`;

  //======= URL ENCODING/DECODING =======

  encodeTitle(title: string): string {
    return title.replace(/ /g, '-');
  }

  decodeTitle(encodedTitle: string): string {
    return encodedTitle.replace(/-/g, ' ');
  }

  //======= STORY RESOLUTION =======

  async resolveStoryByUsernameAndTitle(username: string, titleWithDashes: string): Promise<ResolvedStoryData> {
    try {
      const title = this.decodeTitle(titleWithDashes);

      const [userResponse, storyResponse] = await Promise.all([
        firstValueFrom(this.http.get<{ userId: number }>(`${this.API_URL}/resolve/username/${username}`)),
        firstValueFrom(this.http.get<{ storyId: number }>(`${this.API_URL}/resolve/${username}/${encodeURIComponent(title)}`))
      ]);

      return {
        storyId: storyResponse.storyId,
        userId: userResponse.userId,
        username,
        title
      };
    } catch (error) {
      throw new Error(`Impossible de résoudre l'histoire pour ${username}/${titleWithDashes}`);
    }
  }

  async resolveStoryByTitle(titleWithDashes: string): Promise<{ storyId: number; title: string }> {
    try {
      const title = this.decodeTitle(titleWithDashes);
      
      const response = await firstValueFrom(
        this.http.get<{ storyId: number }>(`${this.API_URL}/resolve/title/${encodeURIComponent(title)}`)
      );
      
      return {
        storyId: response.storyId,
        title
      };
    } catch (error) {
      throw new Error(`Impossible de résoudre l'histoire privée pour ${titleWithDashes}`);
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
    const titleWithDashes = this.encodeTitle(title);
    return `/chroniques/${username}/${titleWithDashes}`;
  }

  editDraftUrl(title: string): string {
    const titleWithDashes = this.encodeTitle(title);
    return `/chroniques/mes-histoires/brouillon/edition/${titleWithDashes}`;
  }

  editPublishedUrl(title: string): string {
    const titleWithDashes = this.encodeTitle(title);
    return `/chroniques/mes-histoires/publiée/edition/${titleWithDashes}`;
  }
}