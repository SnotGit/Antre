import { Injectable, signal, effect, Signal, WritableSignal } from '@angular/core';

interface EditStory {
  title: string;
  content: string;
}

interface StoriesService {
  saveDraft: (data: EditStory, id?: number) => Promise<{ story: { id: number } }>;
}

interface AutoSaveConfig<T> {
  data: () => T;
  mode: () => string;
  storyId: Signal<number | null>;  
  loading: WritableSignal<boolean>;
  storiesService: StoriesService;
  delay?: number;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService {

  createAutoSave<T>(config: AutoSaveConfig<T>) {
    const state = signal<AutoSaveState>({
      isSaving: false,
      lastSaveTime: null,
      hasUnsavedChanges: false
    });

    let timeoutId: number | undefined;

    const scheduleAutoSave = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const delay = config.delay ?? 2000;
      timeoutId = window.setTimeout(() => {
        executeSave();
      }, delay);
    };

    const executeSave = async () => {
      const data = config.data();

      if (!this.shouldSave(data)) return;

      state.update(s => ({ ...s, isSaving: true }));

      try {
        const id = await this.performSave(data, config);
        
        state.update(s => ({
          ...s,
          isSaving: false,
          lastSaveTime: new Date(),
          hasUnsavedChanges: false
        }));
      } catch (error) {
        state.update(s => ({ ...s, isSaving: false }));
      }
    };

    const autoSaveEffect = effect(() => {
      const data = config.data();

      if (this.shouldSave(data)) {
        state.update(s => ({ ...s, hasUnsavedChanges: true }));
        scheduleAutoSave();
      }
    });

    return {
      state: state.asReadonly(),
      forceSave: executeSave,
      cleanup: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        autoSaveEffect.destroy();
      }
    };
  }

  private async performSave<T>(data: T, config: AutoSaveConfig<T>): Promise<number | null> {
    const currentId = config.storyId();

    if (!currentId && config.mode() === 'editNew') {
      const response = await config.storiesService.saveDraft(data as EditStory);
      return response.story.id;
    }

    if (currentId) {
      await config.storiesService.saveDraft(data as EditStory, currentId);
    }

    return null;
  }

  private shouldSave(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;

    const obj = data as Record<string, unknown>;
    return Object.values(obj).some(value =>
      typeof value === 'string' && value.trim().length > 0
    );
  }
}