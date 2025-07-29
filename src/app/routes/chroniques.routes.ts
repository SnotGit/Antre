import { Routes } from '@angular/router';
import { chroniquesResolver } from '../resolvers/chroniques-resolver';
import { authGuard } from '../components/utilities/auth-guard/auth-guard';
//============ CHRONIQUES ROUTES (ARCHITECTURE ACTUELLE) ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },
  
  //============ ROUTES PRIVÉES (avec authGuard) ============
  
  {
    path: 'mes-histoires/brouillon/edition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/brouillon/edition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiée/edition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver },
    canActivate: [authGuard]
  },

  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiées',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    canActivate: [authGuard]
  },

  //============ ROUTES PUBLIQUES (sans guard) ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story),
    resolve: { data: chroniquesResolver }
  },

];