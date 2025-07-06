import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';
import { ConfirmationDialog } from '../../../utilities/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule, ConfirmationDialog],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationDialogService);

  private typingInterval?: number;
  private autoSaveTimeout?: number;

  headerTitle = signal<string>('');
  typing = signal<boolean>(false);
  storyData = signal({ title: '', content: '' });
  storyId = signal<number | null>(null);
  originalStoryId = signal<number | null>(null);
  loading = signal<boolean>(false);
  private initialized = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.initialized()) {
        this.storyData();
        this.triggerAutoSave();
      }
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.startTyping();
    this.checkEditMode().finally(() => {
      this.initialized.set(true);
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.saveBeforeExit();
  }

  private startTyping(): void {
    const url = this.router.url;
    
    let text = 'Nouvelle Histoire';
    if (url.includes('/edition/')) {
      text = 'Modifier histoire publiée';
    } else if (url.includes('/draft/')) {
      text = 'Continuer ce brouillon';
    }
    
    let index = 0;

    this.typingInterval = window.setInterval(() => {
      if (index < text.length) {
        this.headerTitle.set(text.substring(0, index + 1));
        index++;
      } else {
        this.cleanup();
        this.typing.set(true);
      }
    }, 100);
  }

  private cleanup(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
      this.typingInterval = undefined;
    }
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = undefined;
    }
  }

  private triggerAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = window.setTimeout(() => {
      this.autoSave();
    }, 2000);
  }

  private async autoSave(): Promise<void> {
    const data = this.storyData();
    if (data.title.trim() || data.content.trim()) {
      try {
        const response = await this.privateStoriesService.saveDraft(data, this.storyId() || undefined);
        
        if (!this.storyId() && response.story?.id) {
          this.storyId.set(response.story.id);
          const newUrl = `/chroniques/draft/${response.story.id}`;
          this.router.navigate([newUrl], { replaceUrl: true });
        }
        
      } catch (error) {
        console.error('Auto-save failed');
      }
    }
  }

  private async saveBeforeExit(): Promise<void> {
    const data = this.storyData();
    if (data.title.trim() || data.content.trim()) {
      await this.autoSave();
    }
  }

  private getRouteParameter(): string | null {
    return this.route.snapshot.params['id'] || this.route.snapshot.params['slug'] || null;
  }

  private async checkEditMode(): Promise<void> {
    const routeParam = this.getRouteParameter();
    const url = this.router.url;
    
    if (!routeParam) return;

    if (url.includes('/edition/')) {
      await this.loadPublishedStoryBySlug(routeParam);
    } 
    else if (url.includes('/draft/')) {
      const storyId = parseInt(routeParam, 10);
      if (!isNaN(storyId)) {
        this.storyId.set(storyId);
        await this.loadDraftStory(storyId);
      } else {
        this.router.navigate(['/chroniques']);
      }
    } 
    else {
      const storyId = parseInt(routeParam, 10);
      if (!isNaN(storyId)) {
        this.storyId.set(storyId);
        await this.loadDraftStory(storyId);
      } else {
        this.router.navigate(['/chroniques']);
      }
    }
  }

  private async loadDraftStory(id: number): Promise<void> {
    this.loading.set(true);
    
    try {
      const story = await this.privateStoriesService.getDraftForEdit(id);
      if (story) {
        this.storyData.set({
          title: story.title,
          content: story.content
        });
      } else {
        this.router.navigate(['/chroniques/my-stories']);
      }
    } catch (error) {
      this.router.navigate(['/chroniques/my-stories']);
    }
    
    this.loading.set(false);
  }

  private async loadPublishedStoryBySlug(slug: string): Promise<void> {
    this.loading.set(true);
    
    try {
      const response = await this.privateStoriesService.getPublishedForEditBySlug(slug);
      if (response) {
        this.storyData.set({
          title: response.story.title,
          content: response.story.content
        });
        this.storyId.set(response.story.id!);
        this.originalStoryId.set(response.originalStoryId);
      } else {
        this.router.navigate(['/chroniques']);
      }
    } catch (error) {
      this.router.navigate(['/chroniques']);
    }
    
    this.loading.set(false);
  }

  async publishStory(): Promise<void> {
    const data = this.storyData();
    if (!data.title.trim() || !data.content.trim()) return;

    this.loading.set(true);
    
    try {
      const draftId = this.storyId();
      const originalId = this.originalStoryId();
      
      const response = await this.privateStoriesService.saveDraft(data, draftId || undefined);
      const finalDraftId = draftId || response.story?.id;

      if (!finalDraftId) throw new Error('Draft ID manquant');

      if (originalId) {
        await this.privateStoriesService.republishStory(finalDraftId, originalId);
      } else {
        await this.privateStoriesService.publishStory(finalDraftId);
      }

      this.router.navigate(['/chroniques']);
    } catch (error) {
      console.error('Erreur publication:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const currentStoryId = this.storyId();
    if (!currentStoryId) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Supprimer l\'histoire ?',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement cette histoire ?\n\nCette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    });
    
    if (confirmed) {
      this.loading.set(true);
      
      try {
        await this.privateStoriesService.deleteStory(currentStoryId);
        this.router.navigate(['/chroniques/my-stories']);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        this.loading.set(false);
      }
    }
  }

  async goBack(): Promise<void> {
    await this.saveBeforeExit();
    this.router.navigate(['/chroniques/my-stories']);
  }
}