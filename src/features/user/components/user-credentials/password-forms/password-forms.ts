import { Component, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CredentialsService, PasswordData } from '@features/user/services/credentials.service';

@Component({
  selector: 'app-password-forms',
  imports: [FormsModule],
  templateUrl: './password-forms.html',
  styleUrl: './password-forms.scss'
})
export class PasswordForms {

  //============ INJECTIONS ============

  private readonly credentialsService = inject(CredentialsService);

  //============ FORMS ============

  passwordData: PasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  //============ COMPUTED ============

  isPasswordValid = computed(() => {
    return !!(this.passwordData.currentPassword && 
             this.passwordData.newPassword && 
             this.passwordData.newPassword.length >= 8 && 
             this.passwordData.newPassword === this.passwordData.confirmPassword);
  });

  //============ ACTIONS ============

  async changePassword(): Promise<void> {
    if (!this.isPasswordValid()) return;

    await this.credentialsService.changePassword(
      this.passwordData.currentPassword, 
      this.passwordData.newPassword
    );
    
    this.resetForm();
  }

  showEmailForm(): void {
    this.emailForm.set(this.emailform());
  }

  //============ UTILITIES ============

  private resetForm(): void {
    this.passwordData = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }
}