import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChroniquesService } from '../../../core/services/chroniques.service';
import { TypingEffectService } from '../../../core/services/typing-effect.service';
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

  users = this.chroniquesService.users;
  loading = this.chroniquesService.loading;

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Les Chroniques de Mars',
    speed: 150,
    finalBlinks: 4
  });

  headerTitle = this.typingEffect.headerTitle;
  showCursor = this.typingEffect.showCursor;
  typingComplete = this.typingEffect.typingComplete;

  ngOnInit(): void {
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  navigateToStory(storyId: number): void {
    this.router.navigate(['/chroniques/story', storyId]);
  }
}