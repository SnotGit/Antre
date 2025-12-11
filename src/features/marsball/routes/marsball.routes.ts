import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball').then(m => m.Marsball)
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
    path: ':categoryId',
    loadComponent: () => import('../components/marsball-category/marsball-category').then(m => m.MarsballCategory)
  }
];