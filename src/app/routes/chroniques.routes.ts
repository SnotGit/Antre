import { Routes } from '@angular/router';
import { chroniquesResolver } from '../resolvers/chroniques-resolver';

//============ CHRONIQUES ROUTES ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },
  
  //============ MY STORIES ============
  
  {
    path: 'mes-histoires/brouillon/edition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  
  {
    path: 'mes-histoires/brouillon/edition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  
  {
    path: 'mes-histoires/publiee/edition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },

  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  
  {
    path: 'mes-histoires/publiees',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  
  {
    path: 'mes-histoires',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },

  //============ PUBLIC ROUTES ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story),
    resolve: { data: chroniquesResolver }
  },

  {
    path: ':username',
    loadComponent: () => import('../components/chroniques/user/user-profile/user-profile').then(m => m.AuthorProfileComponent),
    resolve: { data: chroniquesResolver }
  }
];