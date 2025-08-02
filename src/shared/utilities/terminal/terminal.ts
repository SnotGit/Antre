// console-panel-2.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

interface TerminalLine {
  content: string;
  type: 'command' | 'output' | 'error' | 'warning' | 'info' | 'data';
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss'
})
export class Terminal implements OnInit, OnDestroy {
  @ViewChild('terminalContent') terminalContent!: ElementRef;

  terminalLines: TerminalLine[] = [];
  currentMode: 'NETWORK' | 'METEO' = 'NETWORK';
  prompt = '141050:~$ ';
  showCursor = true;
  currentCommand = ''; // Pour l'effet de typing
  isTyping = false;
  
  private intervalId?: number;
  private cursorIntervalId?: number;
  private typingIntervalId?: number;
  private currentDataIndex = 0;
  private switchTimeoutId?: number;

  // Données pour le mode NETWORK
  private networkData = [
    '> Scan réseaux...',
    '> Trouvé: 37 noeuds actifs',
    '> Latence réseau: 127ms',
    '> Mémoire: 27.3%',
    '> Charge CPU: 23.1%',
    '> Anomalie détectée secteur 12',
    '> Data packets: 1,247,382',
    '> Etablissement connexion sécurisée...',
    '> Authentication: SUCCESS',
    '> Diagnostique système: EN COURS...',
    '> Oxygen disponible: 79%',
    '> Capteurs température: ONLINE',
    '> Grilles terraformation: STABLE',
    '> Support de vie: NOMINAL',
    '> Biomasse: CONTROLLED',
    '> Stabilité fluide: OPTIMAL',
    '> Necronexus: 1099Kw',
    '> Pylones défence: ONLINE'
  ];

  // Données pour le mode WEATHER (SOL)
  private weatherData = [
    '> SOL 2086 - DAY 3837',
    '> Température: -73°C / -45°C',
    '> Vent: 25 km/h NE', 
    '> Pression: 610 Pa',
    '> Opacité externe: 0.8',
    '> Index UV: 0.3',
    '> Humidité: <1%',
    '> Visibilité: 8.2 km',
    '> Probabilité tempête: 12%',
    '> Radiation solaire: 589 W/m²',
    '> CO₂ atmosphère: 95.3%',
    '> Sol gelé: Détecté'
  ];

  ngOnInit() {
    this.initializeTerminal();
    this.startCursorBlink();
  }

  ngOnDestroy() {
    this.clearAllIntervals();
  }

  private clearAllIntervals() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.cursorIntervalId) {
      clearInterval(this.cursorIntervalId);
      this.cursorIntervalId = undefined;
    }
    if (this.typingIntervalId) {
      clearInterval(this.typingIntervalId);
      this.typingIntervalId = undefined;
    }
    if (this.switchTimeoutId) {
      clearTimeout(this.switchTimeoutId);
      this.switchTimeoutId = undefined;
    }
  }

  private initializeTerminal() {
    this.terminalLines = [
      { content: 'Initialisation connexion...', type: 'output' },
      { content: 'Transmission des données', type: 'output' }
    ];
    
    // Affiche le prompt immédiatement (sans délai)
    this.showPromptAndWait();
  }

  private startCursorBlink() {
    this.cursorIntervalId = window.setInterval(() => {
      this.showCursor = !this.showCursor;
    }, 500);
  }

  private showPromptAndWait() {
    // Ajoute le prompt immédiatement (sans attendre)
    this.terminalLines.push({
      content: this.prompt,
      type: 'command'
    });
    
    this.scrollToBottom();
    
    // Attend 2 secondes avant de commencer le typing de NETWORK/WEATHER
    this.switchTimeoutId = window.setTimeout(() => {
      this.startTypingCommand();
    }, 2000);
  }

  private startTypingCommand() {
    this.isTyping = true;
    this.currentCommand = '';
    
    const targetCommand = this.currentMode;
    let charIndex = 0;

    this.typingIntervalId = window.setInterval(() => {
      if (charIndex < targetCommand.length) {
        this.currentCommand += targetCommand[charIndex];
        // Met à jour la dernière ligne
        this.terminalLines[this.terminalLines.length - 1].content = this.prompt + this.currentCommand;
        charIndex++;
        this.scrollToBottom();
      } else {
        // Typing terminé
        if (this.typingIntervalId) {
          clearInterval(this.typingIntervalId);
          this.typingIntervalId = undefined;
        }
        this.isTyping = false;
        
        // Simule l'appui sur Entrée après 1 seconde
        this.switchTimeoutId = window.setTimeout(() => {
          this.validateCommand();
        }, 1000);
      }
    }, 400); // Vitesse réaliste : 400ms par caractère
  }

  private validateCommand() {
    // "Valide" la commande (pas de changement visuel, juste continue)
    this.currentDataIndex = 0;
    this.startDataStream();
  }

  private startDataStream() {
    this.intervalId = window.setInterval(() => {
      this.addDataLine();
    }, 2000);
  }

  private addDataLine() {
    const currentData = this.currentMode === 'NETWORK' ? this.networkData : this.weatherData;
    
    // Vérifie qu'on n'a pas dépassé les données disponibles
    if (this.currentDataIndex >= currentData.length) {
      this.finishCurrentMode();
      return;
    }

    // Ajoute la nouvelle ligne de données
    this.terminalLines.push({
      content: currentData[this.currentDataIndex],
      type: this.currentMode === 'METEO' ? 'data' : 'output'
    });

    this.currentDataIndex++;

    // Limite le nombre de lignes affichées
    if (this.terminalLines.length > 20) {
      this.terminalLines = this.terminalLines.slice(-20);
    }

    this.scrollToBottom();

    // Vérifie si on a fini le dataset actuel
    if (this.currentDataIndex >= currentData.length) {
      this.finishCurrentMode();
    }
  }

  private finishCurrentMode() {
    // Arrête le stream actuel
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    
    // Programme le switch vers l'autre mode
    this.switchTimeoutId = window.setTimeout(() => {
      this.switchToNextMode();
    }, 3000);
  }

  private switchToNextMode() {
    // Switch le mode
    this.currentMode = this.currentMode === 'NETWORK' ? 'METEO' : 'NETWORK';
    
    // Ajoute une ligne vide pour séparer
    this.terminalLines.push({
      content: '',
      type: 'output'
    });
    
    // Commence directement avec le nouveau prompt et typing
    this.switchTimeoutId = window.setTimeout(() => {
      this.showPromptAndWait();
    }, 1000);
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

  // Méthodes publiques pour contrôles manuels
  switchMode(mode: 'NETWORK' | 'METEO') {
    this.clearAllIntervals();
    this.currentMode = mode;
    this.showPromptAndWait();
  }

  clearTerminal() {
    this.clearAllIntervals();
    this.terminalLines = [
      { content: 'Terminal cleared', type: 'info' }
    ];
    this.currentDataIndex = 0;
    this.currentCommand = '';
  }
}