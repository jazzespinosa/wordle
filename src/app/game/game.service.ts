import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  type CellModel,
  GameConfig,
  LetterState,
  type TurnModel,
} from './game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly INITIAL_WORD_LENGTH = 5;
  private readonly INITIAL_MAX_TURNS = 6;
  answer = 'WORDS';

  isGameModalOpen = new BehaviorSubject<boolean>(false);
  tempTurnValue = new BehaviorSubject<string>('');
  gameConfig = new BehaviorSubject<GameConfig>({
    wordLength: this.INITIAL_WORD_LENGTH,
    maxTurns: this.INITIAL_MAX_TURNS,
  });
  gameStateValues = new BehaviorSubject<TurnModel[]>([]);

  // private wordLength = this.INITIAL_WORD_LENGTH;
  // private maxTurns = this.INITIAL_MAX_TURNS;

  onChangeTurnValue(newValue: string) {
    if (newValue.length <= this.gameConfig.value.wordLength) {
      this.tempTurnValue.next(newValue);
      // this.tempTurnValue.pipe(take(1)).subscribe((value) => {
      //   console.log('turnvalue', value);
      // });
    }
  }

  onEnterValue(enteredValue: string) {
    // check if valid from API?
    if (this.checkIfValid()) {
      let cellValues: CellModel[] = [];
      for (let i = 0; i < enteredValue.length; i++) {
        // check state of letter
        let state = LetterState.default;

        for (let j = 0; j < this.answer.length; j++) {
          if (enteredValue[i] === this.answer[j] && i === j) {
            state = LetterState.correct;
            break;
          } else if (enteredValue[i] === this.answer[j]) {
            state = LetterState.present;
            break;
          } else {
            state = LetterState.incorrect;
          }
        }

        cellValues.push({
          state: state,
          value: enteredValue[i],
        });
      }

      this.gameStateValues.next([
        ...this.gameStateValues.value,
        {
          turnValue: enteredValue,
          cellValue: cellValues,
        },
      ]);

      this.tempTurnValue.next('');

      console.log(this.gameStateValues);
    }
  }

  // replace wih valid word checker
  checkIfValid() {
    return true;
  }

  // getWordLength() {
  //   return this.gameConfig.value.wordLength;
  // }

  // setWordLength(length: number) {
  //   this.wordLength = length;
  // }

  // getMaxTurns() {
  //   return this.maxTurns;
  // }

  // setMaxTurn(turns: number) {
  //   this.maxTurns = turns;
  // }
}
