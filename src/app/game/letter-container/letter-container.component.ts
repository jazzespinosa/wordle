import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { map, Observable, Subscription, tap } from 'rxjs';
import {
  AnimationEvent,
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-letter-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './letter-container.component.html',
  styleUrl: './letter-container.component.css',
  animations: [
    trigger('cellAnimate', [
      state(
        'hasValue',
        style({
          // 'background-color': 'red',
          opacity: 1,
          transform: 'translateX(0)',
        })
      ),
      state(
        'hasNoValue',
        style({
          // 'background-color': 'purple',
          opacity: 0,
          transform: 'translateX(-2rem)',
        })
      ),
      transition('hasNoValue <=> hasValue', animate(300)),
    ]),
  ],
})
export class LetterContainerComponent implements OnInit, OnDestroy {
  @Input() turnIndex!: number; //row
  @Input() letterIndex!: number; //column
  // @Input() TurnValue!: TurnModel;
  // turnValue!: Observable<string>;
  cellValue!: string;

  currentTurn = 0;
  currentTurnValue = '';
  prevTurnValue = '';

  cellStateClass = 'default';
  animateState = 'hasNoValue';

  isGameOver!: Observable<boolean>;

  private subsGetTurnValue!: Subscription;
  private subsGetState!: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.subsGetState = this.gameService.gameStateValues$
      .pipe(tap((values) => (this.currentTurn = values.length)))
      .subscribe((value) => {
        if (value[this.turnIndex]) {
          this.cellStateClass =
            value[this.turnIndex].cellValue[this.letterIndex].state.toString();
        }
        if (value.length === 0) {
          this.cellStateClass = 'default';
        }

        let turnValue = value[this.turnIndex];
        if (turnValue) {
          this.cellValue = turnValue.turnValue[this.letterIndex];
        } else {
          this.cellValue = ' ';
        }
      });

    this.subsGetTurnValue = this.gameService.tempTurnValue$.subscribe(
      (value) => {
        this.prevTurnValue = this.currentTurnValue;
        this.currentTurnValue = value[this.letterIndex]
          ? value[this.letterIndex]
          : '';
        if (
          (this.currentTurnValue && this.currentTurn === this.turnIndex) ||
          this.currentTurn > this.turnIndex
        ) {
          this.animateState = 'hasValue';
        } else {
          this.animateState = 'hasNoValue';
        }
      }
    );

    this.isGameOver = this.gameService.isGameOver$.pipe(
      map((value) => value.isGameOver)
    );
  }

  ngOnDestroy(): void {
    this.subsGetTurnValue.unsubscribe();
    this.subsGetState.unsubscribe();
  }

  onAnimateStart(event: AnimationEvent) {
    if (event.toState === 'hasNoValue') {
      this.currentTurnValue = this.prevTurnValue;
    }
  }
}
