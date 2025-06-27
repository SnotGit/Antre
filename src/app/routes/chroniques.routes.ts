import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/chroniques/chroniques').then(m => m.Chroniques)
  },
  {
    path: 'story-board',
    loadComponent: () => import('../components/features/chroniques/storyboard/story-board').then(m => m.StoryBoard)
  },
  {
    path: 'story/:slug',
    loadComponent: () => import('../components/features/chroniques/pages/story-detail/story-detail').then(m => m.StoryDetail)
  }
];