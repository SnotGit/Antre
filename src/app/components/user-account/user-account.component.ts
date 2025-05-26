// user-account.component.ts
import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StoryboardService } from '../../services/storyboard.service';

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

@Component({
  selector: 'app-user-account',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-account.component.html',
  styleUrl: './user-account.component.scss'
})
export class UserAccountComponent implements OnInit, OnDestroy {
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  private router = inject(Router);
  private authService = inject(AuthService);
  private storyboardService = inject(StoryboardService);

  // Signals depuis AuthService
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;

  // Signals depuis StoryboardService pour les stats
  draftsCount = this.storyboardService.draftsCount;
  publishedCount = this.storyboardService.publishedCount;
  totalStoriesCount = this.storyboardService.totalStories;

  // Signals pour l'état du composant
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  // CORRECTION 1: Onglet avec persistence
  activeTab = signal<'profile' | 'credentials' | 'stats'>(
    (localStorage.getItem('user-account-tab') as any) || 'stats'
  );

  // Signals pour l'effet de typing
  displayedTitle = signal<string>('');
  typingComplete = signal<boolean>(false);
  private typingInterval?: number;

  // Signal pour les likes totaux
  totalLikes = signal<number>(0);

  // Données des formulaires
  profileData: UserProfileData = {
    username: '',
    email: '',
    description: ''
  };

  passwordData: PasswordChangeData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Avatar
  selectedAvatarFile: File | null = null;
  avatarPreview: string | null = null;

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // CORRECTION 2: Forcer le refresh complet des données utilisateur
    this.refreshUserData();
    this.startTypingEffect();
  }

  ngOnDestroy(): void {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
  }

  // CORRECTION 3: Méthode pour refresh complet des données
  private refreshUserData(): void {
    this.authService.validateToken().subscribe({
      next: () => {
        // Données utilisateur mises à jour, maintenant charger le reste
        this.loadUserProfile();
        this.loadUserStats();
      },
      error: (error) => {
        console.error('Erreur validation token:', error);
        // En cas d'erreur, utiliser les données en cache
        this.loadUserProfile();
        this.loadUserStats();
      }
    });
  }

  // ============ EFFET DE TYPING ============

  private startTypingEffect(): void {
    const fullTitle = 'Mon Compte';
    let currentIndex = 0;

    this.typingInterval = window.setInterval(() => {
      if (currentIndex < fullTitle.length) {
        this.displayedTitle.set(fullTitle.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setTimeout(() => {
          this.typingComplete.set(true);
        }, 500);
        
        if (this.typingInterval) {
          clearInterval(this.typingInterval);
        }
      }
    }, 200);
  }

  // ============ GESTION DES TABS ============

  setActiveTab(tab: 'profile' | 'credentials' | 'stats'): void {
    this.activeTab.set(tab);
    // CORRECTION 4: Sauvegarder l'onglet actif
    localStorage.setItem('user-account-tab', tab);
    this.clearMessages();
  }

  // ============ CHARGEMENT DES DONNÉES ============

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

      // TODO: Calculer les likes totaux réels
      this.totalLikes.set(0);

    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      this.error.set('Impossible de charger les statistiques');
    }
  }

  // ============ COMPUTED POUR LES STATS ============
  
  getUserStats() {
    return {
      totalStories: this.totalStoriesCount(),
      publishedStories: this.publishedCount(),
      drafts: this.draftsCount(),
      totalLikes: this.totalLikes()
    };
  }

  // ============ GESTION DE L'AVATAR ============

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.error.set('Veuillez sélectionner une image valide');
        return;
      }

      if (file.size > 500 * 1024) {
        this.error.set('L\'image doit faire moins de 500KB');
        return;
      }

      this.selectedAvatarFile = file;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  // CORRECTION 5: Méthode d'avatar corrigée
 getAvatarUrl(): string {
  console.log('=== AVATAR DEBUG FINAL ===');
  
  if (this.avatarPreview) {
    console.log('Preview existe:', this.avatarPreview);
    return `url(${this.avatarPreview})`;
  }
  
  const user = this.currentUser();
  console.log('CurrentUser complet:', user);
  console.log('Avatar dans user:', user?.avatar);
  
  if (user?.avatar) {
    const url = `url(http://localhost:3000${user.avatar})`;
    console.log('URL finale générée:', url);
    return url;
  }
  
  console.log('Aucun avatar trouvé');
  return '';
}
  // ============ SAUVEGARDE PROFIL ============

  async saveProfile(): Promise<void> {
    if (!this.validateProfile()) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      // CORRECTION 7: Upload avatar ET refresh des données
      if (this.selectedAvatarFile) {
        await this.authService.uploadAvatar(this.selectedAvatarFile).toPromise();
        this.selectedAvatarFile = null;
        this.avatarPreview = null;
        
        // Forcer le refresh des données utilisateur après upload
        await this.authService.validateToken().toPromise();
      }

      // TODO: Sauvegarder aussi username et description
      this.successMessage.set('Profil mis à jour avec succès');
      this.loading.set(false);

    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      this.error.set('Erreur lors de la sauvegarde du profil');
      this.loading.set(false);
    }
  }

  // ============ SAUVEGARDE EMAIL ============

  saveEmail(): void {
    if (!this.validateEmail()) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    // TODO: Appel API pour mettre à jour l'email
    setTimeout(() => {
      this.successMessage.set('Email modifié avec succès');
      this.loading.set(false);
    }, 1000);
  }

  // ============ CHANGEMENT MOT DE PASSE ============

  changePassword(): void {
    if (!this.validatePassword()) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    // TODO: Appel API pour changer le mot de passe
    setTimeout(() => {
      this.successMessage.set('Mot de passe modifié avec succès');
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.loading.set(false);
    }, 1000);
  }

  // ============ VALIDATIONS ============

  private validateProfile(): boolean {
    if (!this.profileData.username.trim()) {
      this.error.set('Le nom d\'utilisateur est requis');
      return false;
    }

    if (this.profileData.username.length < 3) {
      this.error.set('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

    return true;
  }

  private validateEmail(): boolean {
    if (!this.profileData.email.trim()) {
      this.error.set('L\'email est requis');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileData.email)) {
      this.error.set('Format d\'email invalide');
      return false;
    }

    return true;
  }

  private validatePassword(): boolean {
    if (!this.passwordData.currentPassword) {
      this.error.set('Le mot de passe actuel est requis');
      return false;
    }

    if (!this.passwordData.newPassword) {
      this.error.set('Le nouveau mot de passe est requis');
      return false;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.error.set('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.error.set('Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  }

  private clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  // ============ GETTERS TEMPLATE ============

  get userName(): string {
    return this.currentUser()?.username || '';
  }

  get userRole(): string {
    const user = this.currentUser();
    if (!user) return 'USER';
    
    if (user.role === 'admin' && user.isDev) {
      return 'ADMIN / DEV';
    }
    
    return user.role.toUpperCase();
  }

  get accountCreatedDate(): string {
    const user = this.currentUser();
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('fr-FR');
    }
    return '';
  }
}