import { Component, OnInit, OnDestroy, inject, signal, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingEffectService } from '@shared/services/typing-effect.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  //============ TYPING EFFECT ============

  private readonly typingService = inject(TypingEffectService);

  private readonly title1 = "Salut à toi Gros Têtard !";
  private readonly title2 = "Bienvenue dans l'Antre";

  private currentTitle = signal<string>('');

  private titleEffect: EffectRef = effect(() => {
    const title = this.currentTitle();
    if (title) {
      this.typingService.title(title);
    }
  });

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ STATE MANAGEMENT ============

  showTitle1 = true;
  showTitle2 = false;
  fadeOutTitle1 = false;

  //============ LIFECYCLE ============

  ngOnInit(): void {
    this.currentTitle.set(this.title1);
    
    setTimeout(() => {
      this.fadeOutTitle1 = true;
      
      setTimeout(() => {
        this.showTitle1 = false;
        this.showTitle2 = true;
        this.currentTitle.set(this.title2);
      }, 600);
    }, 5000);
  }

  ngOnDestroy(): void {
    this.titleEffect.destroy();
    this.typingService.destroy();
  }
}