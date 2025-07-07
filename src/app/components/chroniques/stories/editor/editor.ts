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
  
  private draftId = signal<number | null>(null);
  private isPublishedEdit = signal<boolean>(false);
  private originalStoryId = signal<number | null>(null);
  
  storyForm = signal<StoryFormData>({ title: '', content: '' });
  saving = signal<boolean>(false);
  
  hasDraft = computed(() => this.draftId() !== null);
  
  currentSlug = toSignal(
    this.route.params.pipe(map(params => params['slug'] || null)),
    { initialValue: null }
  );
  
  isEditMode = computed(() => this.currentSlug() !== null);
  headerText = computed(() => 
    this.isEditMode() ? 'Modifier Histoire' : 'Nouvelle Histoire'
  );
  
  storyResource = resource({
    loader: async () => {
      const slug = this.currentSlug();
      
      if (slug) {
        const response = await this.privateStoriesService.getPublishedForEditBySlug(slug);
        if (response) {
          this.draftId.set(response.story.id!);
          this.originalStoryId.set(response.originalStoryId);
          this.isPublishedEdit.set(true);
          return {
            title: response.story.title,
            content: response.story.content
          };
        }
        throw new Error('Histoire non trouvée');
      } else {
        const draftIdParam = this.route.snapshot.queryParams['draftId'];
        if (draftIdParam) {
          const id = parseInt(draftIdParam);
          const draft = await this.privateStoriesService.getDraftForEdit(id);
          if (draft) {
            this.draftId.set(id);
            return {
              title: draft.title,
              content: draft.content
            };
          }
        }
        return { title: '', content: '' };
      }
    }
  });
  
  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;
  
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
    
    effect(() => {
      const data = this.storyResource.value();
      if (data) {
        this.storyForm.set(data);
      }
    });
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
      const response = await this.privateStoriesService.saveDraft(
        form, 
        this.draftId() || undefined
      );
      
      if (!this.draftId() && response.story?.id) {
        this.draftId.set(response.story.id);
        this.router.navigate(['/chroniques/editor'], { 
          queryParams: { draftId: response.story.id },
          replaceUrl: true 
        });
      }
    } catch (error) {
      
    }
  }
  
  async publishStory(): Promise<void> {
    const currentDraftId = this.draftId();
    if (!currentDraftId) {
      await this.autoSave();
      return;
    }

    this.saving.set(true);
    
    try {
      if (this.isPublishedEdit()) {
        await this.privateStoriesService.republishStory(
          currentDraftId, 
          this.originalStoryId()!
        );
      } else {
        await this.privateStoriesService.publishStory(currentDraftId);
      }
      
      this.router.navigate(['/chroniques']);
    } catch (error) {
      
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const currentDraftId = this.draftId();
    if (!currentDraftId) return;

    if (confirm('Supprimer ce brouillon ?')) {
      try {
        await this.privateStoriesService.deleteStory(currentDraftId);
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
  
  updateTitle(value: string): void {
    this.storyForm.update(current => ({ ...current, title: value }));
  }

  updateContent(value: string): void {
    this.storyForm.update(current => ({ ...current, content: value }));
  }

  onTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateTitle(value);
  }

  onContentChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.updateContent(value);
  }
}