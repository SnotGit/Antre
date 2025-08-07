import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CredentialsService } from '@features/user/services/credentials.service';

@Component({
  selector: 'app-password-forms',
  imports: [FormsModule],
  templateUrl: './password-forms.html',
  styleUrl: './password-forms.scss'
})
export class PasswordForms {

  //============ INJECTIONS ============

  private readonly credentialsService = inject(CredentialsService);

  //============ SIGNALS ============

  error = this.credentialsService.error;
  successMessage = this.credentialsService.successMessage;

  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  //============ COMPUTED ============

  isPasswordValid = computed(() => {
    const current = this.currentPassword().trim();
    const newPass = this.newPassword().trim();
    const confirmPass = this.confirmPassword().trim();
    
    return current.length > 0 && 
           newPass.length >= 8 && 
           newPass === confirmPass;
  });

  //============ ACTIONS ============

  async savePassword(): Promise<void> {
    const currentPassword = this.currentPassword().trim();
    const newPassword = this.newPassword().trim();
    
    if (!currentPassword || !newPassword || !this.isPasswordValid()) return;

    await this.credentialsService.changePassword(currentPassword, newPassword);
    
    this.currentPassword.set('');
    this.newPassword.set('');
    this.confirmPassword.set('');
  }

  goBack(): void {
    this.credentialsService.clearMessages();
  }
}