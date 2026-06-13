import { Service } from '@angular/core';

//========== ORIGINE RECHERCHE ==========//
// Détecte si une URL de section vient de la recherche (?from=recherche&q=...).
// Permet aux breadcrumbs des sections de s'enraciner sur « Recherche » au lieu de leur section.

@Service()
export class SearchOriginService {

  parse(url: string): { q: string } | null {
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) return null;

    const params = new URLSearchParams(url.slice(queryIndex + 1));
    if (params.get('from') !== 'recherche') return null;

    return { q: params.get('q') ?? '' };
  }
}
