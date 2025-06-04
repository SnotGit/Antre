import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../features/marsball/marsball.component').then(m => m.MarsballComponent)
  }
];