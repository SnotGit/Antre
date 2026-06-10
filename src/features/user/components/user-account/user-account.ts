import { Component, inject, signal, computed, linkedSignal, ElementRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@features/auth/services/auth.service';
import { ProfileService } from '@features/user/services/profile.service';
import { CredentialsService } from '@features/user/services/credentials.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-user-account',
  imports: [FormsModule],
  templateUrl: './user-account.html',
  styleUrl: './user-account.scss'
})
export class UserAccount {

  //======= INJECTIONS =======

  private readonly auth = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly credentialsService = inject(CredentialsService);
  private readonly API_URL = environment.apiUrl;

  //======= VIEW CHILD =======

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  //======= USER =======

  user = this.auth.currentUser;

  memberSince = computed(() => {
    const date = this.user()?.createdAt;
    return date
      ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';
  });

  status = computed(() => this.user()?.role === 'admin' ? 'ADMINISTRATEUR' : 'UTILISATEUR');

  //======= PROFIL FORM =======

  username = linkedSignal(() => this.user()?.username ?? '');
  description = linkedSignal(() => this.user()?.description ?? '');
  playerId = linkedSignal(() => this.user()?.playerId ?? '');
  selectedFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  //======= CREDENTIALS FORM =======

  currentPassword = signal('');
  newEmail = signal('');
  confirmEmail = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  //======= STATE =======

  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loading = computed(() => this.profileService.loading() || this.credentialsService.loading());

  //======= COMPUTED =======

  avatarUrl = computed(() => {
    const preview = this.avatarPreview();
    if (preview) return preview;
    const avatar = this.user()?.avatar;
    return avatar ? `${this.API_URL.replace('/api', '')}${avatar}` : '';
  });

  usernameValid = computed(() => this.username().trim().length >= 3);

  //======= AVATAR =======

  pickAvatar(): void {
    this.fileInput().nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  //======= SAVE =======

  async save(): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    if (!this.usernameValid()) {
      this.error.set('Le pseudo doit contenir au moins 3 caractères');
      return;
    }

    const wantsEmail = !!this.newEmail().trim();
    const wantsPassword = !!(this.newPassword() || this.confirmPassword());

    if (wantsEmail && this.newEmail().trim() !== this.confirmEmail().trim()) {
      this.error.set('Les emails ne correspondent pas');
      return;
    }
    if (wantsPassword) {
      if (this.newPassword().length < 8) {
        this.error.set('Le nouveau mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (this.newPassword() !== this.confirmPassword()) {
        this.error.set('Les mots de passe ne correspondent pas');
        return;
      }
    }
    if ((wantsEmail || wantsPassword) && !this.currentPassword()) {
      this.error.set('Saisis ton mot de passe actuel pour modifier tes informations');
      return;
    }

    try {
      await this.profileService.updateProfile({
        username: this.username().trim(),
        description: this.description().trim(),
        playerId: this.playerId().trim(),
        playerDays: this.user()?.playerDays ?? 0
      }, this.selectedFile());

      if (this.profileService.error()) {
        this.error.set(this.profileService.error());
        return;
      }
      this.selectedFile.set(null);
      this.avatarPreview.set(null);

      if (wantsEmail) {
        await this.credentialsService.updateEmail(this.newEmail().trim());
        this.newEmail.set('');
        this.confirmEmail.set('');
      }

      if (wantsPassword) {
        await this.credentialsService.changePassword(this.currentPassword(), this.newPassword());
        this.newPassword.set('');
        this.confirmPassword.set('');
      }

      this.currentPassword.set('');
      this.success.set('Modifications enregistrées');
    } catch {
      this.error.set(this.credentialsService.error() ?? 'Erreur lors de l\'enregistrement');
    }
  }

  //======= DELETE =======

  async deleteAccount(): Promise<void> {
    await this.profileService.deleteAccount();
  }
}
