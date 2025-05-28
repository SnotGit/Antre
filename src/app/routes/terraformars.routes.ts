import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/terraformars/terraformars.component').then(m => m.TerraformarsComponent)
  }
];