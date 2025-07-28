import { Component, OnInit, OnDestroy, inject, signal, computed, effect} from '@angular/core';
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

interface StoryCard {
  id: number;
  title: string;
  date: string;
  likes?: number;
}

interface Story {
  storyId?: number;
  title: string;
  content: string;
  originalStoryId?: number;
}

type ViewMode = 'my-stories' | 'drafts' | 'published';
type EditMode = 'editNew' | 'editDraft' | 'editPublished';

@Component({
  selector: 'app-editor',
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html',
  styleUrl: './editor.scss'
})
export class Editor implements OnInit, OnDestroy {

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);
  private autoSaveService = inject(AutoSaveService);
  private typingService = inject(TypingEffectService);

  private _viewMode = signal<ViewMode>('my-stories');
  private _editMode = signal<EditMode>('editNew');
  private _isEditing = signal<boolean>(false);
  private _loading = signal(false);
  private _storyId = signal<number | null>(null);
  private _originalStoryId = signal<number | null>(null);
  private _selected = signal<Set<number>>(new Set());

  private _storyTitle = signal<string>('');
  private _storyContent = signal<string>('');

  story = computed(() => ({
    title: this._storyTitle(),
    content: this._storyContent()
  }));

  get storyTitle(): string {
    return this._storyTitle();
  }

  set storyTitle(value: string) {
    this._storyTitle.set(value);
  }

  get storyContent(): string {
    return this._storyContent();
  }

  set storyContent(value: string) {
    this._storyContent.set(value);
  }

  viewMode = this._viewMode.asReadonly();
  editMode = this._editMode.asReadonly();
  isEditing = this._isEditing.asReadonly();
  loading = this._loading.asReadonly();
  selected = this._selected.asReadonly();

  isListMode = computed(() => !this._isEditing());
  isEditMode = computed(() => this._isEditing());
  isMyStoriesMode = computed(() => this._viewMode() === 'my-stories');
  isDraftsMode = computed(() => this._viewMode() === 'drafts');
  isPublishedMode = computed(() => this._viewMode() === 'published');
  isDeleteMode = computed(() => this._selected().size > 0);

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

  private readonly TITLES = {
    editNew: 'Nouvelle Histoire',
    editDraft: 'Continuer Histoire',
    editPublished: 'Modifier Histoire',
    'my-stories': 'Mes Histoires',
    drafts: 'Brouillons',
    published: 'Histoires Publiées'
  };

  currentTitle = computed(() => {
    if (this._isEditing()) {
      return this.TITLES[this._editMode()];
    } else {
      return this.TITLES[this._viewMode()];
    }
  });

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typingComplete = this.typingService.typingComplete;

  private readonly titleEffect = effect(() => {
    this.typingService.title(this.currentTitle());
  });

  private autoSaveInstance: ReturnType<AutoSaveService['autoSave']> | null = null;

  private setupAutoSave(): void {
    if (this.autoSaveInstance) {
      this.autoSaveInstance.destroy();
    }

    this.autoSaveInstance = this.autoSaveService.autoSave({
      data: this.story,
      onSave: async () => {
        await this.performAutoSave();
      },
      delay: 2000
    });
  }

  private async performAutoSave(): Promise<void> {
    const data = this.story();
    const mode = this._editMode();
    const currentId = this._storyId();

    if (!this.shouldSave(data)) return;

    try {
      if (mode === 'editNew' && !currentId) {
        await this.createNewDraft(data);
        return;
      }

      if (mode === 'editPublished' && !currentId) {
        await this.createEditDraft(data);
        return;
      }

      if (currentId) {
        await this.updateExistingDraft(data, currentId);
      }
    } catch (error) {
      console.error('Erreur autosave:', error);
    }
  }

  private shouldSave(data: Story): boolean {
    return data.title.trim().length > 0 || data.content.trim().length > 0;
  }

  private async createNewDraft(data: Story): Promise<void> {
    const storyData = {
      title: data.title.trim() || 'Histoire sans titre',
      content: data.content.trim()
    };

    const response = await this.stories.saveDraft(storyData);
    this._storyId.set(response.story.id);
  }

  private async createEditDraft(data: Story): Promise<void> {
    const storyData = {
      title: data.title.trim() || 'Histoire sans titre',
      content: data.content.trim()
    };

    const response = await this.stories.saveDraft(storyData);
    this._storyId.set(response.story.id);
  }

  private async updateExistingDraft(data: Story, id: number): Promise<void> {
    const storyData = {
      title: data.title.trim() || 'Histoire sans titre',
      content: data.content.trim()
    };

    await this.stories.saveDraft(storyData, id);
  }

  stats = this.stories.stats;
  resolvedData = toSignal(this.route.data);

  draftStories = computed((): StoryCard[] => {
    return this.stories.drafts().map(draft => ({
      id: draft.id,
      title: draft.title,
      date: this.formatDate(draft.lastModified)
    }));
  });

  publishedStories = computed((): StoryCard[] => {
    return this.stories.published().map(published => ({
      id: published.id,
      title: published.title,
      date: this.formatDate(published.lastModified),
      likes: published.likes
    }));
  });

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initializeFromRoute();
    this.stories.loadStories();
  }

  ngOnDestroy(): void {
    this.autoSaveInstance?.destroy();
    this.titleEffect.destroy();
  }

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

    this._isEditing.set(false);
    this._viewMode.set('my-stories');
  }

  private isListUrl(url: string): boolean {
    return url.endsWith('/mes-histoires') ||
      url.endsWith('/brouillons') ||
      url.endsWith('/publiées');
  }

  private initializeListMode(url: string): void {
    this._isEditing.set(false);
    this._viewMode.set(
      url.includes('publiées') ? 'published' :
        url.includes('brouillons') ? 'drafts' :
          'my-stories'
    );
  }

  private initializeEditMode(data: Story | null): void {
    this._isEditing.set(true);

    if (!data) {
      this._editMode.set('editNew');
      this.setupAutoSave();
      return;
    }

    if (data.storyId) {
      this._storyId.set(data.storyId);
      
      if (data.originalStoryId) {
        this._originalStoryId.set(data.originalStoryId);
        this._editMode.set('editPublished');
      } else {
        this._editMode.set('editDraft');
      }

      this._storyTitle.set(data.title || '');
      this._storyContent.set(data.content || '');
      
      setTimeout(() => {
        this.setupAutoSave();
      }, 0);
    } else {
      this._editMode.set('editNew');
      this.setupAutoSave();
    }
  }

  showDrafts(): void {
    this._isEditing.set(false);
    this._viewMode.set('drafts');
    this.router.navigate(['/chroniques/mes-histoires/brouillons']);
  }

  showPublished(): void {
    this._isEditing.set(false);
    this._viewMode.set('published');
    this.router.navigate(['/chroniques/mes-histoires/publiées']);
  }

  goBack(): void {
    this.location.back();
  }

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

  onDraftCardClick(story: StoryCard): void {
    if (this.isDeleteMode()) {
      return;
    }

    const cleanTitle = story.title
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-àéèêîôùûüÿç]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    this.router.navigate(['/chroniques/mes-histoires/brouillon/edition', cleanTitle]);
  }

  onPublishedCardClick(story: StoryCard): void {
    if (this.isDeleteMode()) {
      return;
    }

    const cleanTitle = story.title
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-àéèêîôùûüÿç]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    this.router.navigate(['/chroniques/mes-histoires/publiée/edition', cleanTitle]);
  }

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
    
    try {
      const confirmed = await this.dialog.confirmDeleteStory(isNew);
      if (!confirmed) return;

      this._loading.set(true);
      await this.stories.deleteStory(storyId);
      this.router.navigate(['/chroniques/mes-histoires']);
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      this._loading.set(false);
    }
  }

  async deleteSelectedStories(): Promise<void> {
    const ids = Array.from(this._selected());
    if (ids.length === 0) return;

    try {
      const confirmed = await this.dialog.confirmDeleteStory(false);
      if (!confirmed) return;

      this._loading.set(true);

      for (const id of ids) {
        await this.stories.deleteStory(id);
      }
      
      this._selected.set(new Set());
    } catch (error) {
      alert('Erreur lors de la suppression');
    } finally {
      this._loading.set(false);
    }
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}