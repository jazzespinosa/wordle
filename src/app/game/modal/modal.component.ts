import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../game.service';
import { CommonModule } from '@angular/common';

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

  constructor(private gameService: GameService) {}

  onNewGameStartModal() {
    this.isLoading = true;
    this.gameService.generateRandomWord().subscribe({
      next: (response) => {
        console.log('responseMap', response);
        // console.log('value', response['body'][0]);
        this.gameService.setNewGameAnswer(
          <string>response['body'][0].toUpperCase()
        );
      },
      error: (error) => {
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
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
