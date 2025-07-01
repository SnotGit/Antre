import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./../components/terraformars/terraformars').then(m => m.Terraformars)
  }
];