import { Component, OnInit, OnDestroy, inject, signal, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';
import { LoginService } from '@features/auth/services/login.service';
import { RegisterService, RegisterRequest } from '@features/auth/services/register.service';
import { TokenService } from '@features/auth/services/token.service';
import { InstructionsService } from '@features/home/services/instructions.service';
import { TypingTextService } from '@shared/services/typing-text/typing-text.service';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-auth-form',
  imports: [FormsModule],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
  providers: [TypingTextService]
})
export class AuthForm implements OnInit, OnDestroy {

  initialMode = input<'login' | 'register'>('login');
  close = output<void>();
  modeChange = output<'login' | 'register'>();

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly loginService = inject(LoginService);
  private readonly registerService = inject(RegisterService);
  private readonly tokenService = inject(TokenService);
  private readonly instructions = inject(InstructionsService);
  private readonly typing = inject(TypingTextService);

  readonly titleText = this.typing.text;
  readonly titleComplete = this.typing.complete;

  mode = signal<'login' | 'register'>('login');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  showPassword = signal<boolean>(false);

  loginData: LoginData = { email: '', password: '' };
  registerData: RegisterRequest = { username: '', email: '', password: '', description: '' };

  private readonly titles = {
    login: '// AUTHENTIFICATION',
    register: '// ENREGISTREMENT'
  };

  ngOnInit(): void {
    this.mode.set(this.initialMode());
    this.typeCurrentTitle();
  }

  ngOnDestroy(): void {
    this.typing.destroy();
  }

  toggleMode(): void {
    const next = this.mode() === 'login' ? 'register' : 'login';
    this.mode.set(next);
    this.error.set(null);
    this.showPassword.set(false);
    this.modeChange.emit(next);
    this.typeCurrentTitle();
  }

  private typeCurrentTitle(): void {
    this.typing.type(this.titles[this.mode()], 22);
  }

  onClose(): void {
    this.close.emit();
  }

  async onLogin(): Promise<void> {
    if (!this.loginData.email || !this.loginData.password) {
      this.error.set('Tous les champs sont requis');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.loginService.login(this.loginData.email, this.loginData.password);
      this.tokenService.setToken(response.token);
      this.authService.setCurrentUser(response.user);
      this.instructions.hide();
      this.router.navigate(['/accueil']);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur de connexion');
    } finally {
      this.loading.set(false);
    }
  }

  async onRegister(): Promise<void> {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.error.set('Tous les champs sont requis');
      return;
    }
    if (this.registerData.password.length < 8) {
      this.error.set('Mot de passe minimum 8 caractères');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await this.registerService.register(this.registerData);
      this.tokenService.setToken(response.token);
      this.authService.setCurrentUser(response.user);
      this.instructions.show();
      this.router.navigate(['/accueil']);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Erreur lors de l\'inscription');
    } finally {
      this.loading.set(false);
    }
  }
}
