import { Routes } from '@angular/router';
import { authGuard } from './components/utilities/auth-guard/auth-guard';
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

  //============ ROUTE PROTÉGÉE UTILISATEUR ============
  {
    path: 'mon-compte',
    loadComponent: () => import('./components/chroniques/user/user-account/user-account').then(m => m.UserAccount),
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
    canActivate: [authGuard]  // ← Protège toute la section staff
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