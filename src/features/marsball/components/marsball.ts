import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TypingEffectService } from '@shared/services/typing-effect.service';

export interface Category {
  id: number;
  title: string;
}

@Component({
  selector: 'app-marsball',
  imports: [],
  templateUrl: './marsball.html',
  styleUrl: './marsball.scss'
})
export class MarsballComponent implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly typingService = inject(TypingEffectService);
  
  //======= TYPING EFFECT =======

  private readonly title = 'Marsball';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA =======

  categories = signal<Category[]>([]);

  //======= LIFECYCLE =======

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= NAVIGATION =======

  onCategoryClick(category: Category): void {
    this.router.navigate(['/marsball', category.id], {
      state: { 
        categoryId: category.id,
        title: category.title
      }
    });
  }
}