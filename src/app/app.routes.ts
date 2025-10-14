import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth-guard';
import {
  authRoutes,
  chroniquesRoutes,
  marsballRoutes,
  staffRoutes,
  terraformarsRoutes,
  archivesRoutes,
  userRoutes
} from '../routes/index';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/accueil',
    pathMatch: 'full'
  },

  {
    path: "accueil",
    loadComponent: () => import('../features/home/components/home').then(m => m.Home)
  },

  {
    path: 'chroniques',
    children: chroniquesRoutes
  },

  //============ ROUTE PROTÉGÉE UTILISATEUR ============
  {
    path: 'mon-compte',
    children: userRoutes,
    canActivate: [authGuard]
  },

  //============ ROUTES PUBLIQUES ============
  {
    path: 'archives',
    children: archivesRoutes
  },

  {
    path: 'marsball',
    children: marsballRoutes
  },

  {
    path: 'terraformars',
    children: terraformarsRoutes
  },

  //============ ROUTES ADMIN ============
  {
    path: 'staff',
    children: staffRoutes,
    canActivate: [authGuard]
  },

  {
    path: 'auth',
    children: authRoutes
  },

  {
    path: '**',
    loadComponent: () => import('../features/not-found/not-found').then(m => m.NotFound)
  }
];