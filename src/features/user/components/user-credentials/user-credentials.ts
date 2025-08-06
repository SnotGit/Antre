import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@features/user/services/auth.service';
import { CredentialsService, EmailData } from '@features/user/services/credentials.service';
import { PasswordForms } from './password-forms/password-forms';

@Component({
  selector: 'app-user-credentials',
  imports: [FormsModule, PasswordForms],
  templateUrl: './user-credentials.html',
  styleUrl: './user-credentials.scss'
})
export class UserCredentials implements OnInit {

  //============ INJECTIONS ============

  private readonly authService = inject(AuthService);
  private readonly credentialsService = inject(CredentialsService);

  //============ SIGNALS ============

  currentUser = this.authService.currentUser;
  passwordForms = signal(false);
  emailForms = signal(true);

  //============ FORMS ============

  emailData: EmailData = {
    email: ''
  };

  //============ LIFECYCLE ============

  ngOnInit(): void {
    this.emailData.email = this.currentUser()?.email || '';
  }

  //============ COMPUTED ============

  isEmailValid = computed(() => {
    const email = this.emailData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  });

  //============ ACTIONS ============

  showPasswordForm(): void {
    this.passwordForms.set(this.passwordForms());
  }

  async saveEmail(): Promise<void> {
    const email = this.emailData.email.trim();
    if (!email || !this.isEmailValid()) return;

    await this.credentialsService.updateEmail(email);
  }
}