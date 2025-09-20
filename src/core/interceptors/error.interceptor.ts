import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@features/auth/services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      //======= AUTH ERRORS =======
      
      if (error.status === 401 || error.status === 403) {
        if (!req.url.includes('/api/auth/')) {
          if (error.status === 401) {
            authService.logout('Session expirée, veuillez vous reconnecter');
          } else {
            authService.logout('Token invalide, veuillez vous reconnecter');
          }
          return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
        }
        
        const authErrorMessage = error.status === 401 ? 'Identifiants incorrects' : 'Accès non autorisé';
        return throwError(() => new Error(authErrorMessage));
      }
      
      //======= OTHER ERRORS =======
      
      if (error.status === 404) {
        return throwError(() => new Error('Ressource non trouvée'));
      }
      
      if (error.status >= 500) {
        return throwError(() => new Error('Erreur serveur, veuillez réessayer plus tard'));
      }
      
      if (error.status === 0) {
        return throwError(() => new Error('Erreur de connexion'));
      }
      
      const errorMessage = error.error?.error || error.message || 'Erreur inconnue';
      return throwError(() => new Error(errorMessage));
    })
  );
};