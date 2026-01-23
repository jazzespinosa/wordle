import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { LoginError } from './auth.model';
import { Observable, Subscription, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AlertComponent } from '../shared/alert/alert.component';
import { LoadingSpinnerComponent } from '../shared/loading-spinner/loading-spinner.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AlertComponent,
    LoadingSpinnerComponent,
    CommonModule,
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  loginForm!: FormGroup;
  signUpForm!: FormGroup;
  toggleIsSignUp = false; // toggle
  isLoginSubmit = false;
  isSignUpSubmit = false;
  isLoading!: Observable<boolean>;
  isLoginPasswordVisible = false;
  isSignUpPasswordVisible = false;

  error = {
    hasError: false,
    type: 'error' as 'error' | 'warning',
    title: 'Error',
    message: '',
  };

  loginButtonErrorMessage: string | null = null;
  signUpButtonErrorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.isLoading = this.authService.isLoading$;

    this.loginForm = this.formBuilder.group({
      loginInputEmail: [
        '',
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(64),
        ]),
      ],
      loginInputPassword: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(64),
        ]),
      ],
    });

    this.signUpForm = this.formBuilder.group({
      signUpInputName: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(64),
        ]),
      ],
      signUpInputEmail: [
        '',
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(64),
        ]),
      ],
      signUpInputPassword: [
        '',
        Validators.compose([
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(64),
        ]),
      ],
    });
  }

  onLogIn(): void {
    this.authService.setIsLoading(true);
    this.isLoginSubmit = true;
    this.isSignUpSubmit = false;
    this.loginButtonErrorMessage = null;

    if (this.loginForm.invalid) {
      this.error = {
        hasError: true,
        type: 'error',
        title: 'Invalid Form',
        message: 'Form is invalid! Please check the fields.',
      };

      this.authService.setIsLoading(false);
      return;
    }

    const loginEmail = this.loginForm.value.loginInputEmail;
    const loginPassword = this.loginForm.value.loginInputPassword;

    this.authService
      .login(loginEmail, loginPassword)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
          this.loginButtonErrorMessage = null;
        },
        error: (err: LoginError) => {
          this.loginButtonErrorMessage = err.message;
          this.authService.setIsLoading(false);
        },
        complete: () => {
          this.authService.setIsLoading(false);
        },
      });
  }

  onSignUp() {
    this.authService.setIsLoading(true);

    this.isLoginSubmit = false;
    this.isSignUpSubmit = true;
    this.signUpButtonErrorMessage = null;

    if (this.signUpForm.invalid) {
      this.error = {
        hasError: true,
        type: 'error',
        title: 'Invalid Form',
        message: 'Form is invalid! Please check the fields.',
      };

      this.authService.setIsLoading(false);
      return;
    }

    const email = this.signUpForm.value.signUpInputEmail;
    const password = this.signUpForm.value.signUpInputPassword;
    const name = this.signUpForm.value.signUpInputName;

    this.authService
      .signup(email, password, name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
          this.signUpButtonErrorMessage = null;
        },
        error: (err: LoginError) => {
          this.signUpButtonErrorMessage = err.message;
          this.authService.setIsLoading(false);
        },
        complete: () => {
          this.authService.setIsLoading(false);
        },
      });
  }

  onLoginWithGoogle() {
    this.authService.setIsLoading(true);

    this.authService
      .loginWithGoogle()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: any) => {
          this.loginButtonErrorMessage = err.message;
          this.authService.setIsLoading(false);
        },
      });
  }

  onLoginAsGuest() {
    this.authService.setIsLoading(true);
    this.loginButtonErrorMessage = null;

    this.authService
      .loginAsGuest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
          this.loginButtonErrorMessage = null;
        },
        error: (err: LoginError) => {
          this.loginButtonErrorMessage = err.message;
          this.authService.setIsLoading(false);
        },
        complete: () => {
          this.authService.setIsLoading(false);
        },
      });
  }

  toggleButton(): void {
    this.toggleIsSignUp = !this.toggleIsSignUp;
    this.reset();
  }

  toggleLoginPasswordVisibility(): void {
    this.isLoginPasswordVisible = !this.isLoginPasswordVisible;
  }

  toggleSignUpPasswordVisibility(): void {
    this.isSignUpPasswordVisible = !this.isSignUpPasswordVisible;
  }

  OnCancel() {
    this.error = {
      hasError: false,
      type: 'error',
      title: 'Error',
      message: '',
    };
  }

  private reset() {
    this.authService.setIsLoading(false);
    this.isLoginSubmit = false;
    this.isSignUpSubmit = false;
    this.loginButtonErrorMessage = null;
    this.signUpButtonErrorMessage = null;
    this.loginForm.reset();
    this.signUpForm.reset();
  }

  get loginInputEmail() {
    return this.loginForm.controls['loginInputEmail'];
  }

  get loginInputPassword() {
    return this.loginForm.controls['loginInputPassword'];
  }

  get signUpInputName() {
    return this.signUpForm.controls['signUpInputName'];
  }

  get signUpInputEmail() {
    return this.signUpForm.controls['signUpInputEmail'];
  }

  get signUpInputPassword() {
    return this.signUpForm.controls['signUpInputPassword'];
  }
}
