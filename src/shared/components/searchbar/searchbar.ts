import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { SearchbarService, SearchResult } from '../../services/search/searchbar.service';

@Component({
  selector: 'app-searchbar',
  imports: [],
  templateUrl: './searchbar.html',
  styleUrl: './searchbar.scss'
})
export class Searchbar implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  protected readonly searchService = inject(SearchbarService);

  //======= SIGNALS =======

  searchResults = signal<SearchResult[]>([]);
  private debounceTimer: number | null = null;

  //======= COMPUTED =======

  isOverlayOpen = computed(() => this.searchService.isOverlayOpen());
  searchQuery = computed(() => this.searchService.searchQuery());
  isLoading = computed(() => this.searchService.isLoading());
  hasMinLength = computed(() => this.searchService.hasMinLength());

  hasResults = computed(() => {
    return this.hasMinLength() && this.searchResults().length > 0;
  });

  showNoResults = computed(() => {
    return this.hasMinLength() && !this.isLoading() && this.searchResults().length === 0;
  });

  //======= EFFECTS =======

  private readonly _searchEffect = effect(() => {
    const query = this.searchQuery();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (query.length >= 2) {
      this.debounceTimer = window.setTimeout(async () => {
        const results = await this.searchService.search(query);
        this.searchResults.set(results);
      }, 300);
    } else {
      this.searchResults.set([]);
    }
  });

  private readonly _keyboardEffect = effect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openOverlay();
      }

      if (e.key === 'Escape' && this.isOverlayOpen()) {
        this.closeOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  });

  //======= LIFECYCLE =======

  ngOnInit(): void {
    // Initialization if needed
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  //======= METHODS =======

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchService.setQuery(input.value);
  }

  clearSearch(): void {
    this.searchService.clearQuery();
    this.searchResults.set([]);
  }

  openOverlay(): void {
    this.searchService.openOverlay();
  }

  closeOverlay(): void {
    this.searchService.closeOverlay();
    this.searchResults.set([]);
  }

  onResultClick(result: SearchResult): void {
    this.router.navigate([result.route]);
    this.closeOverlay();
    this.clearSearch();
  }

  onOverlayBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('searchbar-overlay')) {
      this.closeOverlay();
    }
  }
}
