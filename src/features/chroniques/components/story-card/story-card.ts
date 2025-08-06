import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadService, StoryCard } from '@features/chroniques/services/load.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-story-card',
  imports: [CommonModule],
  templateUrl: './story-card.html',
  styleUrl: './story-card.scss'
})
export class StoryCardComponent {
  
  //============ INJECTIONS ============

  private readonly loadService = inject(LoadService);
  private readonly API_URL = environment.apiUrl;

  //============ INPUTS & OUTPUTS ============
  
  story = input.required<StoryCard>();
  cardClick = output<StoryCard>();

  //============ COMPUTED ============

  username = computed(() => this.story().user.username);
  storyTitle = computed(() => this.story().title);
  storyDate = computed(() => this.story().publishDate);
  
  avatarUrl = computed(() => {
    const avatar = this.story().user.avatar;
    return avatar ? `url(${this.API_URL.replace('/api', '')}${avatar})` : '';
  });

  //============ ACTIONS ============

  onCardClick(): void {
    this.cardClick.emit(this.story());
  }
}