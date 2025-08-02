import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingEffectService } from '../../../shared/services/typing-effect.service';
@Component({
  selector: 'app-marsball',
  imports: [CommonModule],
  templateUrl: './marsball.html',
  styleUrl: './marsball.scss'
})
export class MarsballComponent implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private typingService = inject(TypingEffectService);
  
  //============ TYPING EFFECT ============

  private readonly title = 'Marsball';

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