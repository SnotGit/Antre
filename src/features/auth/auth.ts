import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  description: string;
}

@Component({
  selector: 'app-auth',
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss'
})
export class Auth implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);

  //============ SIGNALS ÉTAT ============

  authMode = signal<'login' | 'register'>('login');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  //============ DONNÉES FORMULAIRES ============

  loginData: LoginData = {
    email: '',
    password: ''
  };

  registerData: RegisterData = {
    username: '',
    email: '',
    password: '',
    description: ''
  };

  ngOnInit(): void {
    const url = this.router.url;
    if (url.includes('/register')) {
      this.authMode.set('register');
    } else {
      this.authMode.set('login');
    }
    
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/chroniques']);
    }
  }

  ngOnDestroy(): void {
  }

  //============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }

  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.clearMessages();
    
    const newUrl = mode === 'register' ? '/auth/register' : '/auth/login';
    this.location.replaceState(newUrl);
  }

  //============ AUTHENTIFICATION ============

  async onLogin(): Promise<void> {
    if (!this.loginData.email || !this.loginData.password) {
      this.error.set('Tous les champs sont requis');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    try {
      await this.authService.login(this.loginData.email, this.loginData.password);
      
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chroniques';
      this.router.navigate([returnUrl]);
      
    } catch (error: any) {
      let errorMessage = 'Erreur de connexion';
      if (error.message === 'Email ou mot de passe incorrect') {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.error.set(errorMessage);
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
      await this.authService.register(this.registerData);
      
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
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.message) {
        errorMessage = error.message;
      }
      
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  //============ UTILITAIRES ============

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