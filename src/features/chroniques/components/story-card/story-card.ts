import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StoryData {
  username: string;
  avatar: string;
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
  
  story = input.required<StoryData>();
  cardClick = output<StoryData>();

  username = () => this.story().username;
  storyTitle = () => this.story().storyTitle;
  storyDate = () => this.story().storyDate;
  
  avatarUrl = () => {
    const avatar = this.story().avatar;
    return avatar ? `url(http://localhost:3000${avatar})` : '';
  };

  onCardClick(): void {
    this.cardClick.emit(this.story());
  }
}