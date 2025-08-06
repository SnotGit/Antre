import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-user-credentials',
  imports: [FormsModule],
  templateUrl: './user-credentials.html',
  styleUrl: './user-credentials.scss'
})
export class UserCredentials {

  //============ INJECTIONS ============

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  loading = this.userService.loading;

  //============ FORMS ============

  email = '';
  passwordData: PasswordChangeData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  //============ CONSTRUCTOR ============

  constructor() {
    this.email = this.currentUser()?.email || '';
  }

  //============ COMPUTED ============

  isEmailValid = computed(() => {
    const email = this.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  });

  isPasswordValid = computed(() => {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;
    return !!(currentPassword && newPassword && newPassword.length >= 8 && newPassword === confirmPassword);
  });

  //============ ACTIONS ============

  async saveEmail(): Promise<void> {
    const email = this.email.trim();
    if (!email || !this.isEmailValid()) return;

    await this.userService.updateEmail(email);
  }

  async changePassword(): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = this.passwordData;

    if (!currentPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
      return;
    }

    await this.userService.changePassword(currentPassword, newPassword);
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }
}