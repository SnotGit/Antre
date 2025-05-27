import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChroniquesService } from '../../services/chroniques.service';
import { TypingEffectService } from '../../services/typing-effect.service';
import { StoryCardComponent } from './shared/story-card/story-card.component';

@Component({
  selector: 'app-chroniques',
  imports: [CommonModule, StoryCardComponent],
  templateUrl: './chroniques.component.html',
  styleUrl: './chroniques.component.scss'
})
export class ChroniquesComponent implements OnInit, OnDestroy {

  private router = inject(Router);
  private chroniquesService = inject(ChroniquesService);
  private typingService = inject(TypingEffectService);

  // ============ DONNÉES ============
  recentAuthors = this.chroniquesService.recentAuthors;
  loading = this.chroniquesService.loading;

  // ============ EFFET TYPING ============
  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
    speed: 150,
    cursorColor: '#b55a44',
    finalBlinks: 3
  });

  displayedTitle = this.typingEffect.displayedTitle;
  typingComplete = this.typingEffect.isComplete;
  showCursor = this.typingEffect.showCursor;

  ngOnInit(): void {
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  navigateToStory(storyId: number): void {
    this.router.navigate(['/chroniques/story', storyId]);
  }

  refreshAuthors(): void {
    this.chroniquesService.refresh();
  }
}