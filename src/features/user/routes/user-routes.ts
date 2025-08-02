import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stats',
    pathMatch: 'full'
  },
  {
    path: 'stats',
    loadComponent: () => import('../components/user-stats/user-stats').then(m => m.UserStats),
    canActivate: [authGuard]
  },
  {
    path: 'profile', 
    loadComponent: () => import('../components/user-profile/user-profile').then(m => m.UserProfile),
    canActivate: [authGuard]
  },
  {
    path: 'credentials',
    loadComponent: () => import('../components/user-credentials/user-credentials').then(m => m.UserCredentials),
    canActivate: [authGuard]
  }
];