import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SearchService, SearchHit } from '@features/search/services/search.service';

interface ResultGroup {
  type: string;
  label: string;
  hits: SearchHit[];
}

const TYPE_ORDER = ['chronique', 'marsball', 'bestiaire', 'rover'];

const TYPE_LABELS: Record<string, string> = {
  chronique: 'Chroniques',
  marsball: 'Marsball',
  bestiaire: 'Bestiaire',
  rover: 'Rover'
};

@Component({
  selector: 'app-search-results',
  imports: [],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss'
})
export class SearchResults {

  private readonly router = inject(Router);
  protected readonly search = inject(SearchService);

  protected readonly groups = computed<ResultGroup[]>(() => {
    const hits = this.search.hits();
    return TYPE_ORDER
      .map(type => ({ type, label: TYPE_LABELS[type], hits: hits.filter(h => h.type === type) }))
      .filter(group => group.hits.length > 0);
  });

  protected isChronique(type: string): boolean {
    return type === 'chronique';
  }

  protected focusGroup(type: string): void {
    document.getElementById('group-' + type)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected open(hit: SearchHit): void {
    this.router.navigateByUrl(hit.route);
  }
}
