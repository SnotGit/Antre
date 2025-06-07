// story-board.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StoryboardService } from '../../../../core/services/storyboard.service';

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
export class StoryBoardComponent implements OnInit, OnDestroy {
  
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

  // Effect pour détecter les changements d'utilisateur
  private userChangeEffect = effect(() => {
    this.authService.userChanged();
    const user = this.currentUser();
    
    if (user) {
      this.loadUserData();
    } else {
      this.likedStories.set(new Set());
    }
  });

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Charger les données initiales
    this.loadUserData();
  }

  ngOnDestroy(): void {
    // L'effect se nettoie automatiquement
  }

  setActiveTab(tab: 'drafts' | 'published'): void {
    this.activeTab.set(tab);
  }

  // Charger les données utilisateur (méthode privée)
  private async loadUserData(): Promise<void> {
    try {
      await this.storyboardService.initializeUserData();
    } catch (error) {
      // Gestion d'erreur silencieuse
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
    // TODO: Sélection gérée par le console-panel
    // La navigation sera faite via les boutons du console-panel
  }

  // Vérifier si c'est sa propre histoire (toujours vrai dans story-board)
  isOwnStory(storyId: number): boolean {
    // Dans le story-board, toutes les histoires appartiennent à l'utilisateur connecté
    return true;
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
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
  }

  async deleteStory(storyId: number): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette histoire ?')) {
      try {
        await this.storyboardService.deleteStory(storyId);
      } catch (error) {
        // Gestion d'erreur silencieuse
      }
    }
  }

  async archiveStory(storyId: number): Promise<void> {
    try {
      await this.storyboardService.archiveStory(storyId);
    } catch (error) {
      // Gestion d'erreur silencieuse
    }
  }
}