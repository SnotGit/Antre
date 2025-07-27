import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from '../../../../services/user.service';
import { PrivateStoriesService } from '../../../../services/private-stories.service';
import { TypingEffectService } from '../../../../services/typing-effect.service';

interface UserProfileData {
  username: string;
  email: string;
  description: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type TabType = 'stats' | 'profile' | 'identifiants';

@Component({
  selector: 'app-user-account',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-account.html',
  styleUrl: './user-account.scss'
})
export class UserAccount implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  //============ INJECTIONS ============

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly privateStoriesService = inject(PrivateStoriesService);
  private readonly typingService = inject(TypingEffectService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  stats = this.privateStoriesService.stats;
  drafts = this.privateStoriesService.drafts;
  published = this.privateStoriesService.published;
  loading = this.userService.loading;
  error = this.userService.error;
  successMessage = this.userService.successMessage;

  activeTab = signal<TabType>('identifiants');

  //============ FORMS ============

  profileData: UserProfileData = { username: '', email: '', description: '' };
  passwordData: PasswordChangeData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  private avatarState = { selectedFile: null as File | null, preview: null as string | null };

    //============ TYPING EFFECT ============

  private readonly title = 'Marsball';

  headerTitle = this.typingService.headerTitle;
  showCursor = this.typingService.showCursor;
  typing = this.typingService.typingComplete;

  constructor() {
    const saved = localStorage.getItem('user-account-tab');
    if (saved && ['stats', 'profile', 'identifiants'].includes(saved)) {
      this.activeTab.set(saved as TabType);
    }
  }

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadUserProfile();
    this.privateStoriesService.stats();
    this.typingService.title(this.title);
  }

  ngOnDestroy(): void {
  }

  //============ COMPUTED GETTERS ============

  getUserStats() {
    const stats = this.stats();
    return {
      totalStories: stats.drafts + stats.published,
      publishedStories: stats.published,
      drafts: stats.drafts,
      totalLikes: stats.totalLikes
    };
  }

  get userName(): string {
    return this.currentUser()?.username || '';
  }

  get userRole(): string {
    return this.currentUser()?.role?.toUpperCase() || 'USER';
  }

  get accountCreatedDate(): string {
    const user = this.currentUser();
    return user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '';
  }

  //============ NAVIGATION ONGLETS ============

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    localStorage.setItem('user-account-tab', tab);
    this.userService.clearMessages();
  }

  showMyStories(): void {
    this.router.navigate(['/chroniques/my-stories']);
  }

  showMyPublishedStories(): void {
    this.router.navigate(['/chroniques/my-stories/published']);
  }

  showMyDrafts(): void {
    this.router.navigate(['/chroniques/my-stories/drafts']);
  }


  //============ GESTION AVATAR ============

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 500 * 1024) {
      return;
    }

    this.avatarState.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarState.preview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  getAvatarUrl(): string {
    if (this.avatarState.preview) return this.avatarState.preview;

    const user = this.currentUser();
    return user?.avatar ? `http://localhost:3000${user.avatar}` : '';
  }

  //============ SAUVEGARDE PROFIL ============

  async saveProfile(): Promise<void> {
    const username = this.profileData.username.trim();
    if (!username || username.length < 3) return;

    if (this.avatarState.selectedFile) {
      await this.userService.uploadAvatar(this.avatarState.selectedFile);
    }

    await this.userService.updateProfile(username, this.profileData.description.trim());

    this.avatarState.selectedFile = null;
    this.avatarState.preview = null;
  }

  async saveEmail(): Promise<void> {
    const email = this.profileData.email.trim();
    if (!email || !this.isEmailValid) return;

    await this.userService.updateEmail(email);
  }

  //============ CHANGEMENT MOT DE PASSE ============

  async changePassword(): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;

    if (!currentPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      return;
    }

    await this.userService.changePassword(currentPassword, newPassword);
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  //============ VALIDATION FORMULAIRES ============

  get isProfileValid(): boolean {
    return this.profileData.username.trim().length >= 3;
  }

  get isPasswordValid(): boolean {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;
    return !!(currentPassword && newPassword && newPassword.length >= 8 && newPassword === confirmPassword);
  }

  get isEmailValid(): boolean {
    const email = this.profileData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //============ UTILITAIRES ============

  private loadUserProfile(): void {
    const user = this.currentUser();
    if (user) {
      this.profileData = {
        username: user.username,
        email: user.email,
        description: user.description || ''
      };
    }
  }
}