import { Component, OnDestroy, inject, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { SearchChroniqueService } from '../../../core/services/search-chronique.service';
import { SearchConfig, SearchResult } from './search-bar.types';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnDestroy {
  
  private searchService = inject(SearchChroniqueService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  config = input<SearchConfig>({
    placeholder: 'Rechercher...',
    minLength: 2,
    maxLength: 50,
    debounceTime: 300
  });

  searchValue = signal<string>('');
  isValid = signal<boolean>(true);
  errorMessage = signal<string>('');

  onSearch = output<SearchResult>();
  onEnter = output<SearchResult>();
  onClear = output<void>();

  constructor() {
    this.setupSearchStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchStream(): void {
    this.searchSubject.pipe(
      debounceTime(this.config().debounceTime || 300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.processSearch(query);
    });
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    this.searchValue.set(value);
    this.clearError();
    
    this.searchSubject.next(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleEnterSearch();
    }
    
    if (event.key === 'Escape') {
      this.clearSearch();
    }
  }

  private processSearch(query: string): void {
    const result = this.searchService.updateSearchQuery(query);
    
    if (!result.isValid) {
      this.setError('Caractères non autorisés détectés');
      this.isValid.set(false);
      return;
    }
    
    const config = this.config();
    if (query.length > 0 && query.length < config.minLength!) {
      this.setError(`Minimum ${config.minLength} caractères requis`);
      this.isValid.set(false);
      return;
    }
    
    this.isValid.set(true);
    this.onSearch.emit(result);
  }

  private handleEnterSearch(): void {
    const query = this.searchValue();
    const result = this.searchService.executeSearch(query);
    
    if (result.isValid) {
      this.onEnter.emit(result);
    }
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.clearError();
    this.searchService.clearSearch();
    this.onClear.emit();
  }

  private setError(message: string): void {
    this.errorMessage.set(message);
  }

  private clearError(): void {
    this.errorMessage.set('');
    this.isValid.set(true);
  }

  get placeholder(): string {
    return this.config().placeholder || 'Rechercher...';
  }

  get maxLength(): number {
    return this.config().maxLength || 50;
  }

  get hasError(): boolean {
    return !!this.errorMessage();
  }

  get searchStats() {
    return this.searchService.getSearchStats();
  }
}