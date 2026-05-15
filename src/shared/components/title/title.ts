import { Component, OnInit, OnDestroy, inject, computed, signal, effect, ElementRef, viewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { TitleService } from './services/title.service';
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
  private readonly titleService = inject(TitleService);
  private readonly homeTitleService = inject(HomeTitleService);

  //======= VIEW CHILDREN =======

  private readonly titleElement = viewChild<ElementRef<HTMLElement>>('titleElement');

  //======= SIGNALS =======

  private currentUrl = signal<string>('');
  private currentTitle = signal<string>('');
  titleLeftPosition = signal<number>(0);
  titleIndent = signal<number>(0);
  isScrolling = signal<boolean>(false);
  noCursor = signal<boolean>(false);

  //======= PRIVATE STATE =======

  private scrollTimerId: ReturnType<typeof setTimeout> | undefined;
  private resizeHandler = () => this.handleResize();

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= COMPUTED =======

  showBack = computed(() => {
    const url = this.currentUrl();
    if (url.startsWith('/chroniques')) return false;
    const rootPaths = ['/accueil', '/marsball', '/archives', '/terraformars', '/auth'];
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

  private readonly _overrideTitleEffect = effect(() => {
    const override = this.titleService.overrideTitle();
    if (override) {
      this.currentTitle.set(override);
      this.calculateTitlePosition(override);
      this.typingService.title(override);
    }
  });

  private readonly _typingScrollEffect = effect(() => {
    const text = this.typingService.headerTitle();
    const isComplete = this.typingService.typingComplete();
    const el = this.titleElement()?.nativeElement;

    if (!el || !text) {
      this.titleIndent.set(0);
      this.stopScrollAnimation();
      return;
    }

    if (!isComplete) {
      requestAnimationFrame(() => {
        const overflow = el.scrollWidth - el.clientWidth;
        if (overflow > 0) {
          const charWidth = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.6);
          const steps = Math.ceil(overflow / charWidth);
          this.titleIndent.set(-steps * charWidth);
        }
      });
      return;
    }

    if (this.scrollTimerId) return;

    this.scrollTimerId = setTimeout(() => {
      const totalWidth = el.scrollWidth;
      const visibleWidth = el.clientWidth;
      if (totalWidth > visibleWidth) {
        const charWidth = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.6);
        this.startScrollAnimation(totalWidth, visibleWidth, charWidth);
      }
    }, 0);
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
    this.stopScrollAnimation();
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

    if (this.titleService.overrideTitle()) {
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
    const promptWidth = 2 * charWidth;
    const maxChars = 23;
    const displayLength = Math.min(title.length, maxChars);
    const textWidth = displayLength * charWidth;
    const frameCenterRelative = 690;
    const textPosition = frameCenterRelative - (textWidth / 2);
    const startPosition = textPosition - promptWidth - 20;

    this.titleLeftPosition.set(Math.max(40, startPosition));
    this.noCursor.set(title.length > maxChars);
  }

  private startScrollAnimation(totalWidth: number, visibleWidth: number, charWidth: number): void {
    this.stopScrollAnimation();

    const stepInterval = 250;
    const exitEnd = -(totalWidth + charWidth);
    const enterStart = visibleWidth;
    let currentIndent = this.titleIndent();
    let phase: 'exit-left' | 'enter-right' = 'exit-left';

    const step = (): void => {
      if (phase === 'exit-left') {
        currentIndent -= charWidth;
        this.titleIndent.set(currentIndent);
        if (currentIndent <= exitEnd) {
          this.isScrolling.set(true);
          phase = 'enter-right';
          currentIndent = enterStart;
          this.titleIndent.set(currentIndent);
        }
      } else {
        currentIndent -= charWidth;
        this.titleIndent.set(currentIndent);
        if (currentIndent <= 0) {
          this.titleIndent.set(0);
          this.isScrolling.set(false);
          phase = 'exit-left';
          currentIndent = 0;
        }
      }

      this.scrollTimerId = setTimeout(step, stepInterval);
    };

    this.scrollTimerId = setTimeout(step, stepInterval);
  }

  private stopScrollAnimation(): void {
    if (this.scrollTimerId) {
      clearTimeout(this.scrollTimerId);
      this.scrollTimerId = undefined;
    }
    this.isScrolling.set(false);
  }

  goBack(): void {
    this.location.back();
  }
}