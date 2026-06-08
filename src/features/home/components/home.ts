import { Component, OnInit, OnDestroy, inject, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { HomeTitleService } from '@shared/components/title/services/home-title.service';
import { SearchFiltersService } from '@features/search/services/search-filters.service';
import { SearchResults } from '@features/search/components/search-results/search-results';
import { InstructionsService } from '@features/home/services/instructions.service';
import { HomeInfos } from './home-infos/home-infos';

@Component({
  selector: 'app-home',
  imports: [SearchResults, HomeInfos],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  private readonly homeTitleService = inject(HomeTitleService);
  protected readonly filters = inject(SearchFiltersService);
  protected readonly instructions = inject(InstructionsService);

  protected readonly textActive = computed(() => this.filters.query().trim().length >= 2);
  protected readonly draft = signal('');
  protected readonly focused = signal(false);

  ngOnInit(): void {
    this.homeTitleService.startSequence();
  }

  ngOnDestroy(): void {
    this.homeTitleService.stop();
  }

  protected toggleInstructions(): void {
    this.instructions.toggle();
    if (this.instructions.visible()) {
      this.draft.set('');
      this.filters.clearQuery();
    }
  }

  protected onInput(value: string): void {
    this.draft.set(value);
    if (value.trim().length === 0 && this.filters.query() !== '') {
      this.filters.clearQuery();
    }
  }

  protected submit(input: HTMLInputElement): void {
    const q = this.draft().trim();
    if (q.length < 2) return;
    this.instructions.hide();
    this.filters.query.set(q);
    this.draft.set('');
    input.blur();
  }
}
