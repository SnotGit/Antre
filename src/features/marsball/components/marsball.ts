import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { VaultGetService } from '@shared/vault/services/vault-get.service';
import { VaultContextService } from '@shared/vault/services/vault-context.service';
import { VaultCategory } from '@shared/vault/models/vault.models';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { AuthService } from '@features/auth/services/auth.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';

@Component({
  selector: 'app-marsball',
  imports: [],
  templateUrl: './marsball.html',
  styleUrl: './marsball.scss'
})
export class Marsball implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly vaultGetService = inject(VaultGetService);
  private readonly vaultContext = inject(VaultContextService);
  private readonly marsballStateService = inject(MarsballStateService);
  private readonly typingService = inject(TypingEffectService);
  private readonly authService = inject(AuthService);
  private readonly titleResolver = inject(TitleResolver);

  //======= TYPING EFFECT =======

  private readonly title = 'Marsball';

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