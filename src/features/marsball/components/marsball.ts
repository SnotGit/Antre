import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballGetService } from '@features/marsball/services/marsball-get.service';
import { MarsballCategory } from '@features/marsball/models/marsball.models';
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
  private readonly marsballGetService = inject(MarsballGetService);
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

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.marsballGetService.getRootCategories();
    }
  });

  categories = computed((): MarsballCategory[] => {
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

  onCardClick(category: MarsballCategory): void {
    if (this.selection()) return;
    
    const titleUrl = this.titleResolver.encodeTitle(category.title);
    this.router.navigate(['/marsball', titleUrl], {
      state: { 
        categoryId: category.id
      }
    });
  }
}