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

    let previousTitle = '';
    let previousContent = '';
    let timeoutId: number | undefined;
    let isInitialized = false;

    const autoSaveEffect = effect((onCleanup) => {
      const currentData = config.data();
      const title = currentData.title || '';
      const content = currentData.content || '';
      
      // CORRECTION: Comparaison séparée title/content au lieu de JSON.stringify
      const titleChanged = title !== previousTitle;
      const contentChanged = content !== previousContent;
      const hasChanges = titleChanged || contentChanged;

      if (!isInitialized) {
        // CORRECTION: Initialisation sans déclencher de save
        previousTitle = title;
        previousContent = content;
        isInitialized = true;
        return;
      }

      if (hasChanges) {
        // Vérifier si les données ne sont pas vides
        if (title.trim().length > 0 || content.trim().length > 0) {
          previousTitle = title;
          previousContent = content;
          state.update(s => ({ ...s, hasUnsavedChanges: true }));

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          const delay = config.delay ?? 2000;
          timeoutId = window.setTimeout(async () => {
            await this.performSave(config, state);
          }, delay);
        } else {
          // Données vides, mettre à jour les valeurs précédentes sans sauvegarder
          previousTitle = title;
          previousContent = content;
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

      destroy: () => {
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