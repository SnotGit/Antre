import { Component, OnInit, OnDestroy, inject, signal, computed, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';

interface StoryFormData {
  title: string;
  content: string;
}

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
  private typingService = inject(TypingEffectService);
  
  private isPublishedEdit = signal<boolean>(false);
  private originalStoryId = signal<number | null>(null);
  
  storyForm = signal<StoryFormData>({ title: '', content: '' });
  saving = signal<boolean>(false);
  
  storySlug = toSignal(
    this.route.params.pipe(map(params => params['slug'] || null)),
    { initialValue: null }
  );
  
  storyResource = resource({
    loader: async () => {
      const slug = this.storySlug();
      if (!slug) return { title: '', content: '' };
      
      const response = await this.privateStoriesService.getStoryForEditBySlug(slug);
      if (response) {
        this.originalStoryId.set(response.originalStoryId || null);
        this.isPublishedEdit.set(!!response.originalStoryId);
        return {
          title: response.story.title,
          content: response.story.content
        };
      }
      throw new Error('Histoire non trouvée');
    }
  });
  
  headerText = computed(() => {
    if (this.isPublishedEdit()) return 'Modifier Histoire';
    if (this.storySlug()) return 'Continuer Histoire';
    return 'Nouvelle Histoire';
  });
  
  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;
  
  isLoading = computed(() => this.storyResource.isLoading());
  hasError = computed(() => !!this.storyResource.error());
  
  private formUpdateEffect = effect(() => {
    const resourceValue = this.storyResource.value();
    const isLoading = this.isLoading();
    const hasError = this.hasError();
    
    if (!isLoading && !hasError && resourceValue) {
      this.storyForm.set({
        title: resourceValue.title || '',
        content: resourceValue.content || ''
      });
    }
  });
  
  private autoSaveEffect = effect(() => {
    const form = this.storyForm();
    if (form.title.trim() || form.content.trim()) {
      this.scheduleAutoSave();
    }
  });

  private autoSaveTimeout?: number;
  
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
    this.saveBeforeExit();
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
  }
  
  private scheduleAutoSave(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = window.setTimeout(() => {
      this.autoSave();
    }, 2000);
  }

  private async autoSave(): Promise<void> {
    const form = this.storyForm();
    if (!form.title.trim() && !form.content.trim()) return;

    try {
      const slug = this.storySlug();
      const response = await this.privateStoriesService.saveDraftBySlug(
        form, 
        slug || undefined
      );
      
      if (!slug && response.story?.slug) {
        this.router.navigate(['/editor', response.story.slug], { 
          replaceUrl: true 
        });
      }
    } catch (error) {
      
    }
  }
  
  async publishStory(): Promise<void> {
    const currentSlug = this.storySlug();
    if (!currentSlug) {
      await this.autoSave();
      return;
    }

    this.saving.set(true);
    
    try {
      if (this.isPublishedEdit()) {
        const originalId = this.originalStoryId();
        if (originalId) {
          await this.privateStoriesService.republishStoryBySlug(
            currentSlug, 
            originalId.toString()
          );
        }
      } else {
        await this.privateStoriesService.publishStoryBySlug(currentSlug);
      }
      
      this.router.navigate(['/chroniques']);
    } catch (error) {
      
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const currentSlug = this.storySlug();
    if (!currentSlug) return;

    if (confirm('Supprimer ce brouillon ?')) {
      try {
        await this.privateStoriesService.deleteStoryBySlug(currentSlug);
        this.router.navigate(['/chroniques/my-stories']);
      } catch (error) {
        
      }
    }
  }

  goBack(): void {
    this.saveBeforeExit();
    this.router.navigate(['/chroniques/my-stories']);
  }
  
  private async saveBeforeExit(): Promise<void> {
    const form = this.storyForm();
    if (form.title.trim() || form.content.trim()) {
      await this.autoSave();
    }
  }
  
  onTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.storyForm.update(current => ({ ...current, title: value }));
  }

  onContentChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.storyForm.update(current => ({ ...current, content: value }));
  }
}