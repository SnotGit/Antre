import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques').then(m => m.Chroniques)
  },
  
  {
    path: ':username/mes-histoires',
    loadComponent: () => import('../components/stories/my-stories/my-stories').then(m => m.MyStories),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/mes-histoires/brouillons',
    loadComponent: () => import('../components/stories/draft-list/draft-list').then(m => m.DraftList),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/mes-histoires/publiees',
    loadComponent: () => import('../components/stories/published-list/published-list').then(m => m.PublishedList),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/edition/nouvelle-histoire',
    loadComponent: () => import('../components/editors/edit-new/edit-new').then(m => m.EditNew),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/edition/publiee/:titleUrl',
    loadComponent: () => import('../components/editors/edit-published/edit-published').then(m => m.PublishedEditor),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/edition/:titleUrl',
    loadComponent: () => import('../components/editors/edit-draft/edit-draft').then(m => m.DraftEditor),
    canActivate: [authGuard]
  },
  
  {
    path: ':username/:titleUrl',
    loadComponent: () => import('../components/story-reader/story-reader').then(m => m.StoryReader)
  }
];