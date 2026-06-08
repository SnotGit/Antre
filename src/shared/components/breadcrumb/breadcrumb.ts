import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { VaultCategoriesService, BreadcrumbSegment } from '@shared/vault/services/vault-categories.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss'
})
export class Breadcrumb {

  private readonly router = inject(Router);
  private readonly vaultCategories = inject(VaultCategoriesService);

  categoryId = input<number | null>(null);

  segments = (): BreadcrumbSegment[] => this.vaultCategories.buildBreadcrumb(this.categoryId());

  navigate(seg: BreadcrumbSegment): void {
    if (!seg.route || seg.isCurrent) return;
    if (seg.state) {
      this.router.navigate([seg.route], { state: seg.state });
    } else {
      this.router.navigate([seg.route]);
    }
  }
}
