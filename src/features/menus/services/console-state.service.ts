import { Injectable, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { MarsballCategoryStateService } from '@features/marsball/services/marsball-category-state.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleStateService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly marsballState = inject(MarsballStateService);
  private readonly categoryState = inject(MarsballCategoryStateService);

  //======= ROUTE DETECTION =======

  private isInMarsballRoot(): boolean {
    return this.router.url === '/marsball' || 
           this.router.url.includes('/marsball/bestiaire') || 
           this.router.url.includes('/marsball/rover');
  }

  private isInMarsballCategory(): boolean {
    const url = this.router.url;
    return url.includes('/marsball/') && 
           !url.includes('/bestiaire') && 
           !url.includes('/rover') &&
           url !== '/marsball';
  }

  //======= COMPUTED =======

  hasSelection = computed(() => {
    if (this.isInMarsballRoot()) {
      return this.marsballState.selection();
    }
    if (this.isInMarsballCategory()) {
      return this.categoryState.hasSelection();
    }
    return false;
  });

  //======= ACTIONS =======

  openCreateCategory(): void {
    this.marsballState.openCreateCategory();
  }

  openCreateItem(): void {
    this.marsballState.openCreateItem();
  }

  deleteSelection(data?: unknown): void {
    if (this.isInMarsballRoot()) {
      this.marsballState.deleteSelected(data as Array<{ id: number; title: string }>);
    } else if (this.isInMarsballCategory()) {
      if (this.categoryState.selectionItems()) {
        this.categoryState.deleteSelectedItems(data as Array<{ id: number; title: string }>);
      }
      if (this.categoryState.selectionCategories()) {
        this.categoryState.deleteSelectedCategories(data as Array<{ id: number; title: string }>);
      }
    }
  }
}