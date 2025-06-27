import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StoryboardService } from '../../../core/services/storyboard.service';
import { TypingEffectService } from '../../../core/services/typing-effect.service';

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

interface ApiError {
  status?: number;
  error?: {
    error?: string;
  };
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

  private router = inject(Router);
  private authService = inject(AuthService);
  private storyboardService = inject(StoryboardService);
  private typingService = inject(TypingEffectService);

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  
  private userStats = {
    drafts: this.storyboardService.draftsCount,
    published: this.storyboardService.publishedCount,
    total: this.storyboardService.totalStories,
    likes: signal<number>(0)
  };

  private state = {
    loading: signal<boolean>(false),
    error: signal<string | null>(null),
    success: signal<string | null>(null)
  };

  activeTab = signal<TabType>('identifiants');

  constructor() {
    const saved = localStorage.getItem('user-account-tab');
    if (saved === 'stats' || saved === 'profile' || saved === 'identifiants') {
      this.activeTab.set(saved as TabType);
    }
  }

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Mon compte',
    speed: 200,
    finalBlinks: 3
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;

  profileData: UserProfileData = { username: '', email: '', description: '' };
  passwordData: PasswordChangeData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  
  private avatarState = {
    selectedFile: null as File | null,
    preview: null as string | null
  };

  loading = this.state.loading.asReadonly();
  error = this.state.error.asReadonly();
  successMessage = this.state.success.asReadonly();

  getUserStats() {
    return {
      totalStories: this.userStats.total(),
      publishedStories: this.userStats.published(),
      drafts: this.userStats.drafts(),
      totalLikes: this.userStats.likes()
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

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.initializeUserData();
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

  private async initializeUserData(): Promise<void> {
    this.loadUserProfile();
    await this.loadUserStats();
  }

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

  private async loadUserStats(): Promise<void> {
    try {
      await Promise.all([
        this.storyboardService.loadDraftsData(),
        this.storyboardService.loadPublishedData()
      ]);
    } catch {
      this.setError('Impossible de charger les statistiques');
    }
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    localStorage.setItem('user-account-tab', tab);
    this.clearMessages();
  }

  goToStoryBoard(): void {
    this.router.navigate(['/chroniques/story-board']);
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    if (!this.validateAvatarFile(file)) return;

    this.avatarState.selectedFile = file;
    this.createAvatarPreview(file);
  }

  private validateAvatarFile(file: File): boolean {
    if (!file.type.startsWith('image/')) {
      this.setError('Veuillez sélectionner une image valide');
      return false;
    }

    if (file.size > 500 * 1024) {
      this.setError('L\'image doit faire moins de 500KB');
      return false;
    }

    return true;
  }

  private createAvatarPreview(file: File): void {
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

  async saveProfile(): Promise<void> {
    if (!this.validateProfile()) return;

    this.setLoading(true);

    try {
      await this.authService.updateProfile(
        this.sanitizeInput(this.profileData.username),
        this.sanitizeInput(this.profileData.description)
      ).toPromise();

      if (this.avatarState.selectedFile) {
        await this.uploadAvatar();
      }

      this.setSuccess('Profil mis à jour avec succès');
    } catch (error: unknown) {
      this.handleApiError(error, 'Erreur lors de la sauvegarde du profil');
    } finally {
      this.setLoading(false);
    }
  }

  private async uploadAvatar(): Promise<void> {
    if (!this.avatarState.selectedFile) return;

    await this.authService.uploadAvatar(this.avatarState.selectedFile).toPromise();
    this.avatarState.selectedFile = null;
    this.avatarState.preview = null;
  }

  saveEmail(): void {
    if (!this.validateEmail()) return;

    this.simulateAsyncAction('Email modifié avec succès');
  }

  changePassword(): void {
    if (!this.validatePassword()) return;

    this.simulateAsyncAction('Mot de passe modifié avec succès');
    this.resetPasswordForm();
  }

  private simulateAsyncAction(message: string): void {
    this.setLoading(true);

    setTimeout(() => {
      this.setSuccess(message);
      this.setLoading(false);
    }, 1000);
  }

  private resetPasswordForm(): void {
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }

  private validateProfile(): boolean {
    const username = this.profileData.username.trim();
    
    if (!username) {
      this.setError('Le nom d\'utilisateur est requis');
      return false;
    }

    if (username.length < 3) {
      this.setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    return true;
  }

  private validateEmail(): boolean {
    const email = this.profileData.email.trim();
    
    if (!email) {
      this.setError('L\'email est requis');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.setError('Format d\'email invalide');
      return false;
    }

    return true;
  }

  private validatePassword(): boolean {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;

    if (!currentPassword) {
      this.setError('Le mot de passe actuel est requis');
      return false;
    }

    if (!newPassword) {
      this.setError('Le nouveau mot de passe est requis');
      return false;
    }

    if (newPassword.length < 8) {
      this.setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (!/[A-Z]/.test(newPassword)) {
      this.setError('Le nouveau mot de passe doit contenir au moins 1 majuscule');
      return false;
    }

    if (newPassword !== confirmPassword) {
      this.setError('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  }

  private sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  private handleApiError(error: unknown, defaultMessage: string): void {
    const apiError = error as ApiError;
    let message = defaultMessage;

    if (apiError.status === 409) {
      message = 'Ce nom d\'utilisateur est déjà pris';
    } else if (apiError.error?.error) {
      message = apiError.error.error;
    }

    this.setError(message);
  }

  private setLoading(loading: boolean): void {
    this.state.loading.set(loading);
  }

  private setError(message: string): void {
    this.clearMessages();
    this.state.error.set(message);
  }

  private setSuccess(message: string): void {
    this.clearMessages();
    this.state.success.set(message);
    
    setTimeout(() => {
      this.state.success.set(null);
    }, 3000);
  }

  private clearMessages(): void {
    this.state.error.set(null);
    this.state.success.set(null);
  }
}