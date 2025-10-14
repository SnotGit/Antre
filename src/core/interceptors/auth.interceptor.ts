import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '@features/auth/services/token.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenService = inject(TokenService);
  
  //======= PUBLIC ROUTES =======
  
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health',
    '/api/chroniques/stories/latest'
  ];

  //======= PUBLIC STORIES READING =======
  
  const isPublicStoryRead = req.url.includes('/api/chroniques/stories/') && 
                           !req.url.includes('/drafts') && 
                           !req.url.includes('/published') &&
                           req.method === 'GET';

  //======= PUBLIC USER STORIES =======
  
  //======= PUBLIC USER STORIES =======

const isPublicUserStories = req.url.match(/\/api\/chroniques\/stories\/user\/\d+/) &&  
                           req.method === 'GET';
                           
  //======= PUBLIC LIKES COUNT =======
  
  const isPublicLikesCount = req.url.includes('/api/user/likes/story/') && 
                            req.url.includes('/count');

  //======= CHECK IF PUBLIC ROUTE =======
  
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route)) ||
                       isPublicStoryRead ||
                       isPublicUserStories ||
                       isPublicLikesCount;
  
  if (isPublicRoute) {
    return next(req);
  }

  //======= ADD TOKEN FOR PRIVATE ROUTES =======
  
  const token = tokenService.getToken();
  
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