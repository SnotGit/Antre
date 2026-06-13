import { Component, inject, signal, computed, effect, resource, linkedSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { DialogCardService } from '@shared/services/dialog/dialog-card.service';
import { VaultCategory } from '../../models/terraformars.models';
import { TerraformarsCrudService } from '../../services/terraformars-crud.service';
import { TerraformarsTreeService } from '../../services/terraformars-tree.service';
import { TerraformarsSelectionService } from '../../services/terraformars-selection.service';
import { TerraformarsFeedbackService } from '../../services/terraformars-feedback.service';
import { TerraformarsItemEditService } from '../../services/terraformars-item-edit.service';
import { AuthService } from '@shared/services/auth/auth.service';

@Component({
  selector: 'app-terraformars-vault',
  imports: [FormsModule, RouterOutlet],
  templateUrl: './terraformars-vault.html',
  styleUrl: './terraformars-vault.scss'
})
export class TerraformarsVault {

  //========== INJECTIONS ==========//

  private readonly router = inject(Router);
  private readonly crud = inject(TerraformarsCrudService);
  private readonly dialogCard = inject(DialogCardService);
  private readonly authService = inject(AuthService);
  protected readonly tree = inject(TerraformarsTreeService);
  protected readonly selection = inject(TerraformarsSelectionService);
  protected readonly opFeedback = inject(TerraformarsFeedbackService);
  private readonly itemEdit = inject(TerraformarsItemEditService);

  //========== SIGNALS ==========//

  isAdmin = this.authService.isAdmin;
  categoryTitle = signal('');
  createError = signal(false);
  duplicateError = signal(false);

  private readonly routeItemPath = computed<VaultCategory[]>(() => {
    const cats = this.tree.categories();
    const path: VaultCategory[] = [];
    let cat = cats.find(c => c.id === this.tree.currentCategoryId()) ?? null;
    while (cat) {
      path.unshift(cat);
      const parentId = cat.parentId;
      cat = parentId === null ? null : cats.find(c => c.id === parentId) ?? null;
    }
    return path;
  });

  itemPath = linkedSignal(() => this.routeItemPath());

  //========== COMPUTED ==========//

  canCreate = computed(() => this.categoryTitle().trim().length > 0);

  private readonly currentCategory = computed(() => {
    const id = this.tree.currentCategoryId();
    if (id === null) return null;
    return this.tree.categories().find(c => c.id === id) ?? null;
  });

  protected readonly isLeaf = computed(() => {
    const current = this.currentCategory();
    return current !== null && current.entryCount > 0;
  });

  private readonly itemCatsResource = resource({
    params: () => ({ tick: this.tree.categories() }),
    loader: () => this.crud.getAllCategories()
  });

  private readonly itemCats = computed(() => this.itemCatsResource.value() ?? []);

  protected readonly itemLevels = computed(() => {
    const cats = this.itemCats();
    const path = this.itemPath();
    const levels: VaultCategory[][] = [];
    let parentId: number | null = null;

    for (let i = 0; ; i++) {
      const options = cats.filter(c => c.parentId === parentId);
      if (options.length === 0) break;
      levels.push(options);
      const selected = path[i];
      if (!selected) break;
      parentId = selected.id;
    }

    return levels;
  });

  protected readonly itemSlots = computed(() => {
    const slots: (VaultCategory[] | null)[] = [...this.itemLevels()];
    while (slots.length < 2) {
      slots.push(null);
    }
    return slots;
  });

  protected readonly itemTarget = computed(() => {
    const path = this.itemPath();
    return path.length > 0 ? path[path.length - 1] : null;
  });

  protected readonly canCreateItemNow = computed(() => {
    const target = this.itemTarget();
    if (!target) return false;
    return !this.itemCats().some(c => c.parentId === target.id);
  });

  protected readonly showCategoryForm = computed(() => {
    if (this.isLeaf()) return false;
    return true;
  });

  private readonly listDetailMode = computed(() => {
    const current = this.currentCategory();
    if (current === null) return false;
    const hasChildren = this.tree.categories().some(c => c.parentId === current.id);
    if (hasChildren) return false;
    return current.entryCount > 0 || this.itemEdit.creating() || this.itemEdit.isEditing() !== null;
  });

  protected readonly hideColumn = computed(() => this.listDetailMode());

  protected readonly deleteQuestion = computed(() =>
    this.selection.count() === 1
      ? 'Êtes-vous sûr de vouloir supprimer la catégorie sélectionnée ?'
      : 'Êtes-vous sûr de vouloir supprimer les catégories sélectionnées ?'
  );

  protected readonly deleteWarning =
    'Cette action est irréversible : toutes les sous-catégories et tous les items contenus seront également supprimés.';

  //========== EFFECTS ==========//

  private readonly _clearOnNavigate = effect(() => {
    this.tree.currentUrl();
    this.selection.clear();
  });

  //========== CREATE CATEGORY ==========//

  async createCategory(): Promise<void> {
    const title = this.categoryTitle().trim();
    if (!title) return;
    this.createError.set(false);
    this.duplicateError.set(false);

    const parentId = this.tree.currentCategoryId();
    const slug = this.tree.slugify(title);
    const duplicate = this.tree.categories()
      .filter(c => c.parentId === parentId)
      .some(c => this.tree.slugify(c.title) === slug);

    if (duplicate) {
      this.duplicateError.set(true);
      return;
    }

    try {
      await this.crud.createCategory(title, parentId);
      this.categoryTitle.set('');
      this.tree.reload();
    } catch {
      this.createError.set(true);
    }
  }

  //========== DELETE SELECTION ==========//

  async confirmDelete(): Promise<void> {
    const categoryIds = Array.from(this.selection.selectedCategories());
    if (categoryIds.length === 0) return;

    const confirmed = await this.dialogCard.showDialog({
      title: 'Suppression',
      message: this.deleteQuestion(),
      items: this.selection.names(),
      additionalInfo: this.deleteWarning,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await this.crud.deleteCategories(categoryIds);
      this.selection.clear();
      this.tree.reload();
      this.opFeedback.show('success', 'Suppression effectuée.');
    } catch {
      this.selection.clear();
      this.opFeedback.show('error', 'Échec de la suppression.');
    }
  }

  cancelDelete(): void {
    this.selection.clear();
  }

  //========== CREATE ITEM ==========//

  levelValue(level: number): number | null {
    return this.itemPath().at(level)?.id ?? null;
  }

  onLevelSelect(level: number, categoryId: number | null): void {
    if (categoryId === null) {
      this.itemPath.set(this.itemPath().slice(0, level));
      return;
    }
    const category = this.itemCats().find(c => c.id === categoryId);
    if (!category) return;
    this.itemPath.set([...this.itemPath().slice(0, level), category]);
  }

  async createItemGo(): Promise<void> {
    const target = this.itemTarget();
    if (!target || !this.canCreateItemNow()) return;

    await this.router.navigate(['/terraformars', this.tree.slugify(target.title)], {
      state: { categoryId: target.id }
    });
    this.itemEdit.startCreate();
  }
}
