import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { InstructionsService } from '@features/home/services/instructions.service';

@Component({
  selector: 'app-home',
  imports: [RouterOutlet],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  //========== INJECTIONS ==========//

  protected readonly router = inject(Router);
  protected readonly instructions = inject(InstructionsService);

  //========== SIGNALS ==========//

  protected readonly draft = signal('');
  protected readonly focused = signal(false);
  protected readonly mode = signal<'search' | 'chat'>('search');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  //========== COMPUTED ==========//

  protected readonly isRechercheRoute = computed(() =>
    this.currentUrl().includes('/accueil/recherche')
  );

  protected readonly isDiscuterRoute = computed(() =>
    this.currentUrl().includes('/accueil/discuter')
  );

  //========== ACTIONS ==========//

  protected changeMode(m: 'search' | 'chat'): void {
    this.mode.set(m);
  }

  protected onInput(value: string): void {
    this.draft.set(value);
  }

  protected submit(input: HTMLInputElement): void {
    const q = this.draft().trim();
    if (q.length < 2) return;
    if (this.mode() === 'search') {
      this.router.navigate(['/accueil/recherche'], { queryParams: { q } });
    } else {
      this.router.navigate(['/accueil/discuter']);
    }
    this.draft.set('');
    input.blur();
  }
}
