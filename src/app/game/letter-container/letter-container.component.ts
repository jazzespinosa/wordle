import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { type TurnModel } from '../game.model';
import { GameService } from '../game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-letter-container',
  standalone: true,
  imports: [CardComponent],
  templateUrl: './letter-container.component.html',
  styleUrl: './letter-container.component.css',
})
export class LetterContainerComponent implements OnInit, OnDestroy {
  @Input() turnIndex!: number; //row
  @Input() letterIndex!: number; //column
  @Input() TurnValue!: TurnModel;

  currentTurn = 0;
  currentTurnValue = '';
  cellStateClass = 'default';

  private subsGetTurnValue!: Subscription;
  private subsGetState!: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.subsGetTurnValue = this.gameService.tempTurnValue.subscribe(
      (value) => {
        this.currentTurnValue = value;
      }
    );

    this.subsGetState = this.gameService.gameStateValues.subscribe((values) => {
      if (values[this.turnIndex]) {
        this.cellStateClass =
          values[this.turnIndex].cellValue[this.letterIndex].state.toString();
      }
      this.currentTurn = values.length;
    });
  }

  ngOnDestroy(): void {
    this.subsGetTurnValue.unsubscribe();
    this.subsGetState.unsubscribe();
  }
}
