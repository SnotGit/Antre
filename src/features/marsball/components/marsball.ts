import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { MarsballGetService, MarsballCategory } from '@features/marsball/services/marsball-get.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

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
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Marsball';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

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
  }

  //======= NAVIGATION =======

  onCardClick(category: MarsballCategory): void {
    this.router.navigate(['/marsball', category.id]);
  }
}