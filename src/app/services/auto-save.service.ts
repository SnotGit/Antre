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

  autoSave(config: AutoSave) {
    const injector = inject(Injector);
    
    const state = signal<AutoSaveState>({
      isSaving: false,
      lastSaveTime: null,
      hasUnsavedChanges: false
    });

    let previousData = '';
    let timeoutId: number | undefined;

    const autoSaveEffect = effect(() => {
      const currentData = JSON.stringify(config.data());
      
      if (previousData === '') {
        previousData = currentData;
        return;
      }

      if (currentData !== previousData) {
        previousData = currentData;
        state.update(s => ({ ...s, hasUnsavedChanges: true }));

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const delay = config.delay ?? 2000;
        timeoutId = window.setTimeout(async () => {
          await this.saving(config, state);
        }, delay);
      }
    }, { injector });

    return {
      state: state.asReadonly(),

      forceSave: async () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        await this.saving(config, state);
      },

      cleanup: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        autoSaveEffect.destroy();
      }
    };
  }

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