import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../game.service';
import { CommonModule } from '@angular/common';
import { catchError, map, throwError } from 'rxjs';

type ErrorType = {
  errorName: string;
  errorMessage: string;
};

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  selectedWordLength = 5;
  selectedMaxTurns = 6;
  isLoading = false;
  isError = false;
  ErrorType = { errorName: '', errorMessage: '' };

  constructor(private gameService: GameService) {}

  onNewGameStartModal() {
    this.isLoading = true;
    this.isError = false;
    this.ErrorType = { errorName: '', errorMessage: '' };

    this.gameService
      .generateRandomWord()
      .pipe(
        catchError((error) => {
          return throwError(() => new Error('Something went wrong.', error));
        }),
        map((response) => {
          let newWord = <string>response['word'];
          newWord.split('').forEach((element) => {
            if (!element.match(/[a-z]/i)) {
              // if (element.match(/[a-e]/i)) {
              console.log('error a-e', newWord);
              let error = new Error(
                'Something went wrong. Failed to generate new word.'
              );
              error.name = 'GenerateError';
              throw error;
            }
          });
          return response;
        })
      )
      .subscribe({
        next: (response) => {
          // console.log('responseMap', response);

          this.gameService.setNewGameAnswer(
            <string>response['word'].toUpperCase()
          );
        },
        error: (error) => {
          this.isLoading = false;
          this.isError = true;
          if (error.name === 'GenerateError') {
            this.ErrorType = {
              errorName: error.name,
              errorMessage: 'Failed to generate a new word. Click START again.',
            };
          } else {
            this.ErrorType = {
              errorName: error.name,
              errorMessage: error,
            };
          }
          console.log('error', error);
        },
        complete: () => {
          this.isLoading = false;
          this.isError = false;
          this.ErrorType = { errorName: '', errorMessage: '' };

          this.gameService.setGameConfig({
            wordLength: +this.selectedWordLength,
            maxTurns: +this.selectedMaxTurns,
          });
          this.gameService.setIsGameModalOpen(false);
          this.gameService.onNewGameStart();
        },
      });
  }

  onResumeModal() {
    this.gameService.setIsGameModalOpen(false);
  }
}
