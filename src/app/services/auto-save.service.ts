import { Injectable, signal, effect, Signal, WritableSignal, inject, Injector } from '@angular/core';

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
    let firstRun = true;

    const autoSaveEffect = effect(() => {
      const currentData = JSON.stringify(config.data());
      
      // Ignorer la première exécution (valeur initiale)
      if (firstRun) {
        previousData = currentData;
        firstRun = false;
        return;
      }

      // Vérifier si les données ont vraiment changé
      if (currentData !== previousData) {
        previousData = currentData;
        state.update(s => ({ ...s, hasUnsavedChanges: true }));

        // Annuler le timeout précédent s'il existe
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Planifier la sauvegarde après le délai
        const delay = config.delay ?? 2000;
        timeoutId = window.setTimeout(async () => {
          await this.saving(config, state);
        }, delay);
      }
    }, { injector: this.injector });

    return {
      state: state.asReadonly(),

      forceSave: async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        await this.saving(config, state);
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

  private async saving(
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
    }
  }
}