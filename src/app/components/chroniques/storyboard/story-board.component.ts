// story-board.component.ts - Version signals purs Angular 19.2
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoryboardService } from '../../../services/storyboard.service';

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

  // Signal pour l'onglet actif
  activeTab = signal<'drafts' | 'published'>('drafts');

  // Signals depuis les services (lecture directe)
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  
  // Signals depuis StoryboardService
  loading = this.storyboardService.loading;
  error = this.storyboardService.error;
  rawDrafts = this.storyboardService.drafts;
  rawPublished = this.storyboardService.published;

  // Computed signals pour formater les données
  drafts = computed(() => 
    this.rawDrafts().map(this.formatDraft)
  );

  published = computed(() => 
    this.rawPublished().map(this.formatPublished)
  );

  // Signal pour les likes (local au composant)
  likedStories = signal<Set<number>>(new Set());

  // Computed signals pour les statistiques
  hasStories = computed(() => 
    this.drafts().length > 0 || this.published().length > 0
  );

  userName = computed(() => 
    this.currentUser()?.username || 'Utilisateur'
  );

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    console.log('Story Board - Chargement pour:', this.currentUser()?.username);
    
    // Charger les données initiales
    this.loadInitialData();
  }

  setActiveTab(tab: 'drafts' | 'published'): void {
    this.activeTab.set(tab);
  }

  // Charger les données initiales
  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([
        this.storyboardService.loadDraftsData(),
        this.storyboardService.loadPublishedData()
      ]);
    } catch (error) {
      console.error('Erreur chargement initial:', error);
    }
  }

  // Formatage des données API pour l'affichage
  private formatDraft = (draft: any): DraftStory => ({
    id: draft.id,
    title: draft.title || 'Histoire sans titre',
    lastModified: draft.lastModified,
    status: draft.status
  });

  private formatPublished = (story: any): PublishedStory => ({
    id: story.id,
    title: story.title,
    publishDate: story.publishDate,
    likes: story.likes
  });

  // Actions utilisateur
  selectStory(storyId: number): void {
    console.log('Histoire sélectionnée:', storyId);
  }

  async toggleLike(storyId: number, event: Event): Promise<void> {
    event.stopPropagation();
    
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const currentLikes = new Set(this.likedStories());
    
    // Si déjà liké, ne rien faire
    if (currentLikes.has(storyId)) {
      console.log('Histoire déjà likée');
      return;
    }

    // Optimistic update
    currentLikes.add(storyId);
    this.likedStories.set(currentLikes);
    
    try {
      await this.storyboardService.toggleLike(storyId);
      console.log('Like persisté en base');
    } catch (error) {
      // Rollback en cas d'erreur
      currentLikes.delete(storyId);
      this.likedStories.set(currentLikes);
      console.error('Erreur toggle like:', error);
    }
  }

  isStoryLiked(storyId: number): boolean {
    return this.likedStories().has(storyId);
  }

  createNewStory(): void {
    this.router.navigate(['/chroniques/editor/new']);
  }

  // Actions CRUD (pour le futur)
  async publishStory(storyId: number): Promise<void> {
    try {
      await this.storyboardService.publishStory(storyId);
      console.log('Histoire publiée avec succès');
    } catch (error) {
      console.error('Erreur publication:', error);
    }
  }

  async deleteStory(storyId: number): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette histoire ?')) {
      try {
        await this.storyboardService.deleteStory(storyId);
        console.log('Histoire supprimée avec succès');
      } catch (error) {
        console.error('Erreur suppression:', error);
      }
    }
  }

  async archiveStory(storyId: number): Promise<void> {
    try {
      await this.storyboardService.archiveStory(storyId);
      console.log('Histoire archivée avec succès');
    } catch (error) {
      console.error('Erreur archivage:', error);
    }
  }
}