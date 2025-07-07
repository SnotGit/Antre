import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

interface ErrorState {
  message: string;
  code?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandler {

  //============ EXTRACTION MESSAGE D'ERREUR ============

  extractErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.error || error.message || 'Erreur serveur';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'Erreur inconnue';
  }

  //============ GESTION ERREURS API ============

  handleApiError(error: any): ErrorState {
    const message = this.extractErrorMessage(error);
    
    const errorState: ErrorState = {
      message,
      timestamp: new Date()
    };

    if (error instanceof HttpErrorResponse) {
      errorState.code = error.status?.toString();
    }

    return errorState;
  }

  //============ MISE À JOUR SIGNAL D'ERREUR ============

  setError(errorSignal: any, error: any): void {
    const errorMessage = this.extractErrorMessage(error);
    errorSignal.set(errorMessage);
  }

  //============ GESTION ERREURS SPÉCIFIQUES ============

  handleAuthError(error: any): string {
    const message = this.extractErrorMessage(error);
    
    if (message.includes('Email ou mot de passe')) {
      return 'Email ou mot de passe incorrect';
    }
    
    if (message.includes('Token')) {
      return 'Session expirée, reconnexion nécessaire';
    }
    
    return message;
  }

  handleFormError(error: any): string {
    const message = this.extractErrorMessage(error);
    
    if (message.includes('required')) {
      return 'Tous les champs obligatoires doivent être remplis';
    }
    
    if (message.includes('email')) {
      return 'Format d\'email invalide';
    }
    
    if (message.includes('password')) {
      return 'Le mot de passe ne respecte pas les critères';
    }
    
    return message;
  }

  //============ UTILITAIRES ============

  isNetworkError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status === 0;
  }

  isServerError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status >= 500;
  }

  isClientError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500;
  }
}