import { Component, inject, computed, signal, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';
import { InstructionsService } from '@features/home/services/instructions.service';
import { pickElenaLine, ElenaLine } from '@features/elena/data/elena-quotes';

@Component({
  selector: 'app-home-infos',
  templateUrl: './home-infos.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home-infos.scss'
})
export class HomeInfos {

  private readonly auth = inject(AuthService);
  protected readonly instructions = inject(InstructionsService);

  protected readonly displayName = computed(() => this.auth.currentUser()?.username ?? 'Visiteur');

  protected readonly quote = signal<ElenaLine | null>(null);

  private readonly rollQuote = effect(() => {
    if (!this.instructions.visible()) {
      untracked(() => this.quote.set(pickElenaLine()));
    }
  });
}
