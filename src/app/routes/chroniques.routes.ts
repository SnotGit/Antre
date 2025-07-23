import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques/chroniques').then(m => m.Chroniques)
  },
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
  {
    path: 'nouvelle-histoire',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  {
    path: ':username/édition/:title',
    loadComponent: () => import('../components/chroniques/stories/editor/editor').then(m => m.Editor)
  },
  {
    path: ':username/:title',
    loadComponent: () => import('../components/chroniques/stories/story/story').then(m => m.Story)
  }
];
