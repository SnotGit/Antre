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
    path: 'stories',
    loadComponent: () => import('../components/chroniques/stories/stories/stories').then(m => m.Stories)
  },

  {
    path: 'stories/drafts',
    loadComponent: () => import('../components/chroniques/stories/stories/stories').then(m => m.Stories)
  },

  {
    path: 'stories/published',
    loadComponent: () => import('../components/chroniques/stories/stories/stories').then(m => m.Stories)
  },

  {
    path: 'story/:slug',
    loadComponent: () => import('../components/chroniques/stories/story-detail/story-detail').then(m => m.StoryDetail)
  }
];