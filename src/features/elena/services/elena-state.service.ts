import { Service, signal, inject, effect } from '@angular/core';
import { SearchFiltersService } from '@features/search/services/search-filters.service';
import { SearchService } from '@features/search/services/search.service';

export type ElenaClip = 'intro' | 'idle' | 'result' | 'noAnswer';

interface ClipDef {
  src: string;
  kind: 'video' | 'image';
  loop: boolean;
  next: ElenaClip | null;
}

@Service()
export class ElenaStateService {

  private readonly filters = inject(SearchFiltersService);
  private readonly searchService = inject(SearchService);

  private readonly storageKey = 'elena-activated';
  private powerTimer?: ReturnType<typeof setTimeout>;
  private lastReacted: string | null = null;
  private lastGreeted: string | null | undefined = undefined;

  readonly clip = signal<ElenaClip | null>(
    sessionStorage.getItem(this.storageKey) ? 'idle' : null
  );

  readonly powering = signal(false);

  readonly clips: Record<ElenaClip, ClipDef> = {
    intro:    { src: '/assets/videos/elena-intro.mp4',    kind: 'video', loop: false, next: 'idle' },
    idle:     { src: '/assets/videos/elena-idle.mp4',     kind: 'video', loop: true,  next: null },
    result:   { src: '/assets/videos/elena-result.mp4',   kind: 'video', loop: false, next: 'idle' },
    noAnswer: { src: '/assets/videos/elena-noanswer.mp4', kind: 'video', loop: false, next: 'idle' },
  };

  private readonly reactEffect = effect(() => {
    if (!this.searchService.hitsResolved()) return;
    const q = this.filters.query();
    if (q === '') {
      this.lastReacted = null;
      return;
    }
    if (q === this.lastReacted) return;
    this.lastReacted = q;
    this.reactToHits(this.searchService.hits().length > 0);
  });

  shouldGreet(identity: string | null): boolean {
    if (this.lastGreeted === identity) return false;
    this.lastGreeted = identity;
    return true;
  }

  start(): void {
    if (this.clip() !== null || this.powering()) return;
    sessionStorage.setItem(this.storageKey, '1');
    this.powering.set(true);
    this.powerTimer = setTimeout(() => {
      this.powering.set(false);
      this.clip.set('intro');
    }, 1500);
  }

  showResult(): void {
    this.clip.set('result');
  }

  showNoAnswer(): void {
    this.clip.set('noAnswer');
  }

  reactToHits(found: boolean): void {
    if (this.clip() === null) return;
    this.clip.set(found ? 'result' : 'noAnswer');
  }

  ended(): void {
    const current = this.clip();
    if (!current) return;
    const next = this.clips[current].next;
    if (next) this.clip.set(next);
  }

  reset(): void {
    if (this.powerTimer) clearTimeout(this.powerTimer);
    this.powering.set(false);
    sessionStorage.removeItem(this.storageKey);
    this.clip.set(null);
  }
}
