import { Component, OnInit, OnDestroy, inject, computed, signal, effect, ElementRef, viewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { HomeTitleService } from './services/home-title.service';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.html',
  styleUrl: './title.scss'
})
export class Title implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly typingService = inject(TypingEffectService);
  private readonly homeTitleService = inject(HomeTitleService);

  //======= VIEW CHILDREN =======

  private readonly titleElement = viewChild<ElementRef<HTMLElement>>('titleElement');

  //======= SIGNALS =======

  private currentUrl = signal<string>('');
  private currentTitle = signal<string>('');
  titleLeftPosition = signal<number>(0);

  private resizeHandler = () => this.handleResize();

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= COMPUTED =======

  showBack = computed(() => {
    const url = this.currentUrl();
    const rootPaths = ['/accueil', '/chroniques', '/marsball', '/archives', '/terraformars' , '/auth'];
    return !rootPaths.includes(url);
  });

  //======= EFFECTS =======

  private readonly _homeTitleEffect = effect(() => {
    const homeTitle = this.homeTitleService.currentTitle();
    if (this.homeTitleService.isActive() && homeTitle) {
      this.currentTitle.set(homeTitle);
      this.calculateTitlePosition(homeTitle);
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

    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
    window.removeEventListener('resize', this.resizeHandler);
  }

  //======= METHODS =======

  private handleResize(): void {
    const title = this.currentTitle();
    if (title) {
      this.calculateTitlePosition(title);
    }
  }

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
    } else if (url.startsWith('/auth')) {
      title = 'Authentification';
    }

    if (title) {
      this.currentTitle.set(title);
      this.calculateTitlePosition(title);
      this.typingService.title(title);
    }
  }

  private calculateTitlePosition(title: string): void {
    const isDesktop = window.innerWidth >= 1180 && window.matchMedia('(orientation: landscape)').matches;
    
    if (!isDesktop) {
      this.titleLeftPosition.set(190);
      return;
    }

    const charWidth = 19;
    const textWidth = title.length * charWidth;
    const promptWidth = 2 * charWidth;

    const frameCenterRelative = 682.5;
    const textPosition = frameCenterRelative - (textWidth / 2);
    const startPosition = textPosition - promptWidth - 20;

    this.titleLeftPosition.set(startPosition);
  }

  goBack(): void {
    this.location.back();
  }
}