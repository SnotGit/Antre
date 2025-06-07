import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/terraformars/terraformars.component').then(m => m.TerraformarsComponent)
  }
];