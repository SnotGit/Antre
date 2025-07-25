import { Routes } from '@angular/router';
import { chroniquesResolver } from '../resolvers/chroniques-resolver';

//============ CHRONIQUES ROUTES ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },
  
  //============ MY STORIES (AVANT :username) ============
  
  {
    path: 'mes-histoires',
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },
  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },
  {
    path: 'mes-histoires/publiées',
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },

  //============ EDITOR (AVANT :username) ============
  
  {
    path: 'edition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  {
    path: 'edition/brouillon/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  {
    path: 'edition/publiée/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },
  {
    path: 'editor/:id',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: chroniquesResolver }
  },



  //============ PUBLIC STORIES (EN DERNIER) ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story),
    resolve: { data: chroniquesResolver }
  },



  //============ USER PROFILE (APRÈS routes spécifiques) ============
  
  {
    path: ':username',
    loadComponent: () => import('../components/chroniques/user/user-profile/user-profile').then(m => m.AuthorProfileComponent),
    resolve: { data: chroniquesResolver }
  },

  ];