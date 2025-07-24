import { Routes } from '@angular/router';
import { editorResolver } from '../resolvers/editor-resolver';

//============ CHRONIQUES ROUTES ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },
  
  //============ MY STORIES ============
  
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

  //============ EDITOR ROUTES AVEC RESOLVER ============
  
  {
    path: 'edition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: editorResolver }
  },
  {
    path: 'edition/brouillon/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: editorResolver }
  },
  {
    path: 'edition/publiée/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    resolve: { data: editorResolver }
  },

  //============ STORIES PUBLIQUES ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story)
  }
];