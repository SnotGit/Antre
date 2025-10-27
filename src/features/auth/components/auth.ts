import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { LoginService } from '../services/login.service';
import { RegisterService, RegisterRequest } from '@features/auth/services/register.service';
import { TokenService } from '../services/token.service';

//======= TYPES =======

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth implements OnInit, OnDestroy {
  
  //======= INJECTIONS =======

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly loginService = inject(LoginService);
  private readonly registerService = inject(RegisterService);
  private readonly tokenService = inject(TokenService);

  //======= SIGNALS ÉTAT =======

  authMode = signal<'login' | 'register'>('login');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  //======= DONNÉES FORMULAIRES =======

  loginData: LoginData = {
    email: '',
    password: ''
  };

  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    description: ''
  };

  //======= LIFECYCLE =======

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/register')) {
      this.authMode.set('register');
    } else {
      this.authMode.set('login');
    }
    
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/accueil']);
    }
  }

  ngOnDestroy(): void {
  }

  //======= NAVIGATION =======

  goBack(): void {
    this.location.back();
  }

  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.clearMessages();
    
    const newUrl = mode === 'register' ? '/auth/register' : '/auth/login';
    this.location.replaceState(newUrl);
  }

  //======= AUTHENTIFICATION =======

  async onLogin(): Promise<void> {
    if (!this.loginData.email || !this.loginData.password) {
      this.error.set('Tous les champs sont requis');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const response = await this.loginService.login(this.loginData.email, this.loginData.password);
      
      // Stocker le token et mettre à jour l'état auth
      this.tokenService.setToken(response.token);
      this.authService.setCurrentUser(response.user);
      
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/accueil';
      this.router.navigate([returnUrl]);
      
    } catch (error: any) {
      this.error.set(error.message || 'Erreur de connexion');
    } finally {
      this.loading.set(false);
    }
  }

  async onRegister(): Promise<void> {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.error.set('Champs obligatoires sont requis');
      return;
    }

    if (this.registerData.password.length < 8) {
      this.error.set('Le mot de passe doit contenir au moins 8 caractères et une majuscule');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      const response = await this.registerService.register(this.registerData);
      
      // Stocker le token et mettre à jour l'état auth
      this.tokenService.setToken(response.token);
      this.authService.setCurrentUser(response.user);
      
      this.successMessage.set('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      
      this.registerData = {
        username: '',
        email: '',
        password: '',
        description: ''
      };
      
      setTimeout(() => {
        this.setAuthMode('login');
      }, 2000);
      
    } catch (error: any) {
      this.error.set(error.message || 'Erreur lors de l\'inscription');
    } finally {
      this.loading.set(false);
    }
  }

  //======= UTILITAIRES =======

  private clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  getSystemStatus(): string {
    if (this.loading()) return 'TRAITEMENT...';
    if (this.error()) return 'ERREUR DÉTECTÉE';
    if (this.successMessage()) return 'OPÉRATION RÉUSSIE';
    return 'Opérationnelle';
  }

  get isLoginValid(): boolean {
    return !!(this.loginData.email && this.loginData.password);
  }

  get isRegisterValid(): boolean {
    return !!(
      this.registerData.username && 
      this.registerData.email && 
      this.registerData.password &&
      this.registerData.username.length >= 3 &&
      this.registerData.password.length >= 6
    );
  }
}