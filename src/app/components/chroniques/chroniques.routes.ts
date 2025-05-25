// src/app/components/chroniques/chroniques.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Route principale des chroniques - affiche la liste publique
  {
    path: '',
    loadComponent: () => import('./chroniques.component').then(m => m.ChroniquesComponent)
  },

  // Story Board - Tableau de bord personnel (authentification requise)
  {
    path: 'story-board',
    loadComponent: () => import('./storyboard/story-board.component').then(m => m.StoryBoardComponent),
    // Tu peux ajouter un guard ici pour vérifier l'authentification
    // canActivate: [AuthGuard]
  },

  // Éditeur pour créer une nouvelle histoire
  {
    path: 'editor/new',
    loadComponent: () => import('./story-editor/story-editor.component').then(m => m.StoryEditorComponent),
    // canActivate: [AuthGuard]
  },

  // Éditeur pour modifier une histoire existante
  {
    path: 'editor/:id',
    loadComponent: () => import('./story-editor/story-editor.component').then(m => m.StoryEditorComponent),
    // canActivate: [AuthGuard]
  },

  // Vue détaillée d'une histoire spécifique
  {
    path: 'story/:id',
    loadComponent: () => import('./story-detail/story-detail.component').then(m => m.StoryDetailComponent)
  },

  // Liste des histoires d'un auteur spécifique
  {
    path: 'author/:username',
    loadComponent: () => import('./story-list/story-list.component').then(m => m.StoryListComponent)
  }
];