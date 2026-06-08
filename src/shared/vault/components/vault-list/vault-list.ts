import { Component, OnDestroy, inject, computed, resource, signal, effect, untracked, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { VaultNewEntryService } from '@shared/vault/services/vault-new-entry.service';
import { VaultEditEntryService } from '@shared/vault/services/vault-edit-entry.service';
import { VaultCategoriesService } from '@shared/vault/services/vault-categories.service';
import { CategoryWithChildren } from '@shared/vault/models/vault.models';
import { CategoryStateService } from '@features/marsball/services/category-state.service';
import { ConsoleStateService } from '@features/menus/services/console-state.service';
import { AuthService } from '@features/auth/services/auth.service';
import { ItemView } from '@shared/vault/components/item-view/item-view';

const SECTION_ROUTES: Record<string, string> = {
  marsball: '/marsball',
  bestiaire: '/marsball/bestiaire',
  rover: '/marsball/rover'
};

@Component({
  selector: 'app-vault-list',
  imports: [ItemView],
  templateUrl: './vault-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './vault-list.scss'
})
export class VaultList implements OnDestroy {

  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultDeleteService = inject(VaultDeleteService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly newEntryService = inject(VaultNewEntryService);
  private readonly categoryState = inject(CategoryStateService);
  private readonly consoleState = inject(ConsoleStateService);
  private readonly authService = inject(AuthService);
  private readonly editEntry = inject(VaultEditEntryService);
  protected readonly vaultCategories = inject(VaultCategoriesService);

  private readonly itemView = viewChild(ItemView);

  isAdmin = this.authService.isAdmin;
  itemOpen = signal(false);
  protected readonly editing = computed(() => this.editEntry.isEditing() !== null);

  private readonly section = computed(() => this.vaultCategories.activeSection());
  private readonly sectionRoute = computed(() => SECTION_ROUTES[this.section()] ?? '/marsball');
  protected readonly sectionLabel = computed(() => this.section().toUpperCase());

  private readonly categoryId = computed<number>(() => {
    this.vaultCategories.currentUrl();
    const fromState = history.state?.categoryId;
    if (fromState) return fromState;
    return this.vaultCategories.currentCategoryId() ?? 0;
  });

  private readonly _contextEffect = effect(() => {
    const section = this.section();
    if (section) {
      this.vaultContext.setContext(section);
    }
  });

  private readonly _guardEffect = effect(() => {
    if (this.vaultCategories.loading()) return;
    if (this.categoryId() === 0) {
      this.router.navigate([this.sectionRoute()]);
    }
  });

  private readonly categoryResource = resource({
    params: () => this.categoryId() || undefined,
    loader: async ({ params }) => {
      try {
        const data = await this.vaultGetService.getCategoryWithChildren(params as number);
        this.newEntryService.setCategoryId(data.category.id);
        return data;
      } catch {
        this.router.navigate([this.sectionRoute()]);
        return null;
      }
    }
  });

  categoryData = computed((): CategoryWithChildren | null => {
    return this.categoryResource.value() || null;
  });

  private readonly _deleteRequestEffect = effect(() => {
    this.consoleState.deleteRequested();
    untracked(() => this.handleDeleteRequest());
  });

  private readonly _refreshEffect = effect(() => {
    this.newEntryService.refreshCounter();
    this.categoryResource.reload();
  });

  private async handleDeleteRequest(): Promise<void> {
    const data = this.categoryData();
    if (!data) return;

    let deleted = false;
    if (this.categoryState.selectionItems()) {
      await this.categoryState.deleteSelectedItems(data.entries, this.vaultDeleteService);
      deleted = true;
    }
    if (this.categoryState.selectionCategories()) {
      await this.categoryState.deleteSelectedCategories(data.children, this.vaultDeleteService);
      deleted = true;
    }

    if (deleted) this.categoryResource.reload();
  }

  ngOnDestroy(): void {
    this.categoryState.clearAllSelections();
  }

  goToCategory(categoryId: number): void {
    const data = this.categoryData();
    if (!data) return;

    const category = data.children.find(c => c.id === categoryId);
    if (!category) return;

    this.router.navigate([this.sectionRoute(), category.title.toLowerCase().replace(/\s+/g, '-')], {
      state: { categoryId: category.id }
    });
  }

  toggleCategorySelection(categoryId: number): void {
    this.categoryState.toggleCategorySelection(categoryId);
  }

  isSelectedCategory(categoryId: number): boolean {
    return this.categoryState.selectedCategories().has(categoryId);
  }

  onItemOpenChange(open: boolean): void {
    this.itemOpen.set(open);
  }

  onEntriesChanged(): void {
    this.categoryResource.reload();
  }

  editOpen(): void {
    this.itemView()?.startEdit();
  }

  deleteOpen(): void {
    this.itemView()?.deleteItem();
  }

  cancelEdit(): void {
    this.itemView()?.cancelEdit();
  }

  saveEdit(): void {
    this.itemView()?.saveEdit();
  }
}
