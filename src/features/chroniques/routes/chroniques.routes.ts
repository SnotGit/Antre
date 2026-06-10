import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/public/story-menu/story-menu').then(m => m.StoryMenu)
  },

  {
    path: ':username/mes-chroniques',
    loadComponent: () => import('../components/private/stories-vault/stories-vault').then(m => m.StoriesVault),
    canActivate: [authGuard]
  },

  {
    path: ':username/:slug',
    loadComponent: () => import('../components/public/story-reader/story-reader').then(m => m.StoryReader)
  }
];
