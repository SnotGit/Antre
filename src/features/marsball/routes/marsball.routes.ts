import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/marsball/marsball').then(m => m.MarsballComponent)
  }
];