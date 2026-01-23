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
} from 'rxjs';
import {
  LoginError,
  LoginResponseDto,
  SignUpResponseDto,
  UserModel,
} from './auth.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);

  private readonly baseUrl = environment.backendUrl;

  constructor(
    private auth: Auth,
    private http: HttpClient,
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

  initializeAuth(): Promise<void> {
    // Don't run on server
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          if (user) {
            let email = user.email || '';
            let name =
              user.displayName ||
              user.email?.substring(0, user.email.indexOf('@')) ||
              '';
            const userData: UserModel = {
              email: email,
              name: name,
              isAnonymous: user.isAnonymous,
            };
            this.setUser(userData);
            this.handleAuth(userData, user.isAnonymous);
          }
          unsubscribe(); // Unsubscribe after first result
          resolve();
        },
        (error) => {
          console.error('Auth state error:', error);
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
        this.handleAuth(userData, false);
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
        this.handleAuth(userData, false);
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
      switchMap(() =>
        from(
          signInWithRedirect(
            this.auth,
            new GoogleAuthProvider(),
            // browserPopupRedirectResolver,
          ),
        ),
      ),
    );
  }

  checkGoogleLogin(): Observable<UserModel | null> {
    return from(getRedirectResult(this.auth)).pipe(
      switchMap((result) => {
        if (result) {
          return this.validateWithBackendGoogle(result);
        }
        // Fallback: Check if user is already signed in via persistence
        const currentUser = this.auth.currentUser;
        if (currentUser) {
          return this.validateWithBackendGoogle({
            user: currentUser,
          } as UserCredential);
        }
        return of(null);
      }),
      tap((userData) => {
        if (userData) {
          this.handleAuth(userData, false);
        }
      }),
      catchError((error) => throwError(() => this.mapLoginError(error))),
    );
  }

  private validateWithBackendGoogle(
    // oAuthCredential: OAuthCredential | null,
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
        this.handleAuth(userData, true);
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

  // autoLogout(expirationDuration: number) {
  //   this.tokenExpiration = setTimeout(() => {
  //     this.logout();
  //   }, expirationDuration);
  // }

  logout() {
    this.signOutIfNeeded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.setUser(null);
    // if (this.tokenExpiration) {
    //   clearTimeout(this.tokenExpiration);
    // }
  }

  private handleAuth(user: UserModel, isAnonymous: boolean) {
    this.setUser(user);

    if (isAnonymous) {
      // clearTimeout(this.tokenExpiration);
    } else {
      var dateNow = new Date();
      this.getExpirationTime()
        .pipe(
          map((result) => {
            let expiryDate = new Date(result);
            let timeLeft = expiryDate.getTime() - dateNow.getTime();
            // this.autoLogout(timeLeft);
          }),
        )
        .subscribe();
    }
  }

  private getExpirationTime(): Observable<string> {
    var getIdTokenResult = this.auth.currentUser?.getIdTokenResult();

    if (getIdTokenResult) {
      return from(getIdTokenResult).pipe(
        map((result) => result.expirationTime),
      );
    }
    return of('');
  }
}
