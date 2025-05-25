// auth.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../services/auth.service';

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
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit, OnDestroy {
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private authService = inject(AuthService);

  // Signals pour l'état du composant
  authMode = signal<'login' | 'register'>('login');
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Données des formulaires
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

  // Animation du terminal - Supprimées
  private typingInterval?: number;
  private cursorInterval?: number;

  ngOnInit(): void {
    // Détecter le mode depuis l'URL
    const url = this.router.url;
    if (url.includes('/register')) {
      this.authMode.set('register');
    } else {
      this.authMode.set('login');
    }
    
    // Si déjà connecté, rediriger
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/chroniques']);
    }
  }

  ngOnDestroy(): void {
    // Plus d'animations à nettoyer
  }

  // ============ NAVIGATION ============

  goBack(): void {
    this.location.back();
  }

  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.clearMessages();
    
    // Mettre à jour l'URL
    const newUrl = mode === 'register' ? '/auth/register' : '/auth/login';
    this.location.replaceState(newUrl);
  }

  // ============ AUTHENTIFICATION ============

  onLogin(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.error.set('Tous les champs sont requis');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        console.log('✅ Connexion réussie');
        
        // Rediriger vers les chroniques ou la page précédente
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/chroniques';
        this.router.navigate([returnUrl]);
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Erreur de connexion:', error);
        
        let errorMessage = 'Erreur de connexion';
        if (error.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  onRegister(): void {
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.error.set('Tous les champs obligatoires sont requis');
      return;
    }

    if (this.registerData.password.length < 6) {
      this.error.set('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    this.loading.set(true);
    this.clearMessages();

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        console.log('✅ Inscription réussie');
        
        this.successMessage.set('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        
        // Réinitialiser le formulaire
        this.registerData = {
          username: '',
          email: '',
          password: '',
          description: ''
        };
        
        // Passer en mode connexion après 2 secondes
        setTimeout(() => {
          this.setAuthMode('login');
        }, 2000);
        
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Erreur d\'inscription:', error);
        
        let errorMessage = 'Erreur lors de l\'inscription';
        if (error.status === 409) {
          errorMessage = 'Cet email ou nom d\'utilisateur est déjà utilisé';
        } else if (error.status === 0) {
          errorMessage = 'Impossible de contacter le serveur';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        this.error.set(errorMessage);
        this.loading.set(false);
      }
    });
  }

  // ============ UTILITAIRES ============

  private clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  getSystemStatus(): string {
    if (this.loading()) return 'TRAITEMENT...';
    if (this.error()) return 'ERREUR DÉTECTÉE';
    if (this.successMessage()) return 'OPÉRATION RÉUSSIE';
    return 'SYSTÈME OPÉRATIONNEL';
  }

  // Getters pour les validations
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