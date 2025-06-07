export interface SearchConfig {
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  debounceTime?: number;
}

export interface SearchResult {
  query: string;
  sanitizedQuery: string;
  isValid: boolean;
}

export interface SearchableItem {
  id: number;
  searchableFields: string[];
}