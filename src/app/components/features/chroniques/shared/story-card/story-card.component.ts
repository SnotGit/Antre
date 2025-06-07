import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface StoryCardData {
  id: number;
  avatar: string;
  username: string;
  userDescription: string;
  storyTitle: string;
  publishedAt: string;
}

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-card.component.html',
  styleUrl: './story-card.component.scss'
})
export class StoryCardComponent {
  
  private router = inject(Router);

  // ============ INPUT ============
  story = input.required<StoryCardData>();

  // ============ COMPUTED ============
  avatarUrl = computed(() => {
    const avatar = this.story().avatar;
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  hasAvatar = computed(() => !!this.story().avatar);

  // ============ NAVIGATION ============
  clickCard(): void {
    this.router.navigate(['/chroniques/story', this.story().id]);
  }
}