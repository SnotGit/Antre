import { Injectable, signal, computed } from '@angular/core';
import { VaultContextConfig, VAULT_CONTEXTS } from '../models/vault.models';

@Injectable({
  providedIn: 'root'
})
export class VaultContextService {

  //======= SIGNALS =======

  private _contextKey = signal<string>('marsball');

  //======= COMPUTED =======

  contextKey = this._contextKey.asReadonly();

  config = computed((): VaultContextConfig => {
    return VAULT_CONTEXTS[this._contextKey()] || VAULT_CONTEXTS['marsball'];
  });

  //======= METHODS =======

  setContext(key: string): void {
    this._contextKey.set(key);
  }
}
