import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball-vault/marsball-vault').then(m => m.MarsballVault)
  },
  {
    path: 'bestiaire',
    loadChildren: () => import('../bestiaire/routes/bestiaire.routes').then(m => m.routes)
  },
  {
    path: 'rover',
    loadChildren: () => import('../rover/routes/rover.routes').then(m => m.routes)
  },
  {
    path: '**',
    loadComponent: () => import('@shared/vault/components/vault-list/vault-list').then(m => m.VaultList)
  }
];