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

  //============ DATA FROM RESOLVER ============

  private storyData = toSignal(this.route.data) as () => PrivateStoryData | undefined;
  
  //============ SIGNALS ============

  loading = signal(false);
  private currentStoryId = signal<number | null>(null);

  //============ FORM MANAGEMENT ============

  story = linkedSignal<StoryForm>(() => this.storyData()?.story || { title: '', content: '' });

  //============ COMPUTED ============

  mode = computed(() => this.storyData()?.mode || 'NewStory');
  
  canDelete = computed(() => {
    const data = this.storyData();
    return data?.storyId !== null || this.currentStoryId() !== null;
  });
  
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

  //============ AUTO SAVE ============

  private autoSaveInstance: ReturnType<AutoSaveService['createAutoSave']> | null = null;

  private setupAutoSave(): void {
    this.autoSaveInstance = this.autoSaveService.createAutoSave<StoryForm>({
      data: () => this.story(),
      mode: this.mode,
      storyId: computed(() => this.currentStoryId() || this.storyData()?.storyId || null),
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

    // Initialiser l'ID courant depuis le resolver
    const data = this.storyData();
    if (data?.storyId) {
      this.currentStoryId.set(data.storyId);
    }

    this.typingEffect = this.typingService.createTypingEffect({
      text: this.titleText(),
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
    const storyId = this.currentStoryId() || this.storyData()?.storyId;
    if (!storyId) return;

    const confirmed = await this.dialog.confirmPublishStory();
    if (!confirmed) return;

    this.loading.set(true);
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
      this.loading.set(false);
    }
  }

  async deleteStory(): Promise<void> {
    const storyId = this.currentStoryId() || this.storyData()?.storyId;
    if (!storyId) return;

    const isNewStory = this.mode() === 'NewStory';
    const confirmed = await this.dialog.confirmDeleteStory(isNewStory);
    if (!confirmed) return;

    this.loading.set(true);
    try {
      if (isNewStory) {
        await this.stories.cancel(storyId);
      } else {
        await this.stories.deleteDraft(storyId);
      }
      this.router.navigate(['/chroniques/mes-histoires']);
    } finally {
      this.loading.set(false);
    }
  }


  cancel (){}
  //============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }
}