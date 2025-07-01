import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PrivateStoriesService } from '../../../core/services/private-stories.service';
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
  private privateStoriesService: PrivateStoriesService = inject(PrivateStoriesService);
  private typingService = inject(TypingEffectService);

  private readonly API_BASE_URL = 'http://localhost:3000';

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  stats = this.privateStoriesService.stats;
  drafts = this.privateStoriesService.drafts;
  published = this.privateStoriesService.published;

  activeTab = signal<TabType>('identifiants');
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  profileData: UserProfileData = { username: '', email: '', description: '' };
  passwordData: PasswordChangeData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  private avatarState = { selectedFile: null as File | null, preview: null as string | null };

  private typingEffect = this.typingService.createTypingEffect({
    text: 'Mon compte',
    speed: 200,
    finalBlinks: 3
  });

  headerTitle = this.typingEffect.headerTitle;
  typingComplete = this.typingEffect.typingComplete;

  constructor() {
    const saved = localStorage.getItem('user-account-tab');
    if (saved === 'stats' || saved === 'profile' || saved === 'identifiants') {
      this.activeTab.set(saved as TabType);
    }
  }

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadUserProfile();
    this.privateStoriesService.initializeUserData();
    this.typingEffect.startTyping();
  }

  ngOnDestroy(): void {
    this.typingEffect.cleanup();
  }

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

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    localStorage.setItem('user-account-tab', tab);
    this.clearMessages();
  }

  showMyStories(): void {
    console.log('Toutes mes histoires:', { 
      brouillons: this.drafts(), 
      publiées: this.published() 
    });
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file || !this.validateAvatarFile(file)) return;

    this.avatarState.selectedFile = file;
    this.createAvatarPreview(file);
  }

  getAvatarUrl(): string {
    if (this.avatarState.preview) return this.avatarState.preview;
    
    const user = this.currentUser();
    return user?.avatar ? `${this.API_BASE_URL}${user.avatar}` : '';
  }

  async saveProfile(): Promise<void> {
    if (!this.validateProfileData()) return;

    this.clearMessages();
    this.loading.set(true);

    try {
      if (this.avatarState.selectedFile) {
        await firstValueFrom(this.authService.uploadAvatar(this.avatarState.selectedFile));
      }

      await firstValueFrom(this.authService.updateProfile(
        this.profileData.username.trim(),
        this.profileData.description.trim()
      ));

      this.setSuccess('Profil mis à jour avec succès');
      this.avatarState.selectedFile = null;
      this.avatarState.preview = null;

    } catch (error) {
      this.handleApiError(error, 'Erreur lors de la mise à jour du profil');
    } finally {
      this.loading.set(false);
    }
  }

  saveEmail(): void {
    this.setSuccess('Fonctionnalité bientôt disponible');
  }

  async changePassword(): Promise<void> {
    if (!this.validatePasswordData()) return;

    this.clearMessages();
    this.loading.set(true);

    try {
      await firstValueFrom(this.authService.changePassword({
        currentPassword: this.passwordData.currentPassword,
        newPassword: this.passwordData.newPassword
      }));

      this.setSuccess('Mot de passe modifié avec succès');
      this.resetPasswordForm();

    } catch (error) {
      this.handleApiError(error, 'Erreur lors du changement de mot de passe');
    } finally {
      this.loading.set(false);
    }
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

  private validateProfileData(): boolean {
    if (!this.profileData.username.trim()) {
      this.setError('Le nom d\'utilisateur est requis');
      return false;
    }

    if (this.profileData.username.trim().length < 3) {
      this.setError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    return true;
  }

  private validatePasswordData(): boolean {
    if (!this.passwordData.currentPassword) {
      this.setError('Le mot de passe actuel est requis');
      return false;
    }

    if (!this.passwordData.newPassword) {
      this.setError('Le nouveau mot de passe est requis');
      return false;
    }

    if (this.passwordData.newPassword.length < 8) {
      this.setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.setError('La confirmation du mot de passe ne correspond pas');
      return false;
    }

    return true;
  }

  private resetPasswordForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  private setError(message: string): void {
    this.error.set(message);
    this.successMessage.set(null);
  }

  private setSuccess(message: string): void {
    this.successMessage.set(message);
    this.error.set(null);
  }

  private clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  private handleApiError(error: unknown, defaultMessage: string): void {
    const apiError = error as { status?: number; error?: { error?: string } };
    
    if (apiError?.error?.error) {
      this.setError(apiError.error.error);
    } else if (apiError?.status === 401) {
      this.setError('Session expirée, veuillez vous reconnecter');
      this.router.navigate(['/auth/login']);
    } else {
      this.setError(defaultMessage);
    }
  }
}