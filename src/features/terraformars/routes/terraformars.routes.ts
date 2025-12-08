import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/terraformars').then(m => m.Terraformars)
  }
];