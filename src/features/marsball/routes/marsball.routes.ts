import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball').then(m => m.MarsballComponent)
  },
  {
    path: ':categoryId',
    loadComponent: () => import('../components/category/category').then(m => m.CategoryComponent)
  },
  {
    path: ':categoryId/:listId',
    loadComponent: () => import('../components/list/list').then(m => m.ListComponent)
  },
  {
    path: ':categoryId/:listId/:itemId',
    loadComponent: () => import('../components/item-detail/item-detail').then(m => m.ItemDetailComponent)
  }
];