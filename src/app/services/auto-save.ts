import { Injectable, signal, effect, DestroyRef, inject } from '@angular/core';

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
  private destroyRef = inject(DestroyRef);
  private activeTimeouts = new Map<string, number>();

  createAutoSave<T>(config: AutoSaveConfig<T>) {
    const state = signal<AutoSaveState>({
      isSaving: false,
      lastSaveTime: null,
      hasUnsavedChanges: false
    });

    const instanceId = this.generateInstanceId();
    
    const autoSaveEffect = effect(() => {
      const data = config.data();
      const shouldSave = config.shouldSave ? config.shouldSave(data) : this.defaultShouldSave(data);
      
      if (shouldSave) {
        state.update(s => ({ ...s, hasUnsavedChanges: true }));
        this.scheduleAutoSave(instanceId, config, state);
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearTimeout(instanceId);
      autoSaveEffect.destroy();
    });

    return {
      state: state.asReadonly(),
      forceSave: () => this.executeSave(config, state),
      cleanup: () => this.clearTimeout(instanceId)
    };
  }

  private scheduleAutoSave<T>(
    instanceId: string, 
    config: AutoSaveConfig<T>, 
    state: ReturnType<typeof signal<AutoSaveState>>
  ): void {
    this.clearTimeout(instanceId);
    
    const delay = config.delay ?? 2000;
    const timeoutId = window.setTimeout(() => {
      this.executeSave(config, state);
    }, delay);
    
    this.activeTimeouts.set(instanceId, timeoutId);
  }

  private async executeSave<T>(
    config: AutoSaveConfig<T>, 
    state: ReturnType<typeof signal<AutoSaveState>>
  ): Promise<void> {
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
  }

  private defaultShouldSave(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    return Object.values(obj).some(value => 
      typeof value === 'string' && value.trim().length > 0
    );
  }

  private generateInstanceId(): string {
    return `autosave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private clearTimeout(instanceId: string): void {
    const timeoutId = this.activeTimeouts.get(instanceId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeTimeouts.delete(instanceId);
    }
  }
}