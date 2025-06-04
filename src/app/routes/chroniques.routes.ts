import { Routes } from '@angular/router';

export const routes: Routes = [
  // Route principale des chroniques - affiche la liste publique
  {
    path: '',
    loadComponent: () => import('../features/chroniques/chroniques.component').then(m => m.ChroniquesComponent)
  },

  // Story Board - Tableau de bord personnel (authentification requise)
  {
    path: 'story-board',
    loadComponent: () => import('../features/chroniques/storyboard/story-board.component').then(m => m.StoryBoardComponent),
    // Ajouter un guard ici pour vérifier l'authentification
    // canActivate: [AuthGuard]
  },

  // Éditeur pour créer une nouvelle histoire
  

  // Éditeur pour modifier une histoire existante
  

  // Lire une histoire 
  {
    path: 'story/:id',
    loadComponent: () => import('../features/chroniques/pages/story-detail/story-detail.component').then(m => m.StoryDetailComponent)
  },

  // Liste des histoires d'un auteur 
  
];