import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/user/services/auth.service';
import { UserService } from '@features/user/services/user.service';
import { TypingEffectService } from '@shared/services/typing-effect.service';
import { UserStats } from '../user-stats/user-stats';
import { UserProfile } from '../user-profile/user-profile';
import { UserCredentials } from '../user-credentials/user-credentials';

type TabType = 'stats' | 'profile' | 'identifiants';

@Component({
  selector: 'app-user-account',
  imports: [UserStats, UserProfile, UserCredentials],
  templateUrl: './user-account.html',
  styleUrl: './user-account.scss'
})
export class UserAccount implements OnInit, OnDestroy {

  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly typingService = inject(TypingEffectService);

  //======= SIGNALS =======

  isLoggedIn = this.authService.isLoggedIn;
  error = this.userService.error;
  successMessage = this.userService.successMessage;
  activeTab = signal<TabType>('stats');

  //======= TYPING EFFECT =======

  private readonly title = 'Mon Compte';
  headerTitle = this.typingService.headerTitle;
  typing = this.typingService.typingComplete;



  //======= LIFECYCLE =======

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
    this.typingService.destroy();
  }

  //======= NAVIGATION =======

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.userService.clearMessages();
  }
}