import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/user-account/user-account').then(m => m.UserAccount),
    canActivate: [authGuard]
  }
];