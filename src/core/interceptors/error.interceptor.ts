import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const router = inject(Router);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      //======= AUTH ERRORS =======
      
      if (error.status === 401) {
        if (!req.url.includes('/api/auth/')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.navigate(['/auth/login']);
          return throwError(() => new Error('Session expirée, veuillez vous reconnecter'));
        }
      }
      
      //======= OTHER ERRORS =======
      
      if (error.status === 403) {
        return throwError(() => new Error('Accès non autorisé'));
      }
      
      if (error.status === 404) {
        return throwError(() => new Error('Ressource non trouvée'));
      }
      
      if (error.status >= 500) {
        return throwError(() => new Error('Erreur serveur, veuillez réessayer plus tard'));
      }
      
      const errorMessage = error.error?.error || error.message || 'Erreur inconnue';
      return throwError(() => new Error(errorMessage));
    })
  );
};