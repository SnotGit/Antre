import { Component, OnInit, OnDestroy, inject, signal, computed, effect, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';
import { AutoSaveService } from '../../../../services/auto-save';
import { TypingEffectService } from '../../../../services/typing-effect.service';

interface StoryForm {
  title: string;
  content: string;
}

type EditorMode = 'NewStory' | 'ContinueDraft' | 'EditPublished';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit, OnDestroy {

  //============ INJECTION ============

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);
  private autoSaveService = inject(AutoSaveService);
  private typingService = inject(TypingEffectService);

  //============ SIGNALS ============

  private mode = signal<EditorMode>('NewStory');
  private loading = signal(false);
  private storyId = signal<number | null>(null);

  //============ ROUTE DATA ============

  private routeUrl = toSignal(
    this.route.url.pipe(map(segments => {
      const path = segments.map(s => s.path).join('/');
      if (path.includes('nouvelle-histoire')) return 'NewStory';
      if (path.includes('brouillon')) return 'ContinueDraft';
      if (path.includes('histoire-publiée')) return 'EditPublished';
      return 'NewStory';
    })),
    { initialValue: 'NewStory' as EditorMode }
  );

  private resolvedStoryId = toSignal(
    this.route.data.pipe(map(data => data['storyId'] || null)),
    { initialValue: null }
  );

  //============ LINKED SIGNALS ============

  private originalStory = signal<StoryForm>({ title: '', content: '' });
  updateStory = linkedSignal(() => this.originalStory());

  //============ TYPING EFFECT ============

  private typingEffect = this.typingService.createTypingEffect({
    text: computed(() => {
      const currentMode = this.mode();
      if (currentMode === 'NewStory') return 'Nouvelle histoire';
      if (currentMode === 'ContinueDraft') return 'Continuer brouillon';
      return 'Modifier histoire';
    })()
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;

  //============ AUTO SAVE ============

  private autoSave = this.autoSaveService.createAutoSave<StoryForm>({
    data: () => this.updateStory(),
    saveFunction: (data) => this.performAutoSave(data),
    shouldSave: (data) => data.title.trim().length > 0 || data.content.trim().length > 0
  });

  //============ COMPUTED ============

  saving = computed(() => this.loading());

  canDelete = computed(() => this.storyId() !== null);

  publishButtonText = computed(() => 'Publier');

  //============ CONSTRUCTOR ============

  constructor() {
    effect(() => {
      const mode = this.routeUrl();
      this.mode.set(mode);
    });

    effect(() => {
      const storyId = this.resolvedStoryId();
      if (storyId) {
        this.loadStoryData(storyId);
      } else if (this.mode() === 'NewStory') {
        this.createNewStory();
      }
    });
  }

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
    this.autoSave.cleanup();
  }

  //============ PRIVATE METHODS ============

  private async createNewStory(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.stories.saveDraft({ title: '', content: '' });
      this.storyId.set(response.story.id);
      this.originalStory.set({
        title: response.story.title,
        content: response.story.content
      });
    } catch (error) {
      this.router.navigate(['/chroniques']);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadStoryData(storyId: number): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.stories.getStoryForEdit(storyId);
      if (!response) {
        this.router.navigate(['/chroniques']);
        return;
      }

      this.storyId.set(response.story.id);
      this.originalStory.set({
        title: response.story.title,
        content: response.story.content
      });
    } catch (error) {
      this.router.navigate(['/chroniques']);
    } finally {
      this.loading.set(false);
    }
  }

  private async performAutoSave(data: StoryForm): Promise<void> {
    const currentId = this.storyId();
    if (!currentId) return;

    try {
      await this.stories.saveDraft(data, currentId);
    } catch (error) {
      
    }
  }

  //============ EVENT HANDLERS ============

  onTitleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateStory.set({ 
      ...this.updateStory(), 
      title: target.value 
    });
  }

  onContentChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.updateStory.set({ 
      ...this.updateStory(), 
      content: target.value 
    });
  }

  //============ ACTIONS ============

  async publishStory(): Promise<void> {
    const currentId = this.storyId();
    if (!currentId) return;

    this.loading.set(true);
    try {
      await this.stories.publishStory(currentId);
      this.router.navigate(['/chroniques']);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const currentId = this.storyId();
    if (!currentId) return;

    const isNewStory = this.mode() === 'NewStory';
    
    const confirmed = await this.dialog.confirm({
      title: isNewStory ? 'Annuler la création' : 'Suppression du brouillon',
      message: isNewStory 
        ? 'Êtes-vous sûr de vouloir annuler la création de cette histoire ?'
        : 'Êtes-vous sûr de vouloir supprimer ce brouillon ?',
      confirmText: isNewStory ? 'Annuler' : 'Supprimer',
      cancelText: 'Retour',
      isDanger: true
    });

    if (!confirmed) return;

    this.loading.set(true);
    try {
      if (isNewStory) {
        await this.stories.cancelNewStory(currentId);
      } else {
        await this.stories.deleteDraft(currentId);
      }
      this.router.navigate(['/chroniques/my-stories']);
    } finally {
      this.loading.set(false);
    }
  }

  //============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }
}