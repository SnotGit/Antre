import { Routes } from '@angular/router';

export const routes: Routes = [
  // Route par défaut - redirection vers accueil
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },

  // Routes principales de l'application
  {
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },

  // Routes des Chroniques de Mars
  {
    path: 'chroniques',
    loadChildren: () => import('./components/chroniques/chroniques.routes').then(m => m.routes)
  },

  // Route Mon Compte (authentification requise)
  {
    path: 'mon-compte',
    loadComponent: () => import('./components/user-account/user-account.component').then(m => m.UserAccountComponent)
  },

  // Autres sections de l'app
  {
    path: 'archives',
    loadComponent: () => import('./components/archives/archives.component').then(m => m.ArchivesComponent)
  },
  {
    path: 'marsball',
    loadComponent: () => import('./components/marsball/marsball.component').then(m => m.MarsballComponent)
  },
  {
    path: 'terraformars',
    loadComponent: () => import('./components/terraformars/terraformars.component').then(m => m.TerraformarsComponent)
  },

  // Routes d'authentification
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.routes)
  },

  // Route 404 - Page non trouvée
  {
    path: '**',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];