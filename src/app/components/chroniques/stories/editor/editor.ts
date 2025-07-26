import { Component, OnInit, OnDestroy, inject, signal, computed, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';
import { AutoSaveService } from '../../../../services/auto-save.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';
import { PrivateStoryData } from '../../../../resolvers/chroniques-resolver';

interface Story {
  id: number;
  title: string;
  date: string;
  likes?: number;
}

interface StoryForm {
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

  //============ INJECTION ============

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);
  private autoSaveService = inject(AutoSaveService);
  private typingService = inject(TypingEffectService);

  //============ SIGNALS STRUCTURE ============

  private _isList = signal(true);
  private _isEdit = signal(false);
  private _listMode = signal<'myStories' | 'draft' | 'published'>('myStories');
  private _editMode = signal<'edit-new' | 'edit-draft' | 'edit-published'>('edit-new');
  private _selectedStoryIds = signal<Set<number>>(new Set());
  private _loading = signal(false);
  private _currentStoryId = signal<number | null>(null);

  //============ STORY FORM ============

  story = signal<StoryForm>({ title: '', content: '' });

  //============ RESOLVER DATA ============

  private storyData = toSignal(this.route.data) as () => PrivateStoryData | undefined;

  //============ COMPUTED MODES ============

  isListMode = computed(() => this._isList());
  isEditMode = computed(() => this._isEdit());
  isMyStoriesMode = computed(() => this._isList() && this._listMode() === 'myStories');
  isDraftsMode = computed(() => this._isList() && this._listMode() === 'draft');
  isPublishedMode = computed(() => this._isList() && this._listMode() === 'published');
  isDeleteMode = computed(() => this._selectedStoryIds().size > 0);

  //============ COMPUTED HEADER TITLE ============

  headerTitle = computed(() => {
    if (this._isList()) {
      if (this.isMyStoriesMode()) return 'Mes Histoires';
      return this._listMode() === 'draft' ? 'Brouillons' : 'Histoires Publiées';
    } else {
      switch (this._editMode()) {
        case 'edit-new': return 'Nouvelle Histoire';
        case 'edit-draft': return 'Continuer Histoire';
        case 'edit-published': return 'Modifier Histoire';
        default: return 'Éditeur';
      }
    }
  });

  //============ COMPUTED DATA ============

  stats = this.stories.stats;
  loading = computed(() => this._loading() || this.stories.loading());
  selectedStoryIds = this._selectedStoryIds.asReadonly();

  draftStories = computed((): Story[] => {
    return this.stories.drafts().map(draft => ({
      id: draft.id,
      title: draft.title,
      date: this.formatDate(draft.lastModified ?? new Date().toISOString())
    }));
  });

  publishedStories = computed((): Story[] => {
    return this.stories.published().map(published => ({
      id: published.id,
      title: published.title,
      date: this.formatDate(published.lastModified ?? new Date().toISOString()),
      likes: published.likes
    }));
  });

  //============ COMPUTED EDITOR ============

  canDelete = computed(() => {
    const mode = this._editMode();
    const storyId = this._currentStoryId();
    return mode !== 'edit-new' || storyId !== null;
  });

  deleteButtonText = computed(() => {
    return this._editMode() === 'edit-new' ? 'Annuler' : 'Supprimer';
  });

  publishButtonText = computed(() => {
    switch (this._editMode()) {
      case 'edit-new': return 'Publier';
      case 'edit-draft': return 'Publier';
      case 'edit-published': return 'Republier';
      default: return 'Publier';
    }
  });

  //============ TYPING EFFECT ============

  private typingEffect: ReturnType<TypingEffectService['createTypingEffect']> | null = null;
  typingComplete = computed(() => this.typingEffect?.typingComplete() || false);

  //============ AUTO SAVE ============

  private autoSaveInstance: ReturnType<AutoSaveService['createAutoSave']> | null = null;

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initializeFromRoute();
    this.setupTypingEffect();
    this.stories.initializeUserData();
  }

  ngOnDestroy(): void {
    this.typingEffect?.cleanup();
    this.autoSaveInstance?.cleanup();
  }

  //============ INITIALIZATION ============

  private initializeFromRoute(): void {
    const url = this.router.url;
    const data = this.storyData();

    if (url.includes('/mes-histoires')) {
      this.initializeListMode();
    } else if (data) {
      this.initializeEditMode(data);
    }
  }

  private initializeListMode(): void {
    const url = this.router.url;
    this._isList.set(true);
    this._isEdit.set(false);
    
    if (url.includes('publiées')) {
      this._listMode.set('published');
    } else if (url.includes('brouillons')) {
      this._listMode.set('draft');
    } else {
      this._listMode.set('myStories');
    }
  }

  private initializeEditMode(data: PrivateStoryData): void {
    this._isList.set(false);
    this._isEdit.set(true);
    
    switch (data.mode) {
      case 'EditNew':
        this._editMode.set('edit-new');
        return;
      case 'EditDraft':
        this._editMode.set('edit-draft');
        return;
      case 'EditPublished':
        this._editMode.set('edit-published');
        return;
    }
    
    if (data.storyId) {
      this._currentStoryId.set(data.storyId);
    }
    
    this.story.set({
      title: data.story.title,
      content: data.story.content
    });

    this.setupAutoSave();
  }

  private setupTypingEffect(): void {
    this.typingEffect = this.typingService.createTypingEffect({
      text: this.headerTitle(),
    });
    this.typingEffect.startTyping();
  }

  private setupAutoSave(): void {
    this.autoSaveInstance = this.autoSaveService.createAutoSave<StoryForm>({
      data: () => this.story(),
      mode: computed(() => this._editMode()),
      storyId: computed(() => this._currentStoryId()),
      loading: this._loading,
      storiesService: this.stories
    });
  }

  //============ LIST NAVIGATION ============

  showDrafts(): void {
    this._listMode.set('draft');
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }

  showPublished(): void {
    this._listMode.set('published');
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }

  //============ DELETE STORY SELECTION ============

  isStorySelected(storyId: number): boolean {
    return this._selectedStoryIds().has(storyId);
  }

  onCheckboxClick(event: Event, storyId: number): void {
    event.stopPropagation();
    const currentSet = this._selectedStoryIds();
    const newSet = new Set(currentSet);
    
    if (newSet.has(storyId)) {
      newSet.delete(storyId);
    } else {
      newSet.add(storyId);
    }
    
    this._selectedStoryIds.set(newSet);
  }

  //============ CARD CLICKS ============

  onDraftCardClick(story: Story): void {
    this.router.navigate(['/chroniques/edition/brouillon', story.title]);
  }

  onPublishedCardClick(story: Story): void {
    this.router.navigate(['/chroniques/edition/publiée', story.title]);
  }

  //============ EDITOR ACTIONS ============

  async publishStory(): Promise<void> {
    const storyId = this._currentStoryId();
    if (!storyId) return;

    const confirmed = await this.dialog.confirmPublishStory();
    if (!confirmed) return;

    this._loading.set(true);
    try {
      const data = this.storyData();
      const originalId = data?.originalStoryId;
      
      if (originalId && originalId !== storyId) {
        await this.stories.updateStory(storyId, originalId);
      } else {
        await this.stories.publishStory(storyId);
      }
      
      this.router.navigate(['/chroniques']);
    } finally {
      this._loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const storyId = this._currentStoryId();
    if (!storyId) return;

    const isEditNew = this._editMode() === 'edit-new';
    const confirmed = await this.dialog.confirmDeleteStory(isEditNew);
    if (!confirmed) return;

    this._loading.set(true);
    try {
      await this.stories.deleteStory(storyId);
      this.router.navigate(['/chroniques/mes-histoires']);
    } finally {
      this._loading.set(false);
    }
  }

  async deleteSelectedStories(): Promise<void> {
    const selectedIds = Array.from(this._selectedStoryIds());
    
    if (selectedIds.length === 0) return;

    const confirmed = await this.dialog.confirmDeleteStory(false);
    if (!confirmed) return;

    this._loading.set(true);
    try {
      for (const storyId of selectedIds) {
        await this.stories.deleteStory(storyId);
      }
      
      this._selectedStoryIds.set(new Set());
      await this.stories.initializeUserData();
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      this._loading.set(false);
    }
  }

  //============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }

  //============ UTILS ============

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}