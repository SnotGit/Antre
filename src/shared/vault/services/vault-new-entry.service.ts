import { Service, inject, signal } from '@angular/core';
import { VaultContextService } from './vault-context.service';

@Service()
export class VaultNewEntryService {

  //======= INJECTIONS =======

  private readonly vaultContext = inject(VaultContextService);

  //======= SIGNALS =======

  private visible = signal(false);
  private categoryId = signal<number | null>(null);
  private _activeContext = signal('');
  private _refreshCounter = signal(0);
  private resolvePromise: (() => void) | null = null;

  isVisible = this.visible.asReadonly();
  contextCategoryId = this.categoryId.asReadonly();
  activeContext = this._activeContext.asReadonly();
  refreshCounter = this._refreshCounter.asReadonly();

  //======= METHODS =======

  setCategoryId(id: number): void {
    this.categoryId.set(id);
  }

  show(): Promise<void> {
    this._activeContext.set(this.vaultContext.contextKey());
    this.visible.set(true);

    return new Promise<void>((resolve) => {
      this.resolvePromise = resolve;
    });
  }

  close(): void {
    this.visible.set(false);
    this.categoryId.set(null);
    this._activeContext.set('');

    if (this.resolvePromise) {
      this.resolvePromise();
      this.resolvePromise = null;
    }
  }

  notifyCreated(): void {
    this._refreshCounter.update(c => c + 1);
  }
}
