import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal, ChangeDetectionStrategy } from '@angular/core';

interface TerminalLine {
  content: string;
  type: 'command' | 'output' | 'error' | 'warning' | 'info' | 'data';
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Terminal implements OnInit, OnDestroy {
  @ViewChild('terminalContent') terminalContent!: ElementRef;

  //============ SIGNALS ============

  terminalLines = signal<TerminalLine[]>([]);
  currentMode = signal<'NETWORK' | 'METEO'>('NETWORK');
  showCursor = signal(true);
  currentCommand = signal('');
  isTyping = signal(false);

  //============ CONSTANTES ============

  private readonly prompt = '141050:~$ ';
  private intervalId?: number;
  private cursorIntervalId?: number;
  private typingIntervalId?: number;
  private currentDataIndex = 0;
  private switchTimeoutId?: number;

  private readonly networkData = [
    '> Scan réseaux...',
    '> Transmission des données',
    '> Trouvé: 37 noeuds actifs',
    '> Latence réseau: 127ms',
    '> Mémoire: 27.3%',
    '> Charge CPU: 23.1%',
    '> Anomalie détectée secteur 12',
    '> Packets de data: 1,247,382',   
    '> Diagnostique système: opérationnel'
  ];

  private readonly weatherData = [
    '> SOL 2086 - DAY 3837',
    '> Température: -73°C / -45°C',
    '> Vent: 25 km/h NE', 
    '> Pression: 610 Pa',
    '> Opacité externe: 0.8',
    '> Index UV: 0.3',
    '> Humidité: <1%',
    '> Visibilité: 8.2 km'
  ];

  //============ LIFECYCLE ============

  ngOnInit() {
    this.initializeTerminal();
    this.startCursorBlink();
  }

  ngOnDestroy() {
    this.clearAllIntervals();
  }

  //============ PRIVATE METHODS ============

  private clearAllIntervals() {
    [this.intervalId, this.cursorIntervalId, this.typingIntervalId, this.switchTimeoutId]
      .forEach(id => id && clearInterval(id));
  }

  private initializeTerminal() {
    this.terminalLines.set([
      { content: 'Initialisation connexion...', type: 'output' },
    ]);
    
    setTimeout(() => this.showPromptAndWait(), 1000);
  }

  private startCursorBlink() {
    this.cursorIntervalId = window.setInterval(() => {
      this.showCursor.update(show => !show);
    }, 500);
  }

  private showPromptAndWait() {
    this.terminalLines.update(lines => [
      ...lines,
      { content: this.prompt, type: 'command' }
    ]);
    
    this.scrollToBottom();
    this.switchTimeoutId = window.setTimeout(() => this.startTypingCommand(), 2000);
  }

  private startTypingCommand() {
    this.isTyping.set(true);
    this.currentCommand.set('');
    
    const targetCommand = this.currentMode();
    let charIndex = 0;

    this.typingIntervalId = window.setInterval(() => {
      if (charIndex < targetCommand.length) {
        const newCommand = targetCommand.substring(0, charIndex + 1);
        this.currentCommand.set(newCommand);
        
        this.terminalLines.update(lines => {
          const newLines = [...lines];
          newLines[newLines.length - 1] = {
            ...newLines[newLines.length - 1],
            content: this.prompt + newCommand
          };
          return newLines;
        });
        
        charIndex++;
        this.scrollToBottom();
      } else {
        clearInterval(this.typingIntervalId!);
        this.typingIntervalId = undefined;
        this.isTyping.set(false);
        
        this.switchTimeoutId = window.setTimeout(() => this.validateCommand(), 1000);
      }
    }, 400);
  }

  private validateCommand() {
    this.currentDataIndex = 0;
    this.startDataStream();
  }

  private startDataStream() {
    this.intervalId = window.setInterval(() => this.addDataLine(), 2000);
  }

  private addDataLine() {
    const currentData = this.currentMode() === 'NETWORK' ? this.networkData : this.weatherData;
    
    if (this.currentDataIndex >= currentData.length) {
      this.finishCurrentMode();
      return;
    }

    const lineType: TerminalLine['type'] = this.currentMode() === 'METEO' ? 'data' : 'output';

    this.terminalLines.update(lines => {
      const newLines: TerminalLine[] = [
        ...lines,
        {
          content: currentData[this.currentDataIndex],
          type: lineType
        }
      ];
      
      return newLines.length > 20 ? newLines.slice(-20) : newLines;
    });

    this.currentDataIndex++;
    this.scrollToBottom();

    if (this.currentDataIndex >= currentData.length) {
      this.finishCurrentMode();
    }
  }

  private finishCurrentMode() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    this.switchTimeoutId = window.setTimeout(() => this.switchToNextMode(), 3000);
  }

  private switchToNextMode() {
    this.currentMode.update(mode => mode === 'NETWORK' ? 'METEO' : 'NETWORK');
    
    this.terminalLines.update(lines => [...lines, { content: '', type: 'output' }]);
    
    this.switchTimeoutId = window.setTimeout(() => this.showPromptAndWait(), 1000);
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.terminalContent?.nativeElement) {
        const element = this.terminalContent.nativeElement.parentElement;
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }
    }, 50);
  }
}