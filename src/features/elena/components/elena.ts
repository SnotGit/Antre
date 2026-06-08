import { Component, inject, computed, effect, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ElenaStateService } from '@features/elena/services/elena-state.service';
import { SearchFiltersService } from '@features/search/services/search-filters.service';

@Component({
  selector: 'app-elena-avatar',
  imports: [],
  templateUrl: './elena.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './elena.scss'
})
export class Elena{

  private readonly elena = inject(ElenaStateService);
  private readonly router = inject(Router);
  private readonly filters = inject(SearchFiltersService);
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('video');

  protected readonly clip = this.elena.clip;
  protected readonly powering = this.elena.powering;

  protected readonly current = computed(() => {
    const c = this.clip();
    return c ? this.elena.clips[c] : null;
  });

  protected readonly statusLabel = computed(() => {
    if (this.powering()) return 'DÉMARRAGE';
    return this.clip() ? 'ACTIVÉE' : 'INACTIVE';
  });

  private readonly playOnChange = effect(() => {
    const def = this.current();
    const video = this.videoRef()?.nativeElement;
    if (!def || !video) return;
    video.load();
    video.play().catch(() => {});
  });

  protected onEnded(): void {
    this.elena.ended();
  }

  protected goHome(): void {
    this.filters.reset();
    this.router.navigate(['/accueil']);
  }
}
