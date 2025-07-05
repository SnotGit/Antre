import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },

  {
    path: 'editor',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },

  {
    path: 'editor/:id',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },

  {
    path: 'my-stories',
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },

  {
    path: 'my-stories/drafts',
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },

  {
    path: 'my-stories/published',
    loadComponent: () => import('../components/chroniques/stories/my-stories/my-stories').then(m => m.MyStories)
  },

  {
    path: 'story/:slug',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story)
  }
];