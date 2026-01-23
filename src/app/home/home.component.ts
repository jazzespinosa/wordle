import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map, Observable, tap } from 'rxjs';
import { UserModel } from '../auth/auth.model';
import { GameService } from '../game/game.service';
import { GameHistoryModel } from '../game/game.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface GameHistory {
  date: Date;
  word: string;
  result: 'Win' | 'Loss';
  turns: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  user!: Observable<UserModel | null>;
  hasExistingGame: boolean = false;
  showStats = true;
  welcomeLetters = 'WELCOME'.split('');

  gamesPlayed = 0;
  winPercentage = 0;
  currentStreak = 0;
  homeHistory: GameHistoryModel[] = [];

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private router: Router,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.user$;

    this.gameService
      .getHomeStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((value) => {
          this.hasExistingGame = value.hasExistingGame;
          this.gamesPlayed = value.gamesPlayed;
          this.winPercentage = value.winPercentage;
          this.currentStreak = value.currentStreak;
          this.homeHistory = value.homeGameHistories;
        }),
      )
      .subscribe();
  }

  toggleStats() {
    this.showStats = !this.showStats;
  }

  navigateToGame() {
    this.router.navigate(['/play']);
  }
}
