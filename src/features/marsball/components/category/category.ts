import { Component, OnInit, OnDestroy, inject, resource, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MarsballService, CategoryWithLists } from '../../services/marsball.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-category',
  imports: [CommonModule],
  templateUrl: './category.html',
  styleUrl: './category.scss'
})
export class CategoryComponent implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly marsballService = inject(MarsballService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ RESOURCES ============

  category = resource<{ categoryId: number | null }, CategoryWithLists>({
    request: () => {
      const id = this.route.snapshot.paramMap.get('categoryId');
      return { categoryId: id ? parseInt(id) : null };
    },
    loader: async ({ request }) => {
      if (!request.categoryId) {
        throw new Error('Category ID manquant');
      }
      return await firstValueFrom(this.marsballService.getCategoryWithLists(request.categoryId));
    }
  });

  //============ EFFECTS ============

  private titleEffect = effect(() => {
    const category = this.category.value();
    if (category) {
      this.typingService.title(`> ${category.title}`);
    }
  });

  //============ LIFECYCLE ============

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //============ NAVIGATION ============

  goToList(listId: number): void {
    const categoryId = this.route.snapshot.paramMap.get('categoryId');
    if (categoryId) {
      this.router.navigate(['/marsball', categoryId, listId]);
    }
  }
}