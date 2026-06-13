import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../features/login/components/login').then(m => m.Login)
  },

  {
    path: 'login',
    loadComponent: () => import('../features/login/components/login').then(m => m.Login)
  },

  {
    path: 'register',
    loadComponent: () => import('../features/login/components/login').then(m => m.Login)
  },

  {
    path: 'accueil',
    loadChildren: () => import('../features/home/routes/home.routes').then(m => m.routes)
  },

  {
    path: 'chroniques',
    loadChildren: () => import('../features/chroniques/routes/chroniques.routes').then(m => m.routes)
  },

  {
    path: 'mon-compte',
    loadChildren: () => import('../features/user/routes/user-routes').then(m => m.routes),
    canActivate: [authGuard]
  },

  {
    path: 'archives',
    loadChildren: () => import('../features/archives/routes/archives.routes').then(m => m.routes)
  },

  {
    path: 'marsball',
    loadChildren: () => import('../features/marsball/routes/marsball.routes').then(m => m.routes)
  },

  {
    path: 'terraformars',
    loadChildren: () => import('../features/terraformars/routes/terraformars.routes').then(m => m.routes)
  },

  {
    path: 'admin',
    loadChildren: () => import('../features/admin/routes/admin.routes').then(m => m.routes),
    canActivate: [authGuard]
  },

  {
    path: '**',
    loadComponent: () => import('../features/not-found/not-found').then(m => m.NotFound)
  }
];
