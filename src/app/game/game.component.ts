import { Component, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';

import { LetterContainerComponent } from './letter-container/letter-container.component';
import { KeyboardComponent } from './keyboard/keyboard.component';
import { GameService } from './game.service';
import { TurnModel } from './game.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    MatGridListModule,
    LetterContainerComponent,
    KeyboardComponent,
    CommonModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit {
  wordLength!: number;
  maxTurns!: number;
  gameStateValues!: TurnModel[];

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.wordLength = this.gameService.getWordLength();
    this.maxTurns = this.gameService.getMaxTurns();

    this.gameService.gameStateValues.subscribe((values) => {
      this.gameStateValues = values;
    });

    const turn = this.gameStateValues.length;
    this.gameService.currentTurn.next(turn);
  }

  isModalOpen = true;
  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    console.log('close modal triggered');
  }
}
