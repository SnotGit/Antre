import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques').then(m => m.Chroniques)
  },
  
  {
    path: 'mes-histoires/brouillon/edition/nouvelle-histoire',
    loadComponent: () => import('../components/editors/edit-new/edit-new').then(m => m.EditNew),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/brouillon/edition/:id',
    loadComponent: () => import('../components/editors/edit-draft/edit-draft').then(m => m.DraftEditor),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiée/edition/:id',
    loadComponent: () => import('../components/editors/edit-published/edit-published').then(m => m.PublishedEditor),
    canActivate: [authGuard]
  },

  {
    path: 'mes-histoires/brouillons', 
    loadComponent: () => import('../components/stories/draft-list/draft-list').then(m => m.DraftList),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiées',
    loadComponent: () => import('../components/stories/published-list/published-list').then(m => m.PublishedList),
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires',
    loadComponent: () => import('../components/stories/my-stories/my-stories').then(m => m.MyStories),
    canActivate: [authGuard]
  },

  {
    path: ':username/:titleUrl',
    loadComponent: () => import('../components/story-reader/story-reader').then(m => m.StoryReader)
  }
];