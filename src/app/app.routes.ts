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
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },

  {
    path: 'chroniques',
    children: chroniquesRoutes
  },

  {
    path: 'mon-compte',
    loadComponent: () => import('./components/chroniques/user/user-account/user-account').then(m => m.UserAccount)
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
    loadComponent: () => import('./components/utilities/not-found/not-found').then(m => m.NotFound)
  }
];