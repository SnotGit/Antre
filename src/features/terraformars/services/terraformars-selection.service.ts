import { Service, signal, computed } from '@angular/core';

@Service()
export class TerraformarsSelectionService {

  //========== SIGNALS ==========//

  private readonly _categories = signal<Map<number, string>>(new Map());

  //========== COMPUTED ==========//

  readonly selectedCategories = computed(() => new Set(this._categories().keys()));
  readonly count = computed(() => this._categories().size);
  readonly hasSelection = computed(() => this.count() > 0);
  readonly names = computed(() => [...this._categories().values()]);

  //========== METHODS ==========//

  toggleCategory(id: number, title: string): void {
    const current = new Map(this._categories());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.set(id, title);
    }
    this._categories.set(current);
  }

  clear(): void {
    this._categories.set(new Map());
  }
}
