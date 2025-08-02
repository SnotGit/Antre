import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/archives.component').then(m => m.ArchivesComponent)
  }
];