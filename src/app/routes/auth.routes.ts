// src/app/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../components/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'register', 
    loadComponent: () => import('../components/auth/auth.component').then(m => m.AuthComponent)
  },
  // Redirection par défaut vers login
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];