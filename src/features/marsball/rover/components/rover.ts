import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { RoverGetService } from '../services/rover-get.service';
import { RoverCategory } from '../models/rover.models';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { TypingEffectService } from '@shared/services/typing-effect/typing-effect.service';
import { TitleResolver } from '@shared/services/resolvers/title-resolver.service';
import { AuthService } from '@features/auth/services/auth.service';

@Component({
  selector: 'app-rover',
  imports: [],
  templateUrl: './rover.html',
  styleUrl: './rover.scss'
})
export class Rover implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly roverGetService = inject(RoverGetService);
  private readonly marsballStateService = inject(MarsballStateService);
  private readonly typingService = inject(TypingEffectService);
  private readonly titleResolver = inject(TitleResolver);
  private readonly authService = inject(AuthService);

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

  //======= DATA LOADING =======

  private readonly categoriesResource = resource({
    loader: async () => {
      return await this.roverGetService.getRootCategories();
    }
  });

  categories = computed((): RoverCategory[] => {
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

  onCardClick(category: RoverCategory): void {
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