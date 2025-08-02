import { Routes } from '@angular/router';
import { chroniquesResolver } from '../../../shared/utilities/resolvers/chroniques-resolver';
import { authGuard } from '../../../core/guards/auth-guard';
//============ CHRONIQUES ROUTES ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques').then(m => m.Chroniques)
  },
  
  //============ PRIVATES ROUTES ============
  
  {
    path: 'mes-histoires/brouillon/edition/nouvelle-histoire',
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/brouillon/edition/:title',
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiée/edition/:title',
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },

  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiées',
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires',
    loadComponent: () => import('../components/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },

  //============ PUBLIC ROUTES ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/story/story').then(m => m.Story),
    resolve: { data: chroniquesResolver }
  },

];