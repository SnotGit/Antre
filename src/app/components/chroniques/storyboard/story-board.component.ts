// story-board.component.ts - Version professionnelle avec API réelle
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoryboardService, DraftStoryFromAPI, PublishedStoryFromAPI } from '../../../services/storyboard.service';

// Interfaces pour l'affichage
interface DraftStory {
  id: number;
  title: string;
  lastModified: string;
  status: string;
}

interface PublishedStory {
  id: number;
  title: string;
  publishDate: string;
  likes: number;
}

@Component({
  selector: 'app-story-board',
  imports: [CommonModule],
  templateUrl: './story-board.component.html',
  styleUrl: './story-board.component.scss'
})
export class StoryBoardComponent implements OnInit {
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private storyboardService = inject(StoryboardService);

  activeTab: 'drafts' | 'published' = 'drafts';

  // Signals pour les données
  drafts = signal<DraftStory[]>([]);
  published = signal<PublishedStory[]>([]);
  loading = this.storyboardService.loading;
  error = this.storyboardService.error;
  likedStories = signal<Set<number>>(new Set());

  // Signals depuis AuthService
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('Story Board - Chargement pour:', this.currentUser()?.username);
    this.loadUserData();
  }

  setActiveTab(tab: 'drafts' | 'published'): void {
    this.activeTab = tab;
  }

  // Charger les données utilisateur depuis l'API
  private loadUserData(): void {
    this.loadDrafts();
    this.loadPublishedStories();
  }

  private loadDrafts(): void {
    this.storyboardService.loadUserDrafts().subscribe({
      next: (response) => {
        const formattedDrafts = response.drafts?.map(this.formatDraft) || [];
        this.drafts.set(formattedDrafts);
      },
      error: (error) => {
        console.error('Erreur chargement brouillons:', error);
        this.drafts.set([]);
      }
    });
  }

  private loadPublishedStories(): void {
    this.storyboardService.loadUserPublishedStories().subscribe({
      next: (response) => {
        const formattedStories = response.stories?.map(this.formatPublished) || [];
        this.published.set(formattedStories);
      },
      error: (error) => {
        console.error('Erreur chargement histoires publiées:', error);
        this.published.set([]);
      }
    });
  }

  // Formatage des données API pour l'affichage
  private formatDraft(draft: DraftStoryFromAPI): DraftStory {
    return {
      id: draft.id,
      title: draft.title || 'Histoire sans titre',
      lastModified: draft.lastModified,
      status: draft.status
    };
  }

  private formatPublished(story: PublishedStoryFromAPI): PublishedStory {
    return {
      id: story.id,
      title: story.title,
      publishDate: story.publishDate,
      likes: story.likes
    };
  }

  // Sélection d'histoire pour actions console panel
  selectStory(storyId: number): void {
    console.log('Histoire sélectionnée:', storyId);
  }

  // Système de likes via API
  toggleLike(storyId: number, event: Event): void {
    event.stopPropagation();
    
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const currentLikes = new Set(this.likedStories());
    
    // Si déjà liké, ne rien faire (pas de remove)
    if (currentLikes.has(storyId)) {
      console.log('Histoire déjà likée, pas de modification possible');
      return;
    }

    // Seulement LIKE (une seule fois)
    currentLikes.add(storyId);
    this.updateLikeCount(storyId, 1);
    this.likedStories.set(currentLikes);
    
    console.log('Like histoire:', storyId);
    
    // Appel API pour persister
    this.storyboardService.toggleLike(storyId).subscribe({
      next: () => {
        console.log('Like mis à jour en base');
      },
      error: (error) => {
        console.error('Erreur toggle like:', error);
        // Rollback en cas d'erreur
        currentLikes.delete(storyId);
        this.likedStories.set(currentLikes);
        this.updateLikeCount(storyId, -1);
      }
    });
  }

  private updateLikeCount(storyId: number, increment: number): void {
    const published = [...this.published()];
    const storyIndex = published.findIndex(s => s.id === storyId);
    if (storyIndex !== -1) {
      published[storyIndex].likes = Math.max(0, published[storyIndex].likes + increment);
      this.published.set(published);
    }
  }

  isStoryLiked(storyId: number): boolean {
    return this.likedStories().has(storyId);
  }

  createNewStory(): void {
    this.router.navigate(['/chroniques/editor/new']);
  }

  // Getters pour le template
  get hasStories(): boolean {
    return this.drafts().length > 0 || this.published().length > 0;
  }

  get userName(): string {
    return this.currentUser()?.username || 'Utilisateur';
  }
}