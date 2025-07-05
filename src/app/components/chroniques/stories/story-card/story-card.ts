import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Public {
  username: string;
  avatar: string;
  storyTitle: string;
  storyDate: string;
}

interface Private {
  storyTitle: string;
  storyDate: string;
}

@Component({
  selector: 'app-story-card',
  imports: [CommonModule],
  templateUrl: './story-card.html',
  styleUrl: './story-card.scss'
})
export class StoryCard {
  
  public = input<Public>();
  private = input<Private>();

  cardClick = output<void>();

  avatarUrl = computed(() => {
    const avatar = this.public()?.avatar;
    return avatar ? `url(http://localhost:3000${avatar})` : '';
  });

  onCardClick(): void {
    this.cardClick.emit();
  }
}