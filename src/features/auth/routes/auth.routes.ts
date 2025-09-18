import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../components/auth').then(m => m.Auth)
  },
  {
    path: 'register', 
    loadComponent: () => import('../components/auth').then(m => m.Auth)
  }
];