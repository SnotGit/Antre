import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';

//============ AUTH GUARD SIMPLIFIÉ ============

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.currentUser();
  
  //============ VÉRIFICATION SIMPLE ============
  
  if (!currentUser) {
    return router.parseUrl('/auth/login');
  }
  
  return true;
};