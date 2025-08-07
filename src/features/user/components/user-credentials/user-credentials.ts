import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@features/user/services/auth.service';
import { CredentialsService } from '@features/user/services/credentials.service';
import { ConfirmationDialogService } from '@shared/services/confirmation-dialog.service';
import { EmailForm } from './email-form/email-form';
import { PasswordForms } from './password-forms/password-forms';

@Component({
  selector: 'app-user-credentials',
  imports: [EmailForm, PasswordForms],
  templateUrl: './user-credentials.html',
  styleUrl: './user-credentials.scss'
})
export class UserCredentials {

  //============ INJECTIONS ============

  private readonly authService = inject(AuthService);
  private readonly credentialsService = inject(CredentialsService);
  private readonly confirmationService = inject(ConfirmationDialogService);

  //============ SIGNALS ============

  showEmail = signal(false);
  showPassword = signal(false);

  //============ NAVIGATION METHODS ============

  showEmailForm(): void {
    this.showEmail.set(true);
    this.showPassword.set(false);
  }

  showPasswordForm(): void {
    this.showPassword.set(true);
    this.showEmail.set(false);
  }

  goBack(): void {
    this.showEmail.set(false);
    this.showPassword.set(false);
  }

  //============ DELETE ACCOUNT ============

  async deleteAccount(): Promise<void> {
    const confirmed = await this.confirmationService.confirmDeleteAccount();
    if (confirmed) {
      this.authService.logout();
    }
  }
}