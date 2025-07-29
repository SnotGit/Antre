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

  //============ INJECTIONS ============

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private stories = inject(PrivateStoriesService);
  private auth = inject(AuthService);
  private dialog = inject(ConfirmationDialogService);
  private autoSaveService = inject(AutoSaveService);
  private typingService = inject(TypingEffectService);

  //============ STATE MANAGEMENT ============

  private _viewMode = signal<ViewMode>('my-stories');
  private _editMode = signal<EditMode>('editNew');
  private _isEditing = signal<boolean>(false);
  private _loading = signal(false);
  private _storyId = signal<number | null>(null);
  private _originalStoryId = signal<number | null>(null);
  private _selected = signal<Set<number>>(new Set());

  //============ STORY DATA ============

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

  //============ SIGNALS ============

  viewMode = this._viewMode.asReadonly();
  editMode = this._editMode.asReadonly();
  isEditing = this._isEditing.asReadonly();
  loading = this._loading.asReadonly();
  selected = this._selected.asReadonly();

  //============ COMPUTED ============

  isListMode = computed(() => !this._isEditing());
  isEditMode = computed(() => this._isEditing());
  isMyStoriesMode = computed(() => this._viewMode() === 'my-stories');
  isDraftsMode = computed(() => this._viewMode() === 'drafts');
  isPublishedMode = computed(() => this._viewMode() === 'published');
  isDeleteMode = computed(() => this._selected().size > 0);

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

  //============ TITLES ============

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

  //======= TYPING EFFECT =======

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typingComplete = this.typingService.typingComplete;

  private readonly titleEffect = effect(() => {
    this.typingService.title(this.currentTitle());
  });

  //======= AUTO-SAVE =======

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
    const currentId = this._storyId();

    if (!this.shouldSave(data) || !currentId) return;

    try {
      const storyData = {
        title: data.title.trim() || 'Histoire sans titre',
        content: data.content.trim()
      };

      await this.stories.saveDraft(storyData, currentId);
    } catch (error) {
      console.error('Erreur autosave:', error);
    }
  }

  private shouldSave(data: Story): boolean {
    return data.title.trim().length > 0 || data.content.trim().length > 0;
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

  //======= LIFECYCLE =======

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

  //======= ROUTING =======

  private initializeFromRoute(): void {
    const url = this.router.url;
    const data = this.resolvedData();

    if (this.isEditUrl(url)) {
      this.initializeEditMode(data?.['data'] || null);
      return;
    }

    if (this.isListUrl(url)) {
      this.initializeListMode(url);
      return;
    }

    this._isEditing.set(false);
    this._viewMode.set('my-stories');
  }

  private isEditUrl(url: string): boolean {
    return url.includes('/edition/') || url.endsWith('/nouvelle-histoire');
  }

  private isListUrl(url: string): boolean {
    return url.endsWith('/mes-histoires') ||
      url.endsWith('/brouillons') ||
      url.endsWith('/publiées');
  }

  //======= INIT =======

  private initializeListMode(url: string): void {
    this._isEditing.set(false);
    this._viewMode.set(
      url.includes('publiées') ? 'published' :
        url.includes('brouillons') ? 'drafts' :
          'my-stories'
    );
  }

  private async initializeEditMode(data: Story | null): Promise<void> {
    this._isEditing.set(true);

    if (!data) {
      await this.createNewDraft();
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
      
      this.setupAutoSave();
    } else {
      // Fallback editNew
      await this.createNewDraft();
    }
  }

  //======= EDIT NEW =======

  private async createNewDraft(): Promise<void> {
    try {
      this._editMode.set('editNew');
      
      const storyData = {
        title: 'Histoire sans titre',
        content: ''
      };

      const response = await this.stories.saveDraft(storyData);
      this._storyId.set(response.story.id);
      this._storyTitle.set('');
      this._storyContent.set('');
      
      this.setupAutoSave();
    } catch (error) {
      console.error('Erreur création draft:', error);
      alert('Erreur lors de la création de l\'histoire');
      this.router.navigate(['/chroniques/mes-histoires']);
    }
  }

  //======= NAVIGATION =======

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

  //======= SELECTION =======

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

  //======= CARDS =======

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

  //======= ACTIONS =======

  async publishStory(): Promise<void> {
    const storyId = this._storyId();
    if (!storyId) {
      alert('Erreur: Histoire non sauvegardée');
      return;
    }

    this._loading.set(true);
    try {
      const originalId = this._originalStoryId();

      if (originalId) {
        await this.stories.updatePublishedStory(storyId, originalId);
      } else {
        await this.stories.publishStory(storyId);
      }

      this.router.navigate(['/chroniques']);
    } catch (error) {
      alert('Erreur lors de la publication');
    } finally {
      this._loading.set(false);
    }
  }

  //======= DELETE =======

  async deleteStory(): Promise<void> {
    const storyId = this._storyId();
    const mode = this._editMode();
    
    console.log('DELETE: storyId =', storyId, 'mode =', mode);
    
    if (!storyId) {
      console.error('Suppression impossible: aucun ID story');
      alert('Erreur: Histoire non sauvegardée, impossible de supprimer');
      return;
    }

    const isNew = mode === 'editNew';
    
    try {
      const confirmed = await this.dialog.confirmDeleteStory(isNew);
      if (!confirmed) return;

      this._loading.set(true);
      await this.stories.deleteStory(storyId);
      
      this.cleanupAfterDelete();
      
      this.navigateAfterDelete();
      
    } catch (error) {
      console.error('Erreur suppression:', error);
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

      await Promise.all(ids.map(id => this.stories.deleteStory(id)));
      
      this._selected.set(new Set());
    } catch (error) {
      console.error('Erreur suppression multiple:', error);
      alert('Erreur lors de la suppression');
    } finally {
      this._loading.set(false);
    }
  }

  //======= CLEANUP & NAVIGATION =======

  private cleanupAfterDelete(): void {
    if (this.autoSaveInstance) {
      this.autoSaveInstance.destroy();
      this.autoSaveInstance = null;
    }
    
    this._storyId.set(null);
    this._originalStoryId.set(null);
    this._storyTitle.set('');
    this._storyContent.set('');
  }

  private navigateAfterDelete(): void {
    const currentUrl = this.router.url;
    
    if (currentUrl.includes('/brouillons')) {
      this.router.navigate(['/chroniques/mes-histoires/brouillons']);
    } else if (currentUrl.includes('/publiées')) {
      this.router.navigate(['/chroniques/mes-histoires/publiées']);
    } else if (currentUrl.includes('/mes-histoires')) {
      this.router.navigate(['/chroniques/mes-histoires']);
    } else {
      this.router.navigate(['/chroniques']);
    }
  }

  //======= UTILS =======

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}