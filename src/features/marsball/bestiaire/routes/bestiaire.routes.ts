import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/bestiaire').then(m => m.Bestiaire)
  },
  {
    path: ':titleUrl',
    loadComponent: () => import('../components/bestiaire-category/bestiaire-category').then(m => m.BestiaireCategory)
  }
];