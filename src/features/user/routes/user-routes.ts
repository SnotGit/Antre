import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/user-account/user-account').then(m => m.UserAccount),
    canActivate: [authGuard]
  },
  {
    path: 'mes-likes',
    loadComponent: () => import('../components/my-likes/my-likes').then(m => m.MyLikes),
    canActivate: [authGuard]
  },
  {
    path: 'mes-likes/recus',
    loadComponent: () => import('../components/liked-stories/liked-stories').then(m => m.LikedStories),
    canActivate: [authGuard],
    data: { mode: 'received' }
  },
  {
    path: 'mes-likes/postes',
    loadComponent: () => import('../components/liked-stories/liked-stories').then(m => m.LikedStories),
    canActivate: [authGuard],
    data: { mode: 'posted' }
  }
];