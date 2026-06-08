import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Logo } from '@shared/components/logo/logo';
import { Navbar } from '@features/menus/components/navbar/navbar';
import { LeftPanel } from '@features/menus/components/left-panel/left-panel';
import { ConfirmationDialog } from '@shared/components/confirmation-dialog/confirmation-dialog';
import { CreateCategory } from '@shared/components/create-category/create-category';
import { NewMarsballItem } from '@features/marsball/components/new-marsball-item/new-marsball-item';
import { NewBestiaireCreature } from '@features/marsball/bestiaire/components/new-bestiaire-creature/new-bestiaire-creature';
import { NewRoverItem } from '@features/marsball/rover/components/new-rover-item/new-rover-item';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Logo,
    Navbar,
    LeftPanel,
    ConfirmationDialog,
    CreateCategory,
    NewMarsballItem,
    NewBestiaireCreature,
    NewRoverItem
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

  isAcces = computed(() => {
    const event = this.navigationEvents();
    const url = event ? (event as NavigationEnd).url : this.router.url;
    return url === '/' || url === '/login' || url === '/register';
  });
}
