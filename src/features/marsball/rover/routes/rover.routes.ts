import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/rover').then(m => m.Rover)
  },
  {
    path: ':titleUrl',
    loadComponent: () => import('@shared/vault/components/vault-list/vault-list').then(m => m.VaultList)
  }
];
