import { Routes } from '@angular/core';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../components/auth/auth').then(m => m.Auth)
  },
  {
    path: 'register', 
    loadComponent: () => import('../components/auth/auth').then(m => m.Auth)
  },
  // Redirection par défaut vers login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];