import { Component, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { Navbar } from '../features/menus/components/navbar/navbar';
import { ConsoleV3 } from '../features/menus/components/console-v3/console-v3';
import { Terminal } from '../features/menus/components/terminal/terminal';
import { Title } from '@shared/components/title/title';
import { ConfirmationDialog } from '@shared/components/confirmation-dialog/confirmation-dialog';
import { CreateCategory } from '@shared/components/create-category/create-category';
import { NewMarsballItem } from '@features/marsball/components/new-marsball-item/new-marsball-item';
import { NewBestiaireCreature } from '@features/marsball/bestiaire/components/new-bestiaire-creature/new-bestiaire-creature';
import { NewRoverItem } from '@features/marsball/rover/components/new-rover-item/new-rover-item';
import { AutoplayVideoDirective } from './directive/autoplay-video.directive';

@Component({
  selector: 'app-root',
  imports: [
    NgClass,
    RouterOutlet, 
    Navbar, 
    ConsoleV3, 
    Terminal, 
    Title,
    ConfirmationDialog, 
    CreateCategory, 
    NewMarsballItem, 
    NewBestiaireCreature, 
    NewRoverItem,
    AutoplayVideoDirective
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  //======= INJECTIONS =======

  private readonly router = inject(Router);

  //======= SIGNALS =======

  private readonly navigationEvents = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ),
    { initialValue: null }
  );

  //======= COMPUTED =======

  flameClass = computed(() => {
    const event = this.navigationEvents();
    if (!event) return '';
    
    const url = (event as NavigationEnd).url;
    if (url.includes('/marsball')) return 'marsball';
    if (url.includes('/terraformars')) return 'terraformars';
    if (url.includes('/chroniques')) return 'chroniques';
    if (url.includes('/archives')) return 'archives';
    return '';
  });
}