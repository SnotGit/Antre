import { Component, OnInit, OnDestroy, inject, signal, computed, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { VaultCategory } from '@shared/vault/models/vault.models';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { VaultCategoriesService } from '@shared/vault/services/vault-categories.service';
import { VaultCreateService } from '@shared/vault/services/vault-create.service';
import { VaultDeleteService } from '@shared/vault/services/vault-delete.service';

@Component({
  selector: 'app-marsball-vault',
  imports: [FormsModule],
  templateUrl: './marsball-vault.html',
  styleUrl: './marsball-vault.scss'
})
export class MarsballVault implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly marsballStateService = inject(MarsballStateService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);
  private readonly titleResolver = inject(TitleResolver);
  protected readonly vaultCategories = inject(VaultCategoriesService);
  private readonly vaultCreate = inject(VaultCreateService);
  private readonly vaultDelete = inject(VaultDeleteService);

  //======= TYPING EFFECT =======

  private readonly title = 'Marsball';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  isAdmin = this.authService.isAdmin;
  categoryTitle = signal('');
  createError = signal(false);
  deleteError = signal(false);

  //======= STATE SERVICE =======

  selectedCategories = this.marsballStateService.selectedCategories;
  selection = this.marsballStateService.selection;

  //======= CONSTRUCTOR =======

  constructor() {
    this.vaultContext.setContext('marsball');
  }

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.vaultGetService.getRootCategories();
    }
  });

  categories = computed((): VaultCategory[] => {
    return this.categoriesResource.value() || [];
  });

  canCreate = computed(() => this.categoryTitle().trim().length > 0);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
    this.marsballStateService.clearSelection();
  }

  //======= SELECTION METHODS =======

  toggleSelection(categoryId: number): void {
    this.marsballStateService.toggleSelection(categoryId);
  }

  isSelected(categoryId: number): boolean {
    return this.selectedCategories().has(categoryId);
  }

  //======= CREATE CATEGORY =======

  async createCategory(): Promise<void> {
    if (!this.canCreate()) return;
    this.createError.set(false);
    try {
      await this.vaultCreate.createCategory(this.categoryTitle().trim(), null);
      this.categoryTitle.set('');
      this.categoriesResource.reload();
    } catch {
      this.createError.set(true);
    }
  }

  //======= DELETE CATEGORIES =======

  async confirmDelete(): Promise<void> {
    const ids = Array.from(this.selectedCategories());
    if (ids.length === 0) return;
    this.deleteError.set(false);
    try {
      await this.vaultDelete.deleteCategoriesConfirmed(ids);
      this.marsballStateService.clearSelection();
      this.categoriesResource.reload();
    } catch {
      this.deleteError.set(true);
    }
  }

  cancelDelete(): void {
    this.marsballStateService.clearSelection();
  }

  //======= NAVIGATION =======

  goToBestiaire(): void {
    this.router.navigate(['/marsball/bestiaire']);
  }

  goToRover(): void {
    this.router.navigate(['/marsball/rover']);
  }

  onCardClick(category: VaultCategory): void {
    if (this.selection()) return;
    
    const titleUrl = this.titleResolver.encodeTitle(category.title);
    this.router.navigate(['/marsball', titleUrl], {
      state: { 
        categoryId: category.id
      }
    });
  }
}