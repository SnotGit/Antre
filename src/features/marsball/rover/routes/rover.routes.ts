import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/rover').then(m => m.Rover)
  },
  {
    path: ':categoryId',
    loadComponent: () => import('../components/rover-category/rover-category').then(m => m.RoverCategory)
  }
];
