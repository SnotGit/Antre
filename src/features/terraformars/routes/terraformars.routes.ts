import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../terraformars').then(m => m.Terraformars)
  }
];