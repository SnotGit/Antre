import { Routes } from '@angular/router';
import { ChroniquesResolver } from '@shared/utilities/resolvers/chroniques-resolver';
import { authGuard } from '../../../core/guards/auth-guard';

//============ CHRONIQUES ROUTES ============

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/chroniques').then(m => m.Chroniques)
  },
  
  //============ PRIVATES ROUTES ============
  
  {
    path: 'mes-histoires/brouillon/edition/nouvelle-histoire',
    loadComponent: () => import('../components/editors/edit-new/edit-new').then(m => m.EditNew),
    resolve: { data: ChroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/brouillon/edition/:title',
    loadComponent: () => import('../components/editors/edit-draft/edit-draft').then(m => m.DraftEditor),
    resolve: { data: ChroniquesResolver },
    canActivate: [authGuard]
  },
  
  {
    path: 'mes-histoires/publiée/edition/:title',
    loadComponent: () => import('../components/editors/edit-published/edit-published').then(m => m.PublishedEditor),
    resolve: { data: ChroniquesResolver },
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

  //============ PUBLIC ROUTES ============
  
  {
    path: ':username/:title',
    loadComponent: () => import('../components/story-reader/story-reader').then(m => m.StoryReader),
    resolve: { data: ChroniquesResolver }
  },

];