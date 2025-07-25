import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TypingEffectService } from '../../services/typing-effect.service';


@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  private router = inject(Router);
  private typingService = inject(TypingEffectService);


  private typingEffect = this.typingService.createTypingEffect({
    text: 'Bienvenue dans l antre',
  });

  headerTitle = this.typingEffect.headerTitle;
  showCursor = this.typingEffect.showCursor;
  typing = this.typingEffect.typingComplete;


  ngOnInit(): void {
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }
}