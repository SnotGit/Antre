import { Injectable, signal, effect } from '@angular/core';

interface AutoSaveConfig<T> {
  data: () => T;
  saveFunction: (data: T) => Promise<void>;
  delay?: number;
  shouldSave?: (data: T) => boolean;
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
      const shouldSave = config.shouldSave ? config.shouldSave(data) : this.defaultShouldSave(data);
      
      if (!shouldSave) return;

      state.update(s => ({ ...s, isSaving: true }));

      try {
        await config.saveFunction(data);
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
      const shouldSave = config.shouldSave ? config.shouldSave(data) : this.defaultShouldSave(data);
      
      if (shouldSave) {
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

  private defaultShouldSave(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    return Object.values(obj).some(value => 
      typeof value === 'string' && value.trim().length > 0
    );
  }
}