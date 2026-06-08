import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/public/story-menu/story-menu').then(m => m.StoryMenu)
  },

  {
    path: ':username/mes-chroniques',
    loadComponent: () => import('../components/mes-chroniques/mes-chroniques').then(m => m.MesChroniques),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'brouillons', pathMatch: 'full' },
      {
        path: 'brouillons',
        data: { mode: 'draft' },
        loadComponent: () => import('../components/private/stories-manager/stories-manager').then(m => m.StoriesManager)
      },
      {
        path: 'publiees',
        data: { mode: 'published' },
        loadComponent: () => import('../components/private/stories-manager/stories-manager').then(m => m.StoriesManager)
      },
      {
        path: 'likes',
        loadComponent: () => import('../components/liked-stories/liked-stories').then(m => m.LikedStories)
      }
    ]
  },

  {
    path: ':username/:slug',
    loadComponent: () => import('../components/public/story-reader/story-reader').then(m => m.StoryReader)
  }
];
