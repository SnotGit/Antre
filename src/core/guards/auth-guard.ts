import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@features/auth/services/auth.service';

//======= AUTH GUARD FINAL =======

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.initializing()) {
    return false;
  }
  
  const currentUser = authService.currentUser();
  
  if (!currentUser) {
    return router.parseUrl('/auth/login');
  }
  
  return true;
};