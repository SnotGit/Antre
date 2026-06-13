import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/admin/admin').then(m => m.Admin)
  },
  {
    path: 'depot',
    loadComponent: () => import('../components/deposit/deposit').then(m => m.Deposit)
  }
];
