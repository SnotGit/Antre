import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/bestiaire').then(m => m.Bestiaire)
  },
  {
    path: ':titleUrl',
    loadComponent: () => import('@shared/vault/components/vault-list/vault-list').then(m => m.VaultList)
  }
];