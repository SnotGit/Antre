import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';

interface CardData {
  id: number;
  storyTitle: string;
  storyDate: string;
}

@Component({
  selector: 'app-my-stories',
  imports: [CommonModule, FormsModule],
  templateUrl: './my-stories.html',
  styleUrl: './my-stories.scss'
})
export class MyStories implements OnInit, OnDestroy {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);
  private typingService = inject(TypingEffectService);
  private confirmationService = inject(ConfirmationDialogService);

  delete = signal(false);

  currentMode = toSignal(
    this.route.url.pipe(map(segments => {
      const lastPath = segments[segments.length - 1]?.path;
      if (lastPath === 'drafts') return 'drafts';
      if (lastPath === 'published') return 'published';
      return 'overview';
    })),
    { initialValue: 'overview' }
  );

  stats = this.privateStoriesService.stats;

  isOverviewMode = computed(() => this.currentMode() === 'overview');
  isListMode = computed(() => this.currentMode() !== 'overview');

  stories = computed((): CardData[] => {
    const mode = this.currentMode();
    if (mode === 'drafts') {
      return this.privateStoriesService.drafts().map(draft => ({
        id: draft.id,
        storyTitle: draft.title,
        storyDate: this.formatDate(draft.lastModified)
      }));
    }

    if (mode === 'published') {
      return this.privateStoriesService.published().map(storyItem => ({
        id: storyItem.id,
        storyTitle: storyItem.title,
        storyDate: this.formatDate(storyItem.lastModified)
      }));
    }

    return [];
  });

  headerText = computed(() => {
    const mode = this.currentMode();
    switch (mode) {
      case 'drafts': return 'Brouillons';
      case 'published': return 'Histoires Publiées';
      default: return 'Mes Histoires';
    }
  });

  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
  });

  headerTitle = this.typingEffect.headerTitle;
  typing = this.typingEffect.typingComplete;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.typingEffect.startTyping();
    this.privateStoriesService.initializeUserData();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  onlyCheckbox(event: Event): void {
    event.stopPropagation();
  }

  async onCardClick(story: CardData): Promise<void> {
    if (this.delete()) {
      await this.deleteStory(story);
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    if (this.currentMode() === 'drafts') {
      this.router.navigate(['/chroniques/editor', story.id]);
    } else {
      this.router.navigate(['/chroniques', currentUser.username, 'édition', story.storyTitle]);
    }
  }

  async deleteStory(story: CardData): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteStory(false);
    if (!confirmed) return;

    try {
      await this.privateStoriesService.deleteStory(story.id); 
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  goToDrafts(): void {
    this.router.navigate(['/chroniques/my-stories/drafts']);
  }

  goToPublished(): void {
    this.router.navigate(['/chroniques/my-stories/published']);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}