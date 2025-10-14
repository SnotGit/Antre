import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball').then(m => m.Marsball)
  },
  {
    path: 'admin/nouvelle-categorie',
    loadComponent: () => import('../components/admin/new-category/new-category').then(m => m.NewCategory),
    canActivate: [authGuard]
  },
  {
    path: 'admin/nouvel-item',
    loadComponent: () => import('../components/admin/new-item/new-item').then(m => m.NewItem),
    canActivate: [authGuard]
  },
  {
    path: ':categoryId',
    loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
  }
];