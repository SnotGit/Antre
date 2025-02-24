import { Routes } from '@angular/router';

export const BESTIAIRE_ROUTES: Routes = [
  { path: 'marsball/bestiaire/list', loadComponent: () => import('./list/list.component').then(m => m.ListComponent) },
  { path: 'marsball/bestiaire/add', loadComponent: () => import('./add/add.component').then(m => m.AddComponent) },
  { path: 'marsball/bestiaire/edit/:id', loadComponent: () => import('./edit/edit.component').then(m => m.EditComponent) },
  { path: 'marsball/bestiaire/details/:id', loadComponent: () => import('./details/details.component').then(m => m.DetailsComponent) },
];
