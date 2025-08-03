import { Component, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { UserService } from '../../services/user.service';

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
  private readonly userService = inject(UserService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  loading = this.userService.loading;

  //============ FORMS ============

  username = '';
  playerId = '';
  playerDays = '';
  description = '';

  private avatarState = { 
    selectedFile: null as File | null, 
    preview: null as string | null 
  };

  //============ CONSTRUCTOR ============

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.username = user.username;
      this.description = user.description || '';
    }
  }

  //============ COMPUTED ============

  isProfileValid = computed(() => {
    return this.username.trim().length >= 3;
  });

  //============ AVATAR MANAGEMENT ============

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') || file.size > 200 * 200) {
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

  //============ ACTIONS ============

  async saveProfile(): Promise<void> {
    const username = this.username.trim();
    if (!username || username.length < 3) return;

    if (this.avatarState.selectedFile) {
      await this.userService.uploadAvatar(this.avatarState.selectedFile);
    }

    await this.userService.updateProfile(username, this.description.trim());

    this.avatarState.selectedFile = null;
    this.avatarState.preview = null;
  }
}