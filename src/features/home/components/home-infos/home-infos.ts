import { Component, inject, signal, effect, untracked } from '@angular/core';
import { AuthService } from '@shared/services/auth/auth.service';
import { InstructionsService } from '@features/home/services/instructions.service';
import { ElenaStateService } from '@features/elena/services/elena-state.service';
import { pickElenaLine, ElenaLine } from '@features/elena/data/elena-quotes';
import { pickElenaGreeting } from '@features/elena/data/elena-greetings';

@Component({
  selector: 'app-home-infos',
  templateUrl: './home-infos.html',
  styleUrl: './home-infos.scss'
})
export class HomeInfos {

  private readonly auth = inject(AuthService);
  protected readonly instructions = inject(InstructionsService);
  private readonly elenaState = inject(ElenaStateService);

  protected readonly quote = signal<ElenaLine | null>(null);

  private readonly rollQuote = effect(() => {
    if (!this.instructions.visible()) {
      untracked(() => {
        const name = this.auth.currentUser()?.username ?? null;
        this.quote.set(this.elenaState.shouldGreet(name) ? pickElenaGreeting(name) : pickElenaLine());
      });
    }
  });
}
