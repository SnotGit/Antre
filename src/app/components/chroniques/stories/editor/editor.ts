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
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';

interface StoryFormData {
  title: string;
  content: string;
}

type EditorMode = 'nouvelle' | 'continuer' | 'modifier';

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
  private confirmationService = inject(ConfirmationDialogService);
  
  private editorMode = signal<EditorMode>('nouvelle');
  private currentStoryId = signal<number | null>(null);
  private originalStoryId = signal<number | null>(null);
  
  storyForm = signal<StoryFormData>({ title: '', content: '' });
  saving = signal<boolean>(false);
  
  storyId = toSignal(
    this.route.params.pipe(map(params => params['id'] ? parseInt(params['id']) : null)),
    { initialValue: null }
  );
  
  storyResource = resource({
    loader: async () => {
      const id = this.storyId();
      
      if (!id) {
        this.editorMode.set('nouvelle');
        this.currentStoryId.set(null);
        this.originalStoryId.set(null);
        return null;
      }
      
      const response = await this.privateStoriesService.getStoryForEditById(id);
      if (!response) {
        throw new Error('Histoire non trouvée');
      }
      
      if (response.originalStoryId) {
        this.editorMode.set('modifier');
        this.originalStoryId.set(response.originalStoryId);
        this.currentStoryId.set(response.story.id);
      } else {
        if (response.story.status === 'DRAFT') {
          this.editorMode.set('continuer');
        } else {
          this.editorMode.set('modifier');
          this.originalStoryId.set(response.story.id);
        }
        this.currentStoryId.set(response.story.id);
      }
      
      return response.story;
    }
  });
  
  headerText = computed(() => {
    const mode = this.editorMode();
    switch (mode) {
      case 'nouvelle': return 'Nouvelle Histoire';
      case 'continuer': return 'Continuer Histoire';
      case 'modifier': return 'Modifier Histoire';
      default: return 'Éditeur';
    }
  });
  
  canDelete = computed(() => {
    return this.editorMode() === 'continuer' && this.currentStoryId() !== null;
  });
  
  publishButtonText = computed(() => {
    const mode = this.editorMode();
    switch (mode) {
      case 'nouvelle': return 'Publier';
      case 'continuer': return 'Publier';
      case 'modifier': return 'Republier';
      default: return 'Publier';
    }
  });
  
  private typingEffect = this.typingService.createTypingEffect({
    text: this.headerText(),
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;
  
  private autoSave = this.autoSaveService.createAutoSave({
    data: () => this.storyForm(),
    saveFunction: async (data: StoryFormData) => {
      const storyId = this.currentStoryId();
      const mode = this.editorMode();
      
      if (mode === 'nouvelle') {
        const response = await this.privateStoriesService.saveDraft(data);
        this.currentStoryId.set(response.story.id);
        this.editorMode.set('continuer');
        this.router.navigate(['/chroniques/editor', response.story.id], { replaceUrl: true });
      } else if (storyId) {
        await this.privateStoriesService.saveDraft(data, storyId);
      }
    },
    delay: 2000
  });

  autoSaveState = this.autoSave.state;
  
  private formUpdateEffect = effect(() => {
    const story = this.storyResource.value();
    if (story) {
      this.storyForm.set({
        title: story.title || '',
        content: story.content || ''
      });
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
  
  onTitleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.storyForm.update(current => ({ ...current, title: value }));
  }

  onContentChange(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.storyForm.update(current => ({ ...current, content: value }));
  }
  
  async publishStory(): Promise<void> {
    const mode = this.editorMode();
    const storyId = this.currentStoryId();
    const originalId = this.originalStoryId();
    
    this.saving.set(true);
    
    try {
      if (mode === 'nouvelle') {
        const response = await this.privateStoriesService.saveDraft(this.storyForm());
        await this.privateStoriesService.publishStory(response.story.id);
      } else if (mode === 'continuer' && storyId) {
        await this.privateStoriesService.publishStory(storyId);
      } else if (mode === 'modifier' && storyId && originalId) {
        await this.privateStoriesService.republishStory(storyId, originalId);
      }
      
      this.router.navigate(['/chroniques']);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const storyId = this.currentStoryId();
    
    if (!storyId || !this.canDelete()) return;

    const confirmed = await this.confirmationService.confirm({
      title: 'Suppression du brouillon',
      message: 'Êtes-vous sûr de vouloir supprimer ce brouillon ?\n\nCette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    });

    if (!confirmed) return;

    await this.privateStoriesService.deleteStory(storyId);
    this.router.navigate(['/chroniques/my-stories']);
  }

  goBack(): void {
    this.router.navigate(['/chroniques/my-stories']);
  }
}