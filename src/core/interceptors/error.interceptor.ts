import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Gestion des erreurs d'authentification
      if (error.status === 401) {
        // Token invalide ou expiré
        localStorage.removeItem('antre_auth_token');
        localStorage.removeItem('antre_user');
        router.navigate(['/auth/login']);
        return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
      }
      
      // Gestion des erreurs 403 (forbidden)
      if (error.status === 403) {
        return throwError(() => new Error('Accès non autorisé'));
      }
      
      // Gestion des erreurs 404
      if (error.status === 404) {
        return throwError(() => new Error('Ressource non trouvée'));
      }
      
      // Gestion des erreurs 500
      if (error.status >= 500) {
        return throwError(() => new Error('Erreur serveur, veuillez réessayer plus tard'));
      }
      
      // Autres erreurs
      const errorMessage = error.error?.error || error.message || 'Erreur inconnue';
      return throwError(() => new Error(errorMessage));
    })
  );
};