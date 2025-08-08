import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';

export interface UserStats {
  drafts: number;
  published: number;
  totalStories: number;
  totalLikes: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  //============ INJECTIONS ============

  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/user/stats`;

  //============ SIGNALS ============

  private _loading = signal(false);
  private _error = signal<string | null>(null);

  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  //============ GET STATS ============

  async getStats(): Promise<UserStats> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<{ stats: UserStats }>(this.API_URL)
      );

      return response.stats;

    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        this._error.set(error.error?.error || 'Erreur lors du chargement des statistiques');
      } else {
        this._error.set('Erreur lors du chargement des statistiques');
      }
      return { drafts: 0, published: 0, totalStories: 0, totalLikes: 0 };
    } finally {
      this._loading.set(false);
    }
  }

  //============ UTILITIES ============

  clearError(): void {
    this._error.set(null);
  }
}