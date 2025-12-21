import { Injectable, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballStateService } from '@features/marsball/services/marsball-state.service';
import { CategoryStateService } from '@features/marsball/services/category-state.service';

@Injectable({
  providedIn: 'root'
})
export class ConsoleStateService {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly marsballState = inject(MarsballStateService);
  private readonly categoryState = inject(CategoryStateService);

  //======= SIGNALS =======

  private deleteRequestedSignal = signal<void>(undefined, { equal: () => false });

  //======= COMPUTED =======

  deleteRequested = this.deleteRequestedSignal.asReadonly();

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

  private isInBestiaireCategory(): boolean {
    const url = this.router.url;
    return url.includes('/marsball/bestiaire/') && 
           url !== '/marsball/bestiaire';
  }

  private isInRoverCategory(): boolean {
    const url = this.router.url;
    return url.includes('/marsball/rover/') && 
           url !== '/marsball/rover';
  }

  //======= COMPUTED - SELECTION =======

  hasSelection = computed(() => {
    if (this.isInMarsballRoot()) {
      return this.marsballState.selection();
    }
    if (this.isInMarsballCategory() || this.isInBestiaireCategory() || this.isInRoverCategory()) {
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

  requestDelete(): void {
    this.deleteRequestedSignal.set(undefined);
  }
}