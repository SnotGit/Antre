import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/terraformars-vault/terraformars-vault').then(m => m.TerraformarsVault),
    children: [
      {
        path: '',
        loadComponent: () => import('../components/terraformars-category/terraformars-category').then(m => m.TerraformarsCategory)
      },
      {
        path: '**',
        loadComponent: () => import('../components/terraformars-category/terraformars-category').then(m => m.TerraformarsCategory)
      }
    ]
  }
];
