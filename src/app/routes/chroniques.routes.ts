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
    path: 'mes-histoires',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  
  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  
  {
    path: 'mes-histoires/publiées',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },

  //============ EDIT ============
  
  {
    path: 'mes-histoires/brouillons/édition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  
  {
    path: 'mes-histoires/brouillons/édition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  
  {
    path: 'mes-histoires/publiées/édition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
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