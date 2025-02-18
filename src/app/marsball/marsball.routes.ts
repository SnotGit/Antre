import { Routes } from '@angular/router';
import { MarsballComponent } from './marsball.component';
import { BestiaireComponent } from './bestiaire/bestiaire.component';
import { RoverComponent } from './rover/rover.component';

export const MARSBALL_ROUTES: Routes = [
  {
    path: '',
    component: MarsballComponent,
    children: [
      { path: 'bestiaire', loadChildren: () => import('./bestiaire/bestiaire.routes').then(m => m.BESTIAIRE_ROUTES) },
      { path: 'rover', component: RoverComponent },
    ],
  },
];