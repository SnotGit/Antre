import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../components/features/staff/staff.component').then(m => m.StaffComponent)
  }
];