import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-story-card',
  imports: [CommonModule],
  templateUrl: './story-card.html',
  styleUrl: './story-card.scss'
})
export class StoryCard {
  
  username = input<string>();
  storyTitle = input<string>('');
  storyDate = input<string>('');
  avatar = input<string>();

  cardClick = output<void>();

  hasAvatar = computed(() => !!this.avatar());
  avatarUrl = computed(() => {
    const avatar = this.avatar();
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  onCardClick(): void {
    this.cardClick.emit();
  }
}