import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface UserLatestStory {
  id: number;
  username: string;
  description: string;
  avatar: string | null;
  latestStory: {
    id: number;
    title: string;
    slug: string;
    publishedAt: string;
  };
}

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-card.html',
  styleUrl: './story-card.scss'
})
export class StoryCard {
  
  private router = inject(Router);

  user = input.required<UserLatestStory>();

  avatarUrl = computed(() => {
    const avatar = this.user().avatar;
    return avatar ? `http://localhost:3000${avatar}` : '';
  });

  hasAvatar = computed(() => !!this.user().avatar);

  clickCard(): void {
    this.router.navigate(['/chroniques/story', this.user().latestStory.slug]);
  }
}