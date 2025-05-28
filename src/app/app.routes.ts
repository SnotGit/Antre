import { Routes } from '@angular/router';
import { 
  authRoutes, 
  chroniquesRoutes, 
  marsballRoutes, 
  staffRoutes, 
  terraformarsRoutes,
  archivesRoutes 
} from './routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },

  {
    path: 'chroniques',
    children: chroniquesRoutes
  },

  {
    path: 'mon-compte',
    loadComponent: () => import('./components/user-account/user-account.component').then(m => m.UserAccountComponent)
  },

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

  {
    path: 'staff',
    children: staffRoutes
  },

  {
    path: 'auth',
    children: authRoutes
  },

  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];