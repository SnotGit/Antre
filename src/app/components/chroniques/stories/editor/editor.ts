import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private privateStoriesService = inject(PrivateStoriesService);
  private authService = inject(AuthService);

  private typingInterval?: number;
  private autoSaveTimeout?: number;

  //============ SIGNALS ============

  headerTitle = signal<string>('');
  typing = signal<boolean>(false);
  storyData = signal({ title: '', content: '' });
  storyId = signal<number | null>(null);
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

  //============ TYPING EFFECT ============

  private startTyping(): void {
    const id = this.route.snapshot.params['id'];
    const isEditMode = id && !isNaN(parseInt(id));
    const text = isEditMode ? 'Continuer mon histoire' : 'Nouvelle Histoire';
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

  //============ AUTO-SAVE ============

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
        await this.privateStoriesService.saveDraft(data, this.storyId() || undefined);
        
        // Si nouveau draft, recharger pour obtenir l'ID
        if (!this.storyId()) {
          await this.privateStoriesService.loadDrafts();
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

  //============ EDIT MODE ============

  private async checkEditMode(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    if (id) {
      const storyId = parseInt(id);
      if (!isNaN(storyId)) {
        this.storyId.set(storyId);
        await this.loadStory(storyId);
      }
    }
  }

  private async loadStory(id: number): Promise<void> {
    this.loading.set(true);
    
    const story = await this.privateStoriesService.getDraftForEdit(id);
    if (story) {
      this.storyData.set({
        title: story.title,
        content: story.content
      });
    }
    
    this.loading.set(false);
  }

  //============ ACTIONS ============

  async publishStory(): Promise<void> {
    const data = this.storyData();
    if (!data.title.trim() || !data.content.trim()) return;

    this.loading.set(true);
    
    const response = await this.privateStoriesService.saveDraft(data, this.storyId() || undefined);
    
    const storyId = this.storyId() || response.story?.id;
    if (storyId) {
      await this.privateStoriesService.publishStory(storyId);
      this.router.navigate(['/chroniques']);
    }
    
    this.loading.set(false);
  }

  async goBack(): Promise<void> {
    await this.saveBeforeExit();
    this.router.navigate(['/chroniques']);
  }
}