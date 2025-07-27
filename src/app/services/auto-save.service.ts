import { Injectable, signal, effect, Signal, WritableSignal, inject, Injector } from '@angular/core';

//============ INTERFACE SIMPLIFIÉE ============

interface AutoSave {
  data: Signal<{ title: string, content: string }>;
  onSave: () => Promise<void>;
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

  //============ INJECTION CONTEXT ============

  private readonly injector = inject(Injector);

  //============ AUTOSAVE FACTORY ============

  autoSave(config: AutoSave) {
    const state = signal<AutoSaveState>({
      isSaving: false,
      lastSaveTime: null,
      hasUnsavedChanges: false
    });

    let previousData = '';
    let timeoutId: number | undefined;
    let isInitialized = false;

    const autoSaveEffect = effect((onCleanup) => {
      const currentData = JSON.stringify(config.data());
      
      if (!isInitialized) {
        previousData = currentData;
        isInitialized = true;
        return;
      }

      if (currentData !== previousData) {
        const data = config.data();
        if (data.title.trim().length > 0 || data.content.trim().length > 0) {
          previousData = currentData;
          state.update(s => ({ ...s, hasUnsavedChanges: true }));

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          const delay = config.delay ?? 2000;
          timeoutId = window.setTimeout(async () => {
            await this.performSave(config, state);
          }, delay);
        }
      }

      onCleanup(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
      });
    }, { injector: this.injector });

    return {
      state: state.asReadonly(),

      forceSave: async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        await this.performSave(config, state);
      },

      cleanup: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        autoSaveEffect.destroy();
      }
    };
  }

  //============ PRIVATE SAVE ============

  private async performSave(
    config: AutoSave,
    state: WritableSignal<AutoSaveState>
  ): Promise<void> {
    if (state().isSaving) return;

    state.update(s => ({ ...s, isSaving: true }));

    try {
      await config.onSave();
      
      state.update(s => ({
        ...s,
        isSaving: false,
        lastSaveTime: new Date(),
        hasUnsavedChanges: false
      }));

    } catch (error) {
      state.update(s => ({ ...s, isSaving: false }));
      throw error;
    }
  }
}