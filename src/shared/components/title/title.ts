import { Component, OnInit, OnDestroy, inject, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';

@Component({
  selector: 'app-title',
  imports: [],
  templateUrl: './title.html',
  styleUrl: './title.scss'
})
export class TitleComponent implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly typingService = inject(TypingEffectService);

  //======= COMPUTED =======

  currentTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('/marsball/bestiaire')) return 'BESTIAIRE';
    if (url.includes('/marsball/rover')) return 'ROVER';
    if (url.includes('/marsball')) return 'MARSBALL';
    if (url.includes('/chroniques')) return 'CHRONIQUES DE MARS';
    if (url.includes('/archives')) return 'ARCHIVES';
    if (url.includes('/terraformars')) return 'TERRAFORMARS';
    if (url.includes('/staff')) return 'STAFF';
    return '';
  });

  //======= SIGNALS =======

  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.currentTitle());
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= EFFECTS =======

  constructor() {
    effect(() => {
      this.typingService.title(this.currentTitle());
    });
  }
}