import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingEffectService } from '../../services/typing-effect.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {

  //============ TYPING EFFECT ============

  private typingService = inject(TypingEffectService);

  private readonly title = 'Bienvenue Gros Têtard !';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;


  //============ LIFECYCLE ============

  ngOnInit(): void {
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
  }
}