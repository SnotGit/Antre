import { Component, OnInit, OnDestroy, inject, computed, resource, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { VaultCategory } from '@shared/vault/models/vault.models';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { AuthService } from '@features/auth/services/auth.service';
import { VaultCategoriesService } from '@shared/vault/services/vault-categories.service';

@Component({
  selector: 'app-rover',
  imports: [],
  templateUrl: './rover.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './rover.scss'
})
export class Rover implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly marsballStateService = inject(MarsballStateService);
  private readonly typingService = inject(TypingEffectService);
  private readonly titleResolver = inject(TitleResolver);
  private readonly authService = inject(AuthService);
  protected readonly vaultCategories = inject(VaultCategoriesService);

  //======= TYPING EFFECT =======

  private readonly title = 'Rover';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= SIGNALS =======

  isAdmin = this.authService.isAdmin;

  //======= STATE SERVICE =======

  selectedCategories = this.marsballStateService.selectedCategories;
  selection = this.marsballStateService.selection;

  //======= CONSTRUCTOR =======

  constructor() {
    this.vaultContext.setContext('rover');
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

  //======= NAVIGATION =======

  onCardClick(category: VaultCategory): void {
    if (this.selection()) return;

    const titleUrl = this.titleResolver.encodeTitle(category.title);
    this.router.navigate(['/marsball/rover', titleUrl], {
      state: {
        categoryId: category.id
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/marsball']);
  }
}
