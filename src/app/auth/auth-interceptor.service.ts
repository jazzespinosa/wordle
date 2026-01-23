import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getAuth } from '@angular/fire/auth';
import { initializeApp } from '@angular/fire/app';
const SKIP_URLS = ['api/user/signup', 'api/user/login', 'api/util/online'];

export const AuthInterceptorService: HttpInterceptorFn = (req, next) => {
  const auth = getAuth(initializeApp(environment.firebaseConfig));

  // Skip interceptor for auth endpoints
  if (SKIP_URLS.some((url) => req.url.includes(url))) {
    return next(req);
  }

  // Skip if Authorization header already exists
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  return from(auth.authStateReady()).pipe(
    switchMap(() => {
      const user = auth.currentUser;

      if (!user) {
        console.log('AuthInterceptorService - no user');
        return next(req);
      }

      return from(user.getIdToken()).pipe(
        switchMap((token) => {
          const cloned = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
          return next(cloned);
        }),
      );
    }),
  );
};
