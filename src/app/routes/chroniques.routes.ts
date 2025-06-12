import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/chroniques/chroniques.component').then(m => m.ChroniquesComponent)
  },
  {
    path: 'story-board',
    loadComponent: () => import('../components/features/chroniques/storyboard/story-board.component').then(m => m.StoryBoardComponent)
  },
  {
    path: 'story/:slug',
    loadComponent: () => import('../components/features/chroniques/pages/story-detail/story-detail.component').then(m => m.StoryDetailComponent)
  }
];