import { Component, inject, computed, signal, resource, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@features/auth';
import { ProfileService } from '@features/user/services/profile.service';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-user-profile',
  imports: [FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.scss'
})
export class UserProfile {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  //============ INJECTIONS ============

  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly API_URL = environment.apiUrl;

  //============ RESOURCE USER DATA ============

  private userResource = resource({
    loader: async () => {
      return this.authService.currentUser();
    }
  });

  //============ SIGNALS FORM ============

  username = signal('');
  description = signal('');
  playerId = signal('');
  playerDays = signal('');
  selectedFile = signal<File | null>(null);
  avatar = signal<string | null>(null);

  //============ SIGNALS SERVICE ============

  loading = this.profileService.loading;
  error = this.profileService.error;
  successMessage = this.profileService.successMessage;

  //============ COMPUTED ============

  isProfileValid = computed(() => {
    return this.username().trim().length >= 3;
  });

  AvatarUrl(): string {
    const preview = this.avatar();
    if (preview) return preview;
    
    const user = this.userResource.value();
    if (user?.avatar) {
      return `${this.API_URL.replace('/api', '')}${user.avatar}`;
    }
    return '';
  }

  //============ AVATAR ACTIONS ============

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    this.selectedFile.set(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatar.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  //============ FORM ACTIONS ============

  async saveProfile(): Promise<void> {
    if (!this.isProfileValid()) return;

    const profileData = {
      username: this.username().trim(),
      description: this.description().trim(),
      playerId: this.playerId().trim(),
      playerDays: parseInt(this.playerDays()) || 0
    };

    const file = this.selectedFile();
    
    await this.profileService.updateProfile(profileData, file);
    
    this.selectedFile.set(null);
    this.avatar.set(null);
  }

  async deleteAccount(): Promise<void> {
    await this.profileService.deleteAccount();
  }
}