import { Routes } from '@angular/router';
import { BESTIAIRE_ROUTES } from './bestiaire/bestiaire.routes';

export const MARSBALL_ROUTES: Routes = [
  { path: 'marsball', loadComponent: () => import('./marsball.component').then(m => m.MarsballComponent) },
  { path: 'marsball/bestiaire', loadComponent: () => import('./bestiaire/bestiaire.component').then(m => m.BestiaireComponent) },
  ...BESTIAIRE_ROUTES, 
];
