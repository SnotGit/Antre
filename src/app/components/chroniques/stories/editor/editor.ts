import { Component, OnInit, OnDestroy, inject, signal, computed, resource, linkedSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmationDialogService } from '../../../../services/confirmation-dialog.service';
import { AutoSaveService } from '../../../../services/auto-save.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';

interface StoryForm {
  title: string;
  content: string;
}

type EditorMode = 'NewStory' | 'EditDraft' | 'EditPublished';

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
  loading = signal(false);
  private storyId = signal<number | null>(null);
  private originalStoryId = signal<number | null>(null);

  //============ ROUTE PARAMS ============

  private routeParams = toSignal(
    this.route.params.pipe(map(params => ({ 
      title: params['title'] || null
    }))),
    { initialValue: { title: null } }
  );

  //============ STORY RESOURCE ============

  private storyResource = resource({
    params: () => this.routeParams(),
    loader: async ({ params }) => {
      if (this.mode() === 'NewStory') {
        return { title: '', content: '' };
      }

      if (params.title) {
        const response = await this.stories.getStoryForEdit(params.title);
        if (response) {
          this.storyId.set(response.story.id);
          this.originalStoryId.set(response.originalStoryId || null);
          return {
            title: response.story.title,
            content: response.story.content
          };
        }
      }

      return { title: '', content: '' };
    }
  });

  //============ FORM SIGNALS ============

  private originalStory = computed(() => this.storyResource.value() || { title: '', content: '' });
  updateStory = linkedSignal<StoryForm>(() => this.originalStory());

  //============ TYPING EFFECT ============

  private titleText = computed(() => {
    switch (this.mode()) {
      case 'NewStory': return 'Nouvelle histoire';
      case 'EditDraft': return 'Continuer histoire';
      case 'EditPublished': return 'Modifier histoire';
    }
  });

  private typingEffect: ReturnType<TypingEffectService['createTypingEffect']> | null = null;

  headerTitle = computed(() => this.typingEffect?.headerTitle() || '');
  typingComplete = computed(() => this.typingEffect?.typingComplete() || false);

  //============ COMPUTED ============

  canDelete = computed(() => this.storyId() !== null);
  
  deleteButtonText = computed(() => {
    return this.mode() === 'NewStory' ? 'Annuler' : 'Supprimer';
  });

  publishButtonText = computed(() => {
    switch (this.mode()) {
      case 'NewStory': return 'Publier';
      case 'EditDraft': return 'Publier';
      case 'EditPublished': return 'Republier';
    }
  });

  //============ AUTO SAVE ============

  private autoSaveInstance: ReturnType<AutoSaveService['createAutoSave']> | null = null;

  private setupAutoSave(): void {
    this.autoSaveInstance = this.autoSaveService.createAutoSave<StoryForm>({
      data: () => this.updateStory(),
      mode: this.mode,
      storyId: this.storyId,
      loading: this.loading,
      storiesService: this.stories
    });
  }

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    const url = this.router.url;
    if (url.includes('/edition/nouvelle-histoire')) {
      this.mode.set('NewStory');
    } else if (url.includes('/edition/brouillon/')) {
      this.mode.set('EditDraft');
    } else if (url.includes('/edition/publiée/')) {
      this.mode.set('EditPublished');
    }

    this.typingEffect = this.typingService.createTypingEffect({
      text: this.titleText()
    });
    this.typingEffect.startTyping();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.typingEffect?.cleanup();
    this.autoSaveInstance?.cleanup();
  }

  //============ ACTIONS ============

  async publishStory(): Promise<void> {
    const currentId = this.storyId();
    if (!currentId) return;

    this.loading.set(true);
    try {
      const originalId = this.originalStoryId();
      if (originalId && originalId !== currentId) {
        await this.stories.republishStory(currentId, originalId);
      } else {
        await this.stories.publishStory(currentId);
      }
      this.router.navigate(['/chroniques']);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const currentId = this.storyId();
    if (!currentId) return;

    const isNewStory = this.mode() === 'NewStory';
    const confirmed = await this.dialog.confirmDeleteStory(isNewStory);

    if (!confirmed) return;

    this.loading.set(true);
    try {
      if (isNewStory) {
        await this.stories.cancelNewStory(currentId);
      } else {
        await this.stories.deleteDraft(currentId);
      }
      this.router.navigate(['/chroniques/mes-histoires']);
    } finally {
      this.loading.set(false);
    }
  }

  //============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }
}