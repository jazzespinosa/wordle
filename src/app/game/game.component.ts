import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { BehaviorSubject, Observable, Subscription, take, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { KeyboardComponent } from './keyboard/keyboard.component';
import { GameService } from './game.service';
import { GameConfig, type TurnModel } from './game.model';
import { LetterContainerComponent } from './letter-container/letter-container.component';
import { ModalComponent } from './modal/modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    MatGridListModule,
    LetterContainerComponent,
    KeyboardComponent,
    ModalComponent,
    CommonModule,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnInit, OnDestroy {
  // wordLength!: number;
  // maxTurns!: number;

  isModalOpen!: BehaviorSubject<boolean>;
  gameStateValues!: TurnModel[];
  gameConfig!: BehaviorSubject<GameConfig>;
  // wordLength!: Observable<GameConfig>;
  // maxTurns!: Observable<GameConfig>;

  private subsGameStateValues!: Subscription;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // this.subsGameConfig = this.gameService.gameConfig.subscribe((values) => {
    //   this.wordLength = +values.wordLength;
    //   this.maxTurns = +values.maxTurns;
    //   console.log(values);
    // });
    this.subsGameStateValues = this.gameService.gameStateValues.subscribe(
      (values) => {
        this.gameStateValues = values;
      }
    );

    this.isModalOpen = this.gameService.isGameModalOpen;
    this.gameConfig = this.gameService.gameConfig;

    // this.wordLength = this.gameService.gameConfig.pipe(
    //   tap((value) => {
    //     return value.wordLength;
    //   })
    // );
    // this.maxTurns = this.gameService.gameConfig.pipe(
    //   tap((value) => {
    //     return value.maxTurns;
    //   })
    // );
  }

  ngOnDestroy(): void {
    this.subsGameStateValues.unsubscribe();
    // this.subsGameConfig.unsubscribe();
  }

  onCloseModal() {
    this.gameService.isGameModalOpen.next(false);
  }

  onNewGameStartModal() {
    this.gameService.isGameModalOpen.next(false);
    this.gameService.gameStateValues.next([]);
  }
}
