// user-account.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
export class UserAccountComponent implements OnInit {
  
  private router = inject(Router);
  private authService = inject(AuthService);

  // Signals depuis AuthService
  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;

  // Signals pour l'état du composant
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  activeTab = signal<'profile' | 'password' | 'stats'>('profile');

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

  // Statistiques utilisateur
  userStats = signal({
    totalStories: 0,
    publishedStories: 0,
    drafts: 0,
    totalLikes: 0
  });

  ngOnInit(): void {
    if (!this.isLoggedIn()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadUserProfile();
    this.loadUserStats();
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

  private loadUserStats(): void {
    // TODO: Appel API pour récupérer les statistiques
    // Pour l'instant, données simulées
    this.userStats.set({
      totalStories: 6,
      publishedStories: 3,
      drafts: 3,
      totalLikes: 45
    });
  }

  setActiveTab(tab: 'profile' | 'password' | 'stats'): void {
    this.activeTab.set(tab);
    this.clearMessages();
  }

  // Sauvegarder le profil
  saveProfile(): void {
    if (!this.validateProfile()) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    // TODO: Appel API pour mettre à jour le profil
    console.log('Sauvegarde profil:', this.profileData);
    
    // Simulation d'appel API
    setTimeout(() => {
      this.successMessage.set('Profil mis à jour avec succès');
      this.loading.set(false);
    }, 1000);
  }

  // Changer le mot de passe
  changePassword(): void {
    if (!this.validatePassword()) {
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    // TODO: Appel API pour changer le mot de passe
    console.log('Changement mot de passe');
    
    // Simulation d'appel API
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

  // Validations
  private validateProfile(): boolean {
    if (!this.profileData.username.trim()) {
      this.error.set('Le nom d\'utilisateur est requis');
      return false;
    }

    if (this.profileData.username.length < 3) {
      this.error.set('Le nom d\'utilisateur doit contenir au moins 3 caractères');
      return false;
    }

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

  // Navigation
  goBack(): void {
    this.router.navigate(['/chroniques']);
  }

  // Getters pour le template
  get userName(): string {
    return this.currentUser()?.username || '';
  }

  get userRole(): string {
    return this.currentUser()?.role?.toUpperCase() || 'USER';
  }

  get accountCreatedDate(): string {
    const user = this.currentUser();
    if (user?.createdAt) {
      return new Date(user.createdAt).toLocaleDateString('fr-FR');
    }
    return '';
  }
}