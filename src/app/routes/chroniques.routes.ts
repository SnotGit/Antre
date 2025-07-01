import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/chroniques/chroniques').then(m => m.Chroniques)
  },
  

  {
    path: 'story/:slug',
    loadComponent: () => import('../components/features/chroniques/pages/story-detail/story-detail').then(m => m.StoryDetail)
  }
];