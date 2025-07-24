import { Routes } from '@angular/router';

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

  //============ EDITOR ROUTES ============
  
  {
    path: 'edition/nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    data: { mode: 'NewStory' }
  },
  {
    path: 'edition/brouillon/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    data: { mode: 'EditDraft' }
  },
  {
    path: 'edition/publiée/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor),
    data: { mode: 'EditPublished' }
  },

  //============ STORIES PUBLIQUES ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story)
  }
];