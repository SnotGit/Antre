import { Component, OnInit, OnDestroy, inject, signal, computed, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';
import { AutoSaveService } from '../../../../services/auto-save';

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
  private autoSaveService = inject(AutoSaveService);
  
  private isPublishedEdit = signal<boolean>(false);
  private originalStoryId = signal<number | null>(null);
  private currentStoryId = signal<number | null>(null);
  
  storyForm = signal<StoryFormData>({ title: '', content: '' });
  saving = signal<boolean>(false);
  
  storySlug = toSignal(
    this.route.params.pipe(map(params => params['slug'] || null)),
    { initialValue: null }
  );
  
  storyResource = resource({
    loader: async () => {
      const slug = this.storySlug();
      if (!slug) return { title: '', content: '', id: null };
      
      const response = await this.privateStoriesService.getStoryForEditBySlug(slug);
      if (response) {
        this.originalStoryId.set(response.originalStoryId || null);
        this.currentStoryId.set(response.story.id);
        this.isPublishedEdit.set(!!response.originalStoryId);
        return {
          title: response.story.title,
          content: response.story.content,
          id: response.story.id
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
  hasError = computed(() => !this.storyResource.error());
  
  private autoSave = this.autoSaveService.createAutoSave({
    data: () => this.storyForm(),
    saveFunction: async (data: StoryFormData) => {
      const storyId = this.currentStoryId();
      const response = await this.privateStoriesService.saveDraft(data, storyId ?? undefined);
      
      if (!storyId && response.story?.id) {
        this.currentStoryId.set(response.story.id);
        this.router.navigate(['/editor', response.story.slug], { replaceUrl: true });
      }
    },
    delay: 2000
  });

  autoSaveState = this.autoSave.state;
  
  private formUpdateEffect = effect(() => {
    const resourceValue = this.storyResource.value();
    const isLoading = this.isLoading();
    const hasError = this.hasError();
    
    if (!isLoading && !hasError && resourceValue) {
      this.storyForm.set({
        title: resourceValue.title || '',
        content: resourceValue.content || ''
      });
      
      if (resourceValue.id) {
        this.currentStoryId.set(resourceValue.id);
      }
    }
  });
  
  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
    this.autoSave.cleanup();
  }
  
  async publishStory(): Promise<void> {
    const storyId = this.currentStoryId();
    if (!storyId) {
      return;
    }

    this.saving.set(true);
    
    try {
      if (this.isPublishedEdit()) {
        const originalId = this.originalStoryId();
        if (originalId) {
          await this.privateStoriesService.republishStory(storyId, originalId);
        }
      } else {
        await this.privateStoriesService.publishStory(storyId);
      }
      
      this.router.navigate(['/chroniques']);
    } catch (error) {
      
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const storyId = this.currentStoryId();
    if (!storyId) return;

    if (confirm('Supprimer ce brouillon ?')) {
      try {
        await this.privateStoriesService.deleteStory(storyId);
        this.router.navigate(['/chroniques/my-stories']);
      } catch (error) {
        
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/chroniques/my-stories']);
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