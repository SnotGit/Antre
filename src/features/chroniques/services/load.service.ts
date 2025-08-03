import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

//======= INTERFACE =======

export interface StoryData {
  id: number;
  title: string;
  content: string;
}

interface StoryResponse {
  story: StoryData;
}

@Injectable({
  providedIn: 'root'
})
export class LoadService {

  //======= INJECTIONS =======

  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api/private-stories';

  //======= LOAD =======

  async loadStory(id: number): Promise<StoryData> {
    try {
      const response = await firstValueFrom(
        this.http.get<StoryResponse>(`${this.API_URL}/edit/${id}`)
      );
      return response.story;
    } catch (error) {
      alert('Erreur lors du chargement de l\'histoire');
      throw error;
    }
  }
}