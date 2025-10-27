import { Component, OnInit, OnDestroy, inject, computed, resource } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LikeService } from '@features/user/services/like.service';
import { TypingEffectService } from '@shared/utilities/typing-effect/typing-effect.service';

@Component({
  selector: 'app-my-likes',
  imports: [],
  templateUrl: './my-likes.html',
  styleUrl: './my-likes.scss'
})
export class MyLikes implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly likeService = inject(LikeService);
  private readonly typingService = inject(TypingEffectService);

  //======= TYPING EFFECT =======

  private readonly title = 'Mes Likes';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  //======= DATA LOADING =======

  private likesResource = resource({
    loader: async () => {
      try {
        const [receivedResponse, postedResponse] = await Promise.all([
          this.likeService.getReceivedLikesCount(),
          this.likeService.getPostedLikesCount()
        ]);
        
        return {
          receivedLikes: receivedResponse.receivedLikes,
          postedLikes: postedResponse.postedLikes
        };
      } catch (error) {
        return { receivedLikes: 0, postedLikes: 0 };
      }
    }
  });

  stats = computed(() => {
    const resourceValue = this.likesResource.value();
    
    if (this.likesResource.isLoading()) {
      return { receivedLikes: 0, postedLikes: 0 };
    }
    
    if (this.likesResource.error()) {
      return { receivedLikes: 0, postedLikes: 0 };
    }
    
    return resourceValue || { receivedLikes: 0, postedLikes: 0 };
  });

  //======= LIFECYCLE =======

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

  //======= NAVIGATION =======

  goToReceivedLikes(): void {
    this.router.navigate(['/mon-compte/mes-likes/recus']);
  }

  goToPostedLikes(): void {
    this.router.navigate(['/mon-compte/mes-likes/postes']);
  }

  goBack(): void {
    this.router.navigate(['/mon-compte']);
  }
}