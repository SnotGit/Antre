// src/app/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../auth').then(m => m.Auth)
  },
  {
    path: 'register', 
    loadComponent: () => import('../auth').then(m => m.Auth)
  },
  // Redirection par défaut vers login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];