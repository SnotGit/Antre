import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
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

//============ INTERFACES ============

interface EditStory {
  title: string;
  content: string;
}

interface Story {
  id: number;
  title: string;
  date: string;
  likes?: number;
}

interface ResolvedPrivateStory {
  storyId: number;
  title: string;
  content: string;
  originalStoryId?: number;
}

type ViewMode = 'my-stories' | 'drafts' | 'published' | 'edit';
type EditMode = 'editNew' | 'editDraft' | 'editPublished';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);
  private autoSave = inject(AutoSaveService);
  private typing = inject(TypingEffectService);

  //============ SIGNALS ============

  private _viewMode = signal<ViewMode>('my-stories');
  private _editMode = signal<EditMode>('editNew');
  private _loading = signal(false);
  private _storyId = signal<number | null>(null);
  private _originalStoryId = signal<number | null>(null);
  private _selected = signal<Set<number>>(new Set());

  story = signal<EditStory>({ title: '', content: '' });

  //============ READONLY ============

  viewMode = this._viewMode.asReadonly();
  editMode = this._editMode.asReadonly();
  loading = this._loading.asReadonly();
  selected = this._selected.asReadonly();

  //============ COMPUTED ============

  isListMode = computed(() => this._viewMode() !== 'edit');
  isEditMode = computed(() => this._viewMode() === 'edit');
  isMyStoriesMode = computed(() => this._viewMode() === 'my-stories');
  isDraftsMode = computed(() => this._viewMode() === 'drafts');
  isPublishedMode = computed(() => this._viewMode() === 'published');
  isDeleteMode = computed(() => this._selected().size > 0);

  //============ STORIES ============

  stats = this.stories.stats;
  resolvedData = toSignal(this.route.data);

  draftStories = computed((): Story[] => {
    return this.stories.drafts().map(draft => ({
      id: draft.id,
      title: draft.title,
      date: this.formatDate(draft.lastModified)
    }));
  });

  publishedStories = computed((): Story[] => {
    return this.stories.published().map(published => ({
      id: published.id,
      title: published.title,
      date: this.formatDate(published.lastModified),
      likes: published.likes
    }));
  });

  //============ UI ============

  headerTitle = computed(() => {
    if (this.isListMode()) {
      switch (this._viewMode()) {
        case 'my-stories': return 'Mes Histoires';
        case 'drafts': return 'Brouillons';  
        case 'published': return 'Histoires Publiées';
        default: return 'Mes Histoires';
      }
    } else {
      switch (this._editMode()) {
        case 'editNew': return 'Nouvelle Histoire';
        case 'editDraft': return 'Continuer Histoire';
        case 'editPublished': return 'Modifier Histoire';
        default: return 'Éditeur';
      }
    }
  });

  canDelete = computed(() => {
    return this._editMode() !== 'editNew' || this._storyId() !== null;
  });

  deleteButtonText = computed(() => {
    return this._editMode() === 'editNew' ? 'Annuler' : 'Supprimer';
  });

  publishButtonText = computed(() => {
    switch (this._editMode()) {
      case 'editNew': return 'Publier';
      case 'editDraft': return 'Publier';
      case 'editPublished': return 'Republier';
      default: return 'Publier';
    }
  });

  //============ EFFECTS ============

  private typingEffect = this.typing.createTypingEffect({ text: '' });
  typingComplete = this.typingEffect.typingComplete;

  private autoSaveInstance: ReturnType<AutoSaveService['createAutoSave']> | null = null;

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initializeFromRoute();
    this.setupTyping();
    this.stories.loadStories();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
    this.autoSaveInstance?.cleanup();
  }

  //============ SETUP ============

  private setupTyping(): void {
    this.typingEffect = this.typing.createTypingEffect({
      text: this.headerTitle()
    });
    this.typingEffect.startTyping();
  }

  private setupAutoSave(): void {
    this.autoSaveInstance = this.autoSave.createAutoSave({
      data: () => this.story(),
      mode: () => this._editMode(),
      storyId: computed(() => this._storyId()),
      loading: this._loading,
      storiesService: {
        saveDraft: async (data: EditStory, id?: number) => {
          const response = await this.stories.saveDraft(data, id);
          
          if (!id && this._editMode() === 'editNew' && response.story.id) {
            this._storyId.set(response.story.id);
            this._editMode.set('editDraft');
          }
          
          return response;
        }
      }
    });
  }

  //============ INITIALIZATION ============

  private initializeFromRoute(): void {
    const url = this.router.url;
    const data = this.resolvedData();

    if (data?.['data']) {
      this.initializeEditMode(data['data']);
      return;
    }

    if (this.isListUrl(url)) {
      this.initializeListMode(url);
      return;
    }

    this._viewMode.set('my-stories');
  }

  private isListUrl(url: string): boolean {
    return url.endsWith('/mes-histoires') || 
           url.endsWith('/brouillons') || 
           url.endsWith('/publiées');
  }

  private initializeListMode(url: string): void {
    this._viewMode.set(
      url.includes('publiées') ? 'published' :
      url.includes('brouillons') ? 'drafts' : 
      'my-stories'
    );
  }

  private initializeEditMode(data: ResolvedPrivateStory | null): void {
    this._viewMode.set('edit');
    
    if (!data) {
      this._editMode.set('editNew');
      this.setupAutoSave();
      return;
    }

    if (data.storyId) {
      this._storyId.set(data.storyId);
      this.story.set({
        title: data.title || '',
        content: data.content || ''
      });

      if (data.originalStoryId) {
        this._originalStoryId.set(data.originalStoryId);
        this._editMode.set('editPublished');
      } else {
        this._editMode.set('editDraft');
      }

      this.setupAutoSave();
    } else {
      this._editMode.set('editNew');
      this.setupAutoSave();
    }
  }

  //============ NAVIGATION ============

  showDrafts(): void {
    this._viewMode.set('drafts');
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }

  showPublished(): void {
    this._viewMode.set('published');
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }

  goBack(): void {
    this.location.back();
  }

  //============ SELECTION ============

  isStorySelected(storyId: number): boolean {
    return this._selected().has(storyId);
  }

  onCheckboxClick(event: Event, storyId: number): void {
    event.stopPropagation();
    const current = this._selected();
    const newSet = new Set(current);
    
    if (newSet.has(storyId)) {
      newSet.delete(storyId);
    } else {
      newSet.add(storyId);
    }
    
    this._selected.set(newSet);
  }

  //============ CLICKS ============

  onDraftCardClick(story: Story): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillon/edition', story.title]);
  }

  onPublishedCardClick(story: Story): void {
    this.router.navigate(['/chroniques/mes-histoires/publiée/edition', story.title]);
  }

  //============ ACTIONS ============

  async publishStory(): Promise<void> {
    const storyId = this._storyId();
    if (!storyId) return;

    const confirmed = await this.dialog.confirmPublishStory();
    if (!confirmed) return;

    this._loading.set(true);
    try {
      const originalId = this._originalStoryId();
      
      if (originalId) {
        await this.stories.updatePublishedStory(storyId, originalId);
      } else {
        await this.stories.publishStory(storyId);
      }
      
      this.router.navigate(['/chroniques']);
    } finally {
      this._loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const storyId = this._storyId();
    if (!storyId) return;

    const isNew = this._editMode() === 'editNew';
    const confirmed = await this.dialog.confirmDeleteStory(isNew);
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
    const ids = Array.from(this._selected());
    if (ids.length === 0) return;

    const confirmed = await this.dialog.confirmDeleteStory(false);
    if (!confirmed) return;

    this._loading.set(true);
    try {
      for (const id of ids) {
        await this.stories.deleteStory(id);
      }
      this._selected.set(new Set());
    } finally {
      this._loading.set(false);
    }
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