import { Component, inject } from '@angular/core';
import { TypingEffectService } from '../../services/typing-effect.service';

@Component({
  selector: 'app-marsball',
  imports: [],
  templateUrl: './marsball.component.html',
  styleUrl: './marsball.component.scss'
})
export class MarsballComponent {
  private typingService = inject(TypingEffectService);


  private typingEffect = this.typingService.createTypingEffect({
    text: 'Marsball',
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
