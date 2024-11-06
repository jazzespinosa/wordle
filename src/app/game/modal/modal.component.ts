import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameService } from '../game.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  // @Output() cancelModal = new EventEmitter<void>();
  @Output() newGameStartModal = new EventEmitter<void>();
  @Output() resumeModal = new EventEmitter<void>();

  isNewGame = false;
  selectedWordLength = 5;
  selectedMaxTurns = 6;

  constructor(private gameService: GameService) {}

  onNewGameClicked() {
    this.isNewGame = !this.isNewGame;
  }

  // onCancelModal() {
  //   this.cancelModal.emit();
  // }

  onNewGameStartModal() {
    this.gameService.gameConfig.next({
      wordLength: +this.selectedWordLength,
      maxTurns: +this.selectedMaxTurns,
    });

    this.newGameStartModal.emit();
  }

  onResumeModal() {
    this.resumeModal.emit();
  }
}
