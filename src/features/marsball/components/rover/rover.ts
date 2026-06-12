import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballTreeService } from '../../services/marsball-tree.service';
import { MarsballSelectionService } from '../../services/marsball-selection.service';
import { VaultCategory } from '../../models/marsball.models';
import { AuthService } from '@shared/services/auth/auth.service';

@Component({
  selector: 'app-rover',
  imports: [],
  templateUrl: './rover.html',
  styleUrl: './rover.scss'
})
export class Rover {

  //========== INJECTIONS ==========//

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  protected readonly tree = inject(MarsballTreeService);
  protected readonly selection = inject(MarsballSelectionService);

  //========== SIGNALS ==========//

  isAdmin = this.authService.isAdmin;

  //========== COMPUTED ==========//

  categories = computed((): VaultCategory[] =>
    this.tree.categories().filter(c => c.parentId === null)
  );

  //========== SELECTION ==========//

  toggleSelection(category: VaultCategory): void {
    this.selection.toggleCategory(category.id, category.title);
  }

  isSelected(categoryId: number): boolean {
    return this.selection.selectedCategories().has(categoryId);
  }

  //========== NAVIGATION ==========//

  onCardClick(category: VaultCategory): void {
    if (this.selection.hasSelection()) return;

    const titleUrl = this.tree.slugify(category.title);
    this.router.navigate(['/marsball/rover', titleUrl], {
      state: {
        categoryId: category.id
      }
    });
  }
}
