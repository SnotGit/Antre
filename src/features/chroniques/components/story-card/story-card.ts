import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';

import { StoryCard } from '@features/chroniques/models/chroniques.models';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-story-card',
  imports: [],
  templateUrl: './story-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './story-card.scss'
})
export class StoryCardComponent {
  
  //======= INJECTIONS =======

  private readonly API_URL = environment.apiUrl;

  //======= SIGNALS =======
  
  story = input.required<StoryCard>();
  cardClick = output<StoryCard>();

  //======= COMPUTED =======

  username = computed(() => this.story().user.username);
  
  storyTitle = computed(() => this.story().title);
  
  storyDate = computed(() => this.story().publishDate);
  
  avatarUrl = computed(() => {
    const avatar = this.story().user.avatar;
    
    if (!avatar) {
      return '';
    }
    
    let baseUrl = this.API_URL.replace('/api', '');
    
    if (baseUrl.endsWith('/') && avatar.startsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const fullUrl = `${baseUrl}${avatar}`;
    
    return `url('${fullUrl}')`;
  });

  //======= FALLBACK AVATAR =======

  onAvatarError(event: Event): void {
    const target = event.target as HTMLElement;
    target.style.backgroundImage = '';
    target.style.backgroundColor = '#5d889e';
  }

  //======= ACTIONS =======

  onCardClick(): void {
    this.cardClick.emit(this.story());
  }
}