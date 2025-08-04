import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LoadService, Draft } from '@features/chroniques/services/load.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';

//======= INTERFACE FOR TEMPLATE =======

interface DraftCardData {
  id: number;
  title: string;
  date: string;
}

@Component({
  selector: 'app-draft-list',
  imports: [CommonModule],
  templateUrl: './draft-list.html',
  styleUrl: './draft-list.scss'
})
export class DraftList implements OnInit, OnDestroy {

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loadService = inject(LoadService);
  private readonly typingService = inject(TypingEffectService);

  //============ TYPING EFFECT ============

  private readonly title = 'Brouillons';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //============ DATA LOADING ============

  private readonly draftsResource = resource({
    loader: async () => {
      return await this.loadService.getDrafts();
    }
  });

  draftCards = computed((): DraftCardData[] => {
    const drafts = this.draftsResource.value() || [];
    return drafts.map(draft => ({
      id: draft.id,
      title: draft.title,
      date: this.formatDate(draft.lastModified)
    }));
  });

  //============ LIFECYCLE ============

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //============ ACTIONS ============

  onDraftCardClick(draft: DraftCardData): void {
    this.router.navigate(['/chroniques/mes-histoires/brouillon/edition', draft.title]);
  }

  //============ UTILS ============

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}