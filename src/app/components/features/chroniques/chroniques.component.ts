import { Component, OnInit, OnDestroy, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChroniquesService } from '../../../core/services/chroniques.service';
import { SearchChroniqueService } from '../../../core/services/search-chronique.service';
import { TypingEffectService } from '../../../core/services/typing-effect.service';
import { StoryCardComponent } from './shared/story-card/story-card.component';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { SearchResult } from '../../shared/search-bar/search-bar.types';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCardComponent, SearchBarComponent],
  templateUrl: './chroniques.component.html',
  styleUrl: './chroniques.component.scss'
})
export class ChroniquesComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private chroniquesService = inject(ChroniquesService);
  private searchService = inject(SearchChroniqueService);
  private typingService = inject(TypingEffectService);

  recentAuthors = this.chroniquesService.recentAuthors;
  loading = this.chroniquesService.loading;

  filteredAuthors = this.searchService.filteredAuthors;
  isSearching = this.searchService.isSearching;

  displayedAuthors = computed(() => {
    return this.isSearching() ? this.filteredAuthors() : this.recentAuthors();
  });

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
    speed: 150,
    cursorColor: 'default',
    finalBlinks: 3
  });

  displayedTitle = this.typingEffect.displayedTitle;
  typingComplete = this.typingEffect.isComplete;
  showCursor = this.typingEffect.showCursor;

  ngOnInit(): void {
    this.typingEffect.startTyping();
    this.loadAuthors();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  private loadAuthors(): void {
  this.chroniquesService.loadRecentAuthors();

  effect(() => {
    const authors = this.recentAuthors();
    this.searchService.setAuthors(authors);
  });
}

  onSearch(result: SearchResult): void {
    // La recherche est automatiquement gérée par le service
  }

  onSearchEnter(result: SearchResult): void {
    // Action spéciale sur Entrée si nécessaire
  }

  onSearchClear(): void {
    // Retour à la liste complète
  }

  navigateToStory(storyId: number): void {
    this.router.navigate(['/chroniques/story', storyId]);
  }

  refreshAuthors(): void {
    this.chroniquesService.refresh();
  }
}