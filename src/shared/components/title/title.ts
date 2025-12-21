import { Component, OnInit, OnDestroy, inject, computed, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { HomeTitleService } from './services/home-title.service';
import { Searchbar } from '@shared/components/searchbar/searchbar';

@Component({
  selector: 'app-title',
  imports: [Searchbar],
  templateUrl: './title.html',
  styleUrl: './title.scss'
})
export class Title implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly typingService = inject(TypingEffectService);
  private readonly homeTitleService = inject(HomeTitleService);

  //======= SIGNALS =======

  private currentUrl = signal<string>('');

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= COMPUTED =======

  showBack = computed(() => {
    const url = this.currentUrl();
    const rootPaths = ['/accueil', '/chroniques', '/marsball', '/archives', '/terraformars'];
    return !rootPaths.includes(url);
  });

  //======= EFFECTS =======

  private readonly _homeTitleEffect = effect(() => {
    const homeTitle = this.homeTitleService.currentTitle();
    if (this.homeTitleService.isActive() && homeTitle) {
      this.typingService.title(homeTitle);
    }
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.updateTitle(event.urlAfterRedirects);
      });

    this.updateTitle(this.router.url);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= METHODS =======

  private updateTitle(url: string): void {
    if (url === '/accueil') {
      return;
    }

    let title = '';

    if (url.startsWith('/chroniques')) {
      title = 'Les Chroniques de Mars';
    } else if (url.startsWith('/marsball')) {
      title = 'Marsball';
    } else if (url.startsWith('/archives')) {
      title = 'Archives';
    } else if (url.startsWith('/terraformars')) {
      title = 'Terraformars';
    } else if (url.startsWith('/mon-compte')) {
      title = 'Mon Compte';
    } else if (url.startsWith('/staff')) {
      title = 'Staff';
    }

    if (title) {
      this.typingService.title(title);
    }
  }

  goBack(): void {
    this.location.back();
  }
}