import { Routes } from '@angular/router';
import HomeComponent from './home/home.component';
import { MARSBALL_ROUTES } from './marsball/marsball.routes';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' }, // Redirection par défaut
  { path: 'archive', loadComponent: () => import('./archives/archives.component') },
  ...MARSBALL_ROUTES, //Routes de marsball
  { path: 'bunker', loadComponent: () => import('./bunker/bunker.component') },
  { path: 'staff', loadComponent: () => import('./staff/staff.component') },
  { path: '**', loadComponent: () => import('./tools/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent) },
];
