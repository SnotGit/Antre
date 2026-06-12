import { Component, OnInit, OnDestroy, ElementRef, signal, computed, inject, viewChild } from '@angular/core';
import { ElenaStateService } from '@features/elena/services/elena-state.service';
import { AuthService } from '@shared/services/auth/auth.service';

interface TerminalLine {
  content: string;
  type: 'command' | 'output' | 'error' | 'warning' | 'info' | 'data';
}

@Component({
  selector: 'app-terminal',
  imports: [],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class Terminal implements OnInit, OnDestroy {

  private readonly elenaState = inject(ElenaStateService);
  private readonly authService = inject(AuthService);

  private readonly terminalContent = viewChild<ElementRef>('terminalContent');

  terminalLines = signal<TerminalLine[]>([]);
  showCursor = signal(true);
  isTyping = signal(false);

  private readonly prompt = computed(() => {
    const user = this.authService.currentUser();
    return `${user?.playerId || user?.username || 'INCONNU'}:~$ `;
  });
  private cursorIntervalId?: number;
  private typingIntervalId?: number;
  private timeoutId?: number;

  private readonly elenaStartCommand = 'ELENA START';

  private readonly elenaStartOutputs = [
    '> Démarrage programme',
    '> Scan réseaux...',
    '> Transmission des données',
    '> Trouvé: 37 noeuds actifs',
    '> Mémoire: 27.3%',
    '> Charge ZPU: 23.1%',
    '> Anomalie détectée secteur 12',
    '> Diagnostique système: corrompu',
    '> Latence perdue: 1.09ms',
    '> Elena.SYS: mise en attente',
    '> Packages EXO: 1,247,382',
    '> Puissance: 2.21 GigoWatts'
  ];

  ngOnInit(): void {
    this.startCursorBlink();
    this.bootSequence();
  }

  ngOnDestroy(): void {
    if (this.cursorIntervalId) clearInterval(this.cursorIntervalId);
    if (this.typingIntervalId) clearInterval(this.typingIntervalId);
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private startCursorBlink(): void {
    this.cursorIntervalId = window.setInterval(() => {
      this.showCursor.update(v => !v);
    }, 500);
  }

  private bootSequence(): void {
    this.terminalLines.set([]);
    this.appendTypedLine('Initialisation...', 'output', () => {
      this.timeoutId = window.setTimeout(() => this.showPromptThenType(), 500);
    });
  }

  private showPromptThenType(): void {
    this.terminalLines.update(lines => [
      ...lines,
      { content: this.prompt(), type: 'command' }
    ]);
    this.scrollBottom();
    this.timeoutId = window.setTimeout(() => this.typeStartCommand(), 500);
  }

  private typeStartCommand(): void {
    this.isTyping.set(true);
    let i = 0;

    this.typingIntervalId = window.setInterval(() => {
      if (i < this.elenaStartCommand.length) {
        const partial = this.elenaStartCommand.substring(0, i + 1);
        this.terminalLines.update(lines => {
          const newLines = [...lines];
          newLines[newLines.length - 1] = {
            ...newLines[newLines.length - 1],
            content: this.prompt() + partial
          };
          return newLines;
        });
        i++;
        this.scrollBottom();
      } else {
        if (this.typingIntervalId) clearInterval(this.typingIntervalId);
        this.typingIntervalId = undefined;
        this.isTyping.set(false);
        this.elenaState.start();
        this.timeoutId = window.setTimeout(() => this.streamOutputs(0), 200);
      }
    }, 200);
  }

  private streamOutputs(index: number): void {
    if (index >= this.elenaStartOutputs.length) {
      this.timeoutId = window.setTimeout(() => {
        this.terminalLines.update(lines => [
          ...lines,
          { content: this.prompt(), type: 'command' }
        ]);
        this.scrollBottom();
      }, 200);
      return;
    }

    this.appendTypedLine(this.elenaStartOutputs[index], 'output', () => {
      this.timeoutId = window.setTimeout(() => this.streamOutputs(index + 1), 500);
    });
  }

  private appendTypedLine(content: string, type: TerminalLine['type'], onComplete: () => void, speed = 22): void {
    this.terminalLines.update(lines => {
      const newLines = [...lines, { content: '', type }];
      return newLines.length > 30 ? newLines.slice(-30) : newLines;
    });
    this.scrollBottom();

    this.isTyping.set(true);
    let i = 0;
    this.typingIntervalId = window.setInterval(() => {
      if (i < content.length) {
        i++;
        const partial = content.substring(0, i);
        this.terminalLines.update(lines => {
          const newLines = [...lines];
          newLines[newLines.length - 1] = { ...newLines[newLines.length - 1], content: partial };
          return newLines;
        });
        this.scrollBottom();
      } else {
        if (this.typingIntervalId) clearInterval(this.typingIntervalId);
        this.typingIntervalId = undefined;
        this.isTyping.set(false);
        onComplete();
      }
    }, speed);
  }

  private scrollBottom(): void {
    setTimeout(() => {
      const el = this.terminalContent()?.nativeElement;
      if (el) {
        const parent = el.parentElement;
        if (parent) parent.scrollTop = parent.scrollHeight;
      }
    }, 30);
  }
}
