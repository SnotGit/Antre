import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface UserLatestStory {
  id: number;
  username: string;
  description: string;
  avatar: string | null;
  latestStory: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChroniquesService {
  private readonly API_URL = 'http://localhost:3000/api';
  
  private _users = signal<UserLatestStory[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  users = this._users.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  loadUsers(): void {
    this._loading.set(true);
    this._error.set(null);

    this.http.get<{message: string, users: UserLatestStory[]}>
      (`${this.API_URL}/chroniques/latest-stories`).subscribe({
      next: (response) => {
        const users = response.users || [];
        this._users.set(users);
        this._loading.set(false);
      },
      error: (error) => {
        this._error.set('Erreur lors du chargement des chroniques');
        this._loading.set(false);
        this._users.set([]);
      }
    });
  }

  refresh(): void {
    this.loadUsers();
  }
}