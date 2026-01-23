import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  onAuthStateChanged,
  updateProfile,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInAnonymously,
} from '@angular/fire/auth';
import { environment } from '../../../environments/environment';
import {
  BehaviorSubject,
  from,
  map,
  switchMap,
  Observable,
  of,
  catchError,
  throwError,
  tap,
  firstValueFrom,
} from 'rxjs';
import {
  LoginError,
  LoginResponseDto,
  SignUpResponseDto,
  UserModel,
} from './auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  private readonly baseUrl = environment.backendUrl;
  private googleProvider = new GoogleAuthProvider();

  constructor(
    private auth: Auth,
    private http: HttpClient,
    private router: Router,
    private destroyRef: DestroyRef,
  ) {}

  // ========== isLoading ==========
  private readonly isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this.isLoading.asObservable();
  setIsLoading(value: boolean) {
    this.isLoading.next(value);
  }

  // ========== user ==========
  private readonly user = new BehaviorSubject<UserModel | null>(null);
  readonly user$ = this.user.asObservable();
  getUser() {
    return this.user.getValue();
  }
  setUser(user: UserModel | null) {
    this.user.next(user);
  }

  async initializeAuth(): Promise<void> {
    // Don't run on server
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    try {
      console.log('[Auth] Checking for redirect result...');
      const redirectResult = await getRedirectResult(this.auth);

      if (redirectResult && redirectResult.user) {
        console.log('[Auth] Redirect result found:', redirectResult.user.email);
        // Validate with backend for Google sign-in
        const userData = await firstValueFrom(
          this.validateWithBackendGoogle(redirectResult),
        );
        if (userData && userData.email) {
          this.setUser(userData);
          this.router.navigate(['/home']);
          return; // Exit early - we've handled the auth
        }
      }
    } catch (error: any) {
      // Handle specific redirect errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('[Auth] Popup was closed by user');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('[Auth] Popup request was cancelled');
      } else if (error.code === 'auth/redirect-cancelled-by-user') {
        console.log('[Auth] Redirect was cancelled by user');
      } else {
        console.error('[Auth] Redirect result error:', error);
      }
    }

    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          console.log('[Auth] Auth state changed:', user?.email || 'null');
          if (user) {
            const email = user.email || '';
            const name =
              user.displayName ||
              user.email?.substring(0, user.email.indexOf('@')) ||
              '';
            const userData: UserModel = {
              email: email,
              name: name,
              isAnonymous: user.isAnonymous,
            };
            this.setUser(userData);
          }
          unsubscribe(); // Unsubscribe after first result
          resolve();
        },
        (error) => {
          console.error('[Auth] Auth state error:', error);
          resolve(); // Resolve anyway to prevent hanging
        },
      );
    });
  }

  // Login procedure
  // Step 1: Firebase auth
  // Step 2: Get token & validate with backend
  // Step 3: Set user data
  // Step 4: Handle errors
  login(email: string, password: string): Observable<UserModel> {
    return this.signOutIfNeeded().pipe(
      switchMap(() =>
        from(signInWithEmailAndPassword(this.auth, email, password)),
      ),
      switchMap((userCredential) => this.validateWithBackend(userCredential)),
      catchError((error) => throwError(() => this.mapLoginError(error))),
      tap((userData) => {
        this.setUser(userData);
      }),
    );
  }

  private validateWithBackend(
    userCredential: UserCredential,
  ): Observable<UserModel> {
    return from(userCredential.user.getIdToken(true)).pipe(
      switchMap((token) =>
        this.http.post<LoginResponseDto>(
          `${this.baseUrl}/api/user/login`,
          { Email: userCredential.user.email },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      ),
      map((response) => ({
        email: response.email,
        name: response.name,
        isAnonymous: false,
      })),
    );
  }

  private signOutIfNeeded(): Observable<void> {
    if (this.auth.currentUser) {
      return from(signOut(this.auth));
    }

    return of(undefined);
  }

  private mapLoginError(error: any): LoginError {
    const errorMessages: Record<string, string> = {
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/user-not-found': 'User not found.',
      'auth/user-disabled': 'User is disabled. Please contact administrator.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/email-already-in-use': 'Email already in use.',
    };

    return {
      message: errorMessages[error.code] || 'Login failed. Try again.',
    };
  }

  // Signup procedure
  // Step 1: Create user in Firebase
  // Step 2: Save user data in backend
  // Step 3: Set user data
  // Step 4: Handle errors
  signup(email: string, password: string, name: string): Observable<UserModel> {
    return this.signOutIfNeeded().pipe(
      switchMap(() =>
        from(
          createUserWithEmailAndPassword(this.auth, email, password).then(
            (userCredential) => {
              updateProfile(userCredential.user, {
                displayName: name,
              });
              return userCredential;
            },
          ),
        ),
      ),
      switchMap((userCredential) =>
        this.saveUserDataInBackend(userCredential, name),
      ),
      catchError((error) => throwError(() => this.mapSignUpError(error))),
      tap((userData) => {
        this.setUser(userData);
      }),
    );
  }

  private saveUserDataInBackend(
    userCredential: UserCredential,
    name: string,
  ): Observable<UserModel> {
    return from(userCredential.user.getIdToken(true)).pipe(
      switchMap((token) =>
        this.http.post<SignUpResponseDto>(
          `${this.baseUrl}/api/user/signup`,
          {
            Email: userCredential.user.email,
            Name: name,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      ),
      map((response) => ({
        email: response.email,
        name: response.name,
        isAnonymous: false,
      })),
    );
  }

  private mapSignUpError(error: any): LoginError {
    const errorMessages: Record<string, string> = {
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/email-already-in-use': 'Email already in use.',
    };

    return {
      message: errorMessages[error.code] || 'Signup failed. Try again.',
    };
  }

  loginWithGoogle() {
    return this.signOutIfNeeded().pipe(
      switchMap(() => from(signInWithRedirect(this.auth, this.googleProvider))),
    );
  }

  private validateWithBackendGoogle(
    userCredential: UserCredential | null,
  ): Observable<UserModel> {
    if (!userCredential) {
      return of({} as UserModel);
    }
    return from(userCredential.user.getIdToken(true)).pipe(
      switchMap((token) =>
        this.http.post<LoginResponseDto>(
          `${this.baseUrl}/api/user/login`,
          {
            Email: userCredential.user.email,
            Name: userCredential.user.displayName,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
      map((response) => ({
        email: response.email,
        name: response.name,
        isAnonymous: false,
      })),
    );
  }

  loginAsGuest(): Observable<UserModel> {
    return this.signOutIfNeeded().pipe(
      switchMap(() => from(this.onlineCheck())),
      switchMap(() => from(signInAnonymously(this.auth))),
      switchMap((userCredential) =>
        this.validateWithBackendAsGuest(userCredential),
      ),
      catchError((error) =>
        throwError(() => {
          if (
            error.name === 'HttpErrorResponse' &&
            error.url === `${this.baseUrl}/api/user/guest`
          ) {
            this.auth.currentUser?.delete();
          }

          return this.mapLoginError(error);
        }),
      ),
      tap((userData) => {
        this.setUser(userData);
      }),
    );
  }

  private validateWithBackendAsGuest(
    userCredential: UserCredential,
  ): Observable<UserModel> {
    return from(userCredential.user.getIdToken(true)).pipe(
      switchMap((token) =>
        this.http.post<LoginResponseDto>(
          `${this.baseUrl}/api/user/guest`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      ),
      map((response) => {
        updateProfile(userCredential.user, {
          displayName: response.name,
        });
        return {
          email: response.email,
          name: response.name,
          isAnonymous: true,
        };
      }),
    );
  }

  onlineCheck() {
    return this.http.get<any>(`${this.baseUrl}/api/util/online`);
  }

  logout() {
    this.signOutIfNeeded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.setUser(null);
  }
}
