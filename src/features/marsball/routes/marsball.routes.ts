import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball-vault/marsball-vault').then(m => m.MarsballVault),
    children: [
      {
        path: '',
        loadComponent: () => import('../components/marsball-home/marsball-home').then(m => m.MarsballHome)
      },
      {
        path: 'bestiaire',
        loadComponent: () => import('../components/bestiaire/bestiaire').then(m => m.Bestiaire)
      },
      {
        path: 'bestiaire/:titleUrl',
        loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
      },
      {
        path: 'rover',
        loadComponent: () => import('../components/rover/rover').then(m => m.Rover)
      },
      {
        path: 'rover/:titleUrl',
        loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
      },
      {
        path: '**',
        loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
      }
    ]
  }
];
