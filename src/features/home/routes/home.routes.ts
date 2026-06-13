import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/home').then(m => m.Home),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('../components/home-infos/home-infos').then(m => m.HomeInfos)
      },
      {
        path: 'recherche',
        loadComponent: () => import('../components/search-tree/search-tree').then(m => m.SearchTree)
      },
      {
        path: 'discuter',
        loadComponent: () => import('../components/home-elena-ai/home-elena-ai').then(m => m.HomeElenaAi)
      }
    ]
  }
];
