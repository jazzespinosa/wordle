import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { map, Observable, pluck, Subscription, tap } from 'rxjs';

import { KeyboardComponent } from './keyboard/keyboard.component';
import { GameService } from './game.service';
import { type GameOverModel, type GameConfig } from './game.model';
import { LetterContainerComponent } from './letter-container/letter-container.component';
import { ModalComponent } from './modal/modal.component';
import { CommonModule } from '@angular/common';
import { GameoverModalComponent } from './gameover-modal/gameover-modal.component';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    MatGridListModule,
    LetterContainerComponent,
    KeyboardComponent,
    ModalComponent,
    GameoverModalComponent,
    CommonModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, OnDestroy {
  isModalOpen!: Observable<boolean>;
  gameConfig!: Observable<GameConfig>;
  isGameOverModalOpen!: Observable<boolean>;
  isGameOver!: Observable<GameOverModel>;
  answer!: Observable<string>;
  answerLink = '';

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.isModalOpen = this.gameService.isGameModalOpen$;
    this.gameConfig = this.gameService.gameConfig$;
    this.isGameOverModalOpen = this.gameService.isGameOverModalOpen$;
    this.isGameOver = this.gameService.isGameOver$;
    this.answer = this.gameService.answer$.pipe(
      tap((value) => {
        this.answerLink =
          'https://www.google.com/search?q=' + value.toLowerCase();
      })
    );
  }

  ngOnDestroy(): void {
    this.gameService.clearTempTurn();
  }
}
