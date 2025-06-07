import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';

export interface StoryCardData {
  id: number;
  title: string;
  content?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  lastModified?: string;
  publishDate?: string;
  likes?: number;
  user?: {
    id: number;
    username: string;
    description?: string;
    avatar?: string;
  };
}

export type CardDisplayMode = 'compact' | 'detailed' | 'draft';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-card.component.html',
  styleUrl: './story-card.component.scss'
})
export class StoryCardComponent {
  
  private router = inject(Router);
  private authService = inject(AuthService);

  // ============ NOUVELLES APIs ANGULAR 19.2 ============
  
  // Inputs avec input() au lieu de @Input()
  story = input.required<StoryCardData>();
  displayMode = input<CardDisplayMode>('compact');
  showActions = input<boolean>(false);
  showAuthor = input<boolean>(true);
  clickable = input<boolean>(true);

  // Outputs avec output() au lieu de @Output()
  onCardClick = output<StoryCardData>();
  onAuthorClick = output<number>();
  onEdit = output<number>();
  onDelete = output<number>();
  onPublish = output<number>();
  onLike = output<number>();

  // ============ COMPUTED SIGNALS ============
  
  currentUser = this.authService.currentUser;
  
  isOwnStory = computed(() => {
    const user = this.currentUser();
    return user?.id === this.story().user?.id;
  });

  displayDate = computed(() => {
    const story = this.story();
    const mode = this.displayMode();
    
    if (mode === 'draft') {
      return story.lastModified || 'Récemment';
    }
    return story.publishDate || story.publishedAt || '';
  });

  statusBadge = computed(() => {
    const mode = this.displayMode();
    
    if (mode === 'draft') {
      return this.story().status || 'Brouillon';
    }
    return '';
  });

  avatarUrl = computed(() => {
    const avatar = this.story().user?.avatar;
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  hasAvatar = computed(() => !!this.story().user?.avatar);

  storyExcerpt = computed(() => {
    const story = this.story();
    const mode = this.displayMode();
    
    if (mode === 'detailed' && story.content) {
      const excerpt = story.content.substring(0, 150);
      return story.content.length > 150 ? `${excerpt}...` : excerpt;
    }
    return '';
  });

  // Template literal dans computed (Angular 19.2)
  cardTitle = computed(() => {
    const story = this.story();
    return story.title || 'Histoire sans titre';
  });

  // ============ MÉTHODES D'ÉVÉNEMENTS ============
  
  handleStoryClick(): void {
    if (this.clickable()) {
      this.onCardClick.emit(this.story());
    }
  }

  handleAuthorClick(event: Event): void {
    event.stopPropagation();
    const userId = this.story().user?.id;
    if (userId) {
      this.onAuthorClick.emit(userId);
    }
  }

  handleEditClick(event: Event): void {
    event.stopPropagation();
    this.onEdit.emit(this.story().id);
  }

  handleDeleteClick(event: Event): void {
    event.stopPropagation();
    this.onDelete.emit(this.story().id);
  }

  handlePublishClick(event: Event): void {
    event.stopPropagation();
    this.onPublish.emit(this.story().id);
  }

  handleLikeClick(event: Event): void {
    event.stopPropagation();
    this.onLike.emit(this.story().id);
  }

  // ============ MÉTHODES UTILITAIRES ============
  
  getAuthorDescription(): string {
    return this.story().user?.description || 'Écrivain martien';
  }

  getLikesCount(): number {
    return this.story().likes || 0;
  }
}