import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type') || 'bearer';

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `${tokenType} ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
