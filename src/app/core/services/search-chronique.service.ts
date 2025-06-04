import { Injectable, signal, computed } from '@angular/core';
import { AuthorWithLatestStory } from './chroniques.service';
import { SearchResult, SearchableItem } from '../shared/components/search-bar/search-bar.types';

@Injectable({
  providedIn: 'root'
})
export class SearchChroniqueService {
  
  private _searchQuery = signal<string>('');
  private _allAuthors = signal<AuthorWithLatestStory[]>([]);
  private _isSearching = signal<boolean>(false);

  searchQuery = this._searchQuery.asReadonly();
  isSearching = this._isSearching.asReadonly();
  
  filteredAuthors = computed(() => {
    const query = this._searchQuery().toLowerCase().trim();
    const authors = this._allAuthors();
    
    if (!query || query.length < 2) {
      return authors;
    }
    
    return authors.filter(author => 
      author.username.toLowerCase().includes(query) ||
      author.description.toLowerCase().includes(query) ||
      author.latestStory.title.toLowerCase().includes(query)
    );
  });

  hasResults = computed(() => this.filteredAuthors().length > 0);
  resultCount = computed(() => this.filteredAuthors().length);
  
  setAuthors(authors: AuthorWithLatestStory[]): void {
    this._allAuthors.set(authors);
  }

  updateSearchQuery(query: string): SearchResult {
    const sanitizedQuery = this.sanitizeQuery(query);
    const isValid = this.validateQuery(sanitizedQuery);
    
    if (isValid) {
      this._searchQuery.set(sanitizedQuery);
      this._isSearching.set(sanitizedQuery.length > 0);
    }
    
    return {
      query,
      sanitizedQuery,
      isValid
    };
  }

  clearSearch(): void {
    this._searchQuery.set('');
    this._isSearching.set(false);
  }

  executeSearch(query: string): SearchResult {
    const result = this.updateSearchQuery(query);
    
    if (result.isValid && result.sanitizedQuery.length >= 2) {
      // Recherche simple et efficace !
    }
    
    return result;
  }

  private sanitizeQuery(query: string): string {
    if (!query) return '';
    
    return query
      .trim()
      .replace(/[<>]/g, '')
      .replace(/[^\w\s\-_.àéèêëïîôùûüÿç]/gi, '')
      .substring(0, 50);
  }

  private validateQuery(query: string): boolean {
    if (!query) return true;
    
    return query.length <= 50 && 
           !/[<>]/.test(query) && 
           !/script/i.test(query) &&
           !/javascript/i.test(query);
  }

  getSearchStats() {
    return {
      totalAuthors: this._allAuthors().length,
      filteredAuthors: this.filteredAuthors().length,
      currentQuery: this._searchQuery(),
      isActive: this._isSearching()
    };
  }
}