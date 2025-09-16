import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { CredentialsService } from '@features/user/services/credentials.service';
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
  private readonly credentialsService = inject(CredentialsService);
  private readonly typingService = inject(TypingEffectService);

  //======= VIEW CHILD =======

  @ViewChild(UserCredentials) userCredentialsRef!: UserCredentials;

  //======= SIGNALS =======

  isLoggedIn = this.authService.isLoggedIn;
  error = this.credentialsService.error;
  success = this.credentialsService.success;
  activeTab = signal<TabType>('stats');

  //======= COMPUTED =======

  showBackButton = computed(() => {
    return this.activeTab() === 'identifiants' && 
           !this.error() && 
           !this.success();
  });

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
    this.credentialsService.clearMessages();
  }

  goBack(): void {
    this.userCredentialsRef.goBack();
  }
}