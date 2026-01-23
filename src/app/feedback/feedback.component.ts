import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { FeedbackService } from './feedback.service';
import {
  CategoryOption,
  FeedbackCategory,
  FeedbackDto,
} from './feedback.model';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
})
export class FeedbackComponent {
  constructor(
    private authService: AuthService,
    private feedbackService: FeedbackService,
    private router: Router,
  ) {}

  // Category options
  categories: CategoryOption[] = [
    { value: 'BUG', label: 'Bug Report', icon: 'bug_report', color: '#ff6b6b' },
    {
      value: 'SUGGESTION',
      label: 'Suggestion',
      icon: 'lightbulb',
      color: '#feca57',
    },
    {
      value: 'RECOMMENDATION',
      label: 'Recommendation',
      icon: 'star',
      color: '#4facfe',
    },
    { value: 'GENERAL', label: 'General', icon: 'chat', color: '#2ed573' },
  ];

  // Form state
  selectedCategory: FeedbackCategory | null = null;
  subject = '';
  description = '';
  isAnonymous = false;
  allowContact = true;

  // UI state
  isLoading = false;
  isSubmitted = false;
  errorMessage = '';

  get user$() {
    return this.authService.user$;
  }

  get isBugReport(): boolean {
    return this.selectedCategory === 'BUG';
  }

  get isFormValid(): boolean {
    return (
      this.selectedCategory !== null &&
      this.subject.trim().length >= 3 &&
      this.description.trim().length >= 10
    );
  }

  selectCategory(category: FeedbackCategory): void {
    this.selectedCategory = category;
  }

  toggleAnonymous(): void {
    this.isAnonymous = !this.isAnonymous;
    // If anonymous, disable contact option
    if (this.isAnonymous) {
      this.allowContact = false;
    }
  }

  submitFeedback(): void {
    if (!this.isFormValid || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const feedback: FeedbackDto = {
      category: this.selectedCategory!,
      subject: this.subject.trim(),
      description: this.description.trim(),
      isAnonymous: this.isAnonymous,
      allowContact: this.isAnonymous ? false : this.allowContact,
    };

    this.feedbackService.submitFeedback(feedback).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message ||
          'Failed to submit feedback. Please try again.';
      },
    });
  }

  resetForm(): void {
    this.selectedCategory = null;
    this.subject = '';
    this.description = '';
    this.isAnonymous = false;
    this.allowContact = true;
    this.isSubmitted = false;
    this.errorMessage = '';
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
