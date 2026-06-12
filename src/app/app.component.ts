import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Logo } from '@shared/components/logo/logo';
import { Navbar } from '@features/menus/components/navbar/navbar';
import { LeftPanel } from '@features/menus/components/left-panel/left-panel';
import { DialogCardOverlay } from '@shared/components/dialog-card-overlay/dialog-card-overlay';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Logo,
    Navbar,
    LeftPanel,
    DialogCardOverlay
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  private readonly router = inject(Router);

  private readonly navigationEvents = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  isLogin = computed(() => {
    const event = this.navigationEvents();
    const url = event ? (event as NavigationEnd).url : this.router.url;
    return url === '/' || url === '/login' || url === '/register';
  });
}
