import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@features/auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  
  // Routes publiques qui n'ont pas besoin d'authentification
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/chroniques/stories/latest',
    '/api/chroniques/stories/'
  ];

  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));
  
  if (isPublicRoute) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq);
  }
  
  return next(req);
};