import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/archives/archives.component').then(m => m.ArchivesComponent)
  }
];