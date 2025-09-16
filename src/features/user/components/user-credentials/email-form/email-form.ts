import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@features/auth/services/auth.service';
import { CredentialsService } from '@features/user/services/credentials.service';

@Component({
  selector: 'app-email-form',
  imports: [FormsModule],
  templateUrl: './email-form.html',
  styleUrl: './email-form.scss'
})
export class EmailForm {

  //============ INJECTIONS ============

  private readonly authService = inject(AuthService);
  private readonly credentialsService = inject(CredentialsService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  loading = this.credentialsService.loading;
  error = this.credentialsService.error;
  successMessage = this.credentialsService.success;

  email = signal(this.currentUser()?.email || '');
  newEmail = signal('');
  confirmEmail = signal('');

  //============ COMPUTED ============

  isEmailValid = computed(() => {
    const email = this.email().trim();
    const confirmEmail = this.confirmEmail().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && 
           email === confirmEmail && 
           email !== this.currentUser()?.email;
  });

  //============ ACTIONS ============

  async saveEmail(): Promise<void> {
    const email = this.email().trim();
    if (!email || !this.isEmailValid()) return;

    await this.credentialsService.updateEmail(email);
  }

  goBack(): void {
    this.credentialsService.clearMessages();
  }
}