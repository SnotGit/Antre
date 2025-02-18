import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from "./tools/page-not-found/page-not-found.component"

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'archive', loadChildren: () => import('./archives/archives.routes').then(m => m.ARCHIVES_ROUTES) },
    { path: 'marsball', loadChildren: () => import('./marsball/marsball.routes').then(m => m.MARSBALL_ROUTES) },
    { path: 'bunker', loadChildren: () => import('./bunker/bunker.routes').then(m => m.BUNKER_ROUTES) },
    { path: 'staff', loadChildren: () => import('./staff/staff.routes').then(m => m.STAFF_ROUTES) },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: '**', component: PageNotFoundComponent }
  ];