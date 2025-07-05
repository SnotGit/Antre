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
    path: 'stories-details',
    loadComponent: () => import('../components/chroniques/stories/stories-details/stories-details').then(m => m.StoriesDetails)
  },

  {
    path: 'stories-details/drafts',
    loadComponent: () => import('../components/chroniques/stories/stories-details/stories-details').then(m => m.StoriesDetails)
  },

  {
    path: 'stories-details/published',
    loadComponent: () => import('../components/chroniques/stories/stories-details/stories-details').then(m => m.StoriesDetails)
  },

  {
    path: 'story/:slug',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story)
  }
];