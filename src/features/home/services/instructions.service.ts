import { Service, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '@features/auth/services/auth.service';

const VISITED_KEY = 'antre.visited';

@Service()
export class InstructionsService {

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  private readonly _visible = signal<boolean>(this.firstVisit());

  readonly visible = this._visible.asReadonly();

  private readonly watchNavigation = this.router.events
    .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
    .subscribe((e) => {
      if (!e.urlAfterRedirects.startsWith('/accueil')) {
        this._visible.set(false);
      }
    });

  show(): void {
    this._visible.set(true);
  }

  hide(): void {
    this._visible.set(false);
  }

  toggle(): void {
    this._visible.update((v) => !v);
  }

  private firstVisit(): boolean {
    if (this.auth.isLoggedIn()) {
      localStorage.setItem(VISITED_KEY, 'true');
      return false;
    }
    const visited = localStorage.getItem(VISITED_KEY) === 'true';
    if (!visited) {
      localStorage.setItem(VISITED_KEY, 'true');
    }
    return !visited;
  }
}
