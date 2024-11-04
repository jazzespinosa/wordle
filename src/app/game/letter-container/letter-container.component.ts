import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';
import { TempTurnModel, TurnModel } from '../game.model';
import { GameService } from '../game.service';
import { mergeMap, Subscription, take } from 'rxjs';

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

  tempTurnValue!: TempTurnModel;
  cellStateClass = '';

  private subsGetTurn!: Subscription;
  private subsGetState!: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.subsGetTurn = this.gameService.tempTurnValue.subscribe((value) => {
      this.tempTurnValue = value;
    });

    this.subsGetState = this.gameService.gameStateValues.subscribe((values) => {
      if (values[this.turnIndex]) {
        this.cellStateClass =
          values[this.turnIndex].cellValue[this.letterIndex].state.toString();

        console.log(this.cellStateClass);
      }

      // console.log(values);
      // console.log(this.cellStateClass);
    });
  }

  ngOnDestroy(): void {
    this.subsGetTurn.unsubscribe();
    this.subsGetState.unsubscribe();
  }
}
