// story-board.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
  wordCount: number;
  status: 'En cours' | 'Brouillon' | 'En révision';
}

interface PublishedStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
  views: number;
  wordCount: number;
}

@Component({
  selector: 'app-story-board',
  imports: [CommonModule],
  templateUrl: './story-board.component.html',
  styleUrl: './story-board.component.scss'
})
export class StoryBoardComponent implements OnInit {
  activeTab: 'drafts' | 'published' = 'drafts';

  // Utilisation de signals pour les données
  drafts = signal<DraftStory[]>([
    {
      id: 1,
      title: "Les Dômes Perdus",
      lastModified: "Il y a 2 heures",
      wordCount: 1247,
      status: "En cours"
    },
    {
      id: 2,
      title: "Histoire sans titre",
      lastModified: "Il y a 1 jour",
      wordCount: 523,
      status: "Brouillon"
    },
    {
      id: 3,
      title: "Révolte dans les Mines",
      lastModified: "Il y a 3 jours",
      wordCount: 2156,
      status: "En révision"
    }
  ]);

  published = signal<PublishedStory[]>([
    {
      id: 4,
      title: "Tempête sur Mars",
      publishDate: "15 Jan 2025",
      likes: 23,
      views: 147,
      wordCount: 3421
    },
    {
      id: 5,
      title: "Premier Contact",
      publishDate: "08 Jan 2025",
      likes: 45,
      views: 298,
      wordCount: 2967
    },
    {
      id: 6,
      title: "Les Canaux Oubliés",
      publishDate: "28 Déc 2024",
      likes: 12,
      views: 89,
      wordCount: 1834
    }
  ]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialisation du composant
    this.loadUserStories();
  }

  setActiveTab(tab: 'drafts' | 'published'): void {
    this.activeTab = tab;
  }

  // Actions principales
  createNewStory(): void {
    console.log('Créer une nouvelle histoire');
    // Navigation vers l'éditeur
    // this.router.navigate(['/chroniques/editor/new']);
  }

  editStory(storyId: number): void {
    console.log('Éditer histoire ID:', storyId);
    // Navigation vers l'éditeur avec l'ID
    // this.router.navigate(['/chroniques/editor', storyId]);
  }

  viewStory(storyId: number): void {
    console.log('Voir histoire ID:', storyId);
    // Navigation vers la vue détail
    // this.router.navigate(['/chroniques/story', storyId]);
  }

  publishStory(storyId: number): void {
    console.log('Publier histoire ID:', storyId);
    // Logique de publication
    const currentDrafts = this.drafts();
    const draftIndex = currentDrafts.findIndex(draft => draft.id === storyId);
    
    if (draftIndex !== -1) {
      const draft = currentDrafts[draftIndex];
      
      // Créer une nouvelle histoire publiée
      const publishedStory: PublishedStory = {
        id: draft.id,
        title: draft.title,
        publishDate: new Date().toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        likes: 0,
        views: 0,
        wordCount: draft.wordCount
      };

      // Mettre à jour les signals
      const newPublished = [publishedStory, ...this.published()];
      const newDrafts = currentDrafts.filter((_, index) => index !== draftIndex);
      
      this.published.set(newPublished);
      this.drafts.set(newDrafts);

      // Optionnel: notification de succès
      this.showSuccessMessage('Histoire publiée avec succès !');
    }
  }

  deleteStory(storyId: number): void {
    console.log('Supprimer histoire ID:', storyId);
    
    // Confirmation avant suppression
    if (confirm('Êtes-vous sûr de vouloir supprimer cette histoire ? Cette action est irréversible.')) {
      // Supprimer des brouillons
      const currentDrafts = this.drafts();
      const newDrafts = currentDrafts.filter(draft => draft.id !== storyId);
      
      if (newDrafts.length !== currentDrafts.length) {
        this.drafts.set(newDrafts);
        this.showSuccessMessage('Histoire supprimée.');
      }
    }
  }

  archiveStory(storyId: number): void {
    console.log('Archiver histoire ID:', storyId);
    
    if (confirm('Archiver cette histoire ? Elle ne sera plus visible publiquement.')) {
      const currentPublished = this.published();
      const newPublished = currentPublished.filter(story => story.id !== storyId);
      
      if (newPublished.length !== currentPublished.length) {
        this.published.set(newPublished);
        this.showSuccessMessage('Histoire archivée.');
      }
    }
  }

  // Méthodes utilitaires
  private loadUserStories(): void {
    // Ici on chargerait les données depuis un service
    // this.storyService.getUserStories().subscribe(...)
    console.log('Chargement des histoires utilisateur...');
  }

  private showSuccessMessage(message: string): void {
    // Implémentation d'une notification temporaire
    console.log('✅ ' + message);
    // Ou utiliser un service de notification
  }

  // Getters pour le template
  get totalDrafts(): number {
    return this.drafts().length;
  }

  get totalPublished(): number {
    return this.published().length;
  }

  get totalLikes(): number {
    return this.published().reduce((sum, story) => sum + story.likes, 0);
  }

  get totalViews(): number {
    return this.published().reduce((sum, story) => sum + story.views, 0);
  }
}