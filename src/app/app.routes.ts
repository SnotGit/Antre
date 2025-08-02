import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth-guard';
import { 
  authRoutes, 
  chroniquesRoutes, 
  marsballRoutes, 
  staffRoutes, 
  terraformarsRoutes,
  archivesRoutes 
} from '../routes/index';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    loadComponent: () => import('../features/home/components/home').then(m => m.Home)
  },

  {
    path: 'chroniques',
    children: chroniquesRoutes
  },

  //============ ROUTE PROTÉGÉE UTILISATEUR ============
  {
    path: 'mon-compte',
    loadComponent: () => import('../features/user/components/user-account/user-account').then(m => m.UserAccount),
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
    loadComponent: () => import('../shared/utilities/not-found/not-found').then(m => m.NotFound)
  }
];