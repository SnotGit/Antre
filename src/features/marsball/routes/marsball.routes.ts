import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball').then(m => m.Marsball)
  },
  {
    path: ':categoryId',
    loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
  }
];