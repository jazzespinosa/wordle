import { Injectable } from '@angular/core';
import { BehaviorSubject, map, of, Subject, take, tap } from 'rxjs';
import { CellModel, LetterState, TempTurnModel, TurnModel } from './game.model';

@Injectable({ providedIn: 'root' })
export class GameService {
  answer = 'WORDS';

  currentTurn = new BehaviorSubject<number>(0);

  tempTurnValue = new BehaviorSubject<TempTurnModel>({
    turn: 0,
    turnValue: '',
  });

  gameStateValues = new BehaviorSubject<TurnModel[]>([]);

  private readonly wordLength = 5;
  private readonly maxTurns = 6;

  onChangeTurnValue(newValue: string) {
    if (newValue.length <= this.wordLength) {
      this.tempTurnValue.next({
        turn: this.currentTurn.value,
        turnValue: newValue,
      });
      this.tempTurnValue.pipe(take(1)).subscribe((value) => {
        console.log('turnvalue', value);
      });
    }
  }

  onEnterValue(enteredValue: string) {
    // check if valid from API?
    if (this.checkIfValid()) {
      // this.allTurnValues.next([...this.allTurnValues.value, enteredValue]);

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
          // turnIndex: this.currentTurn.value,
          // letterIndex: i,
          state: state,
          value: enteredValue[i],
        });
      }

      this.gameStateValues.next([
        ...this.gameStateValues.value,
        {
          // turnIndex: this.currentTurn.value,
          turnValue: enteredValue,
          cellValue: cellValues,
        },
      ]);

      console.log(this.gameStateValues);

      this.currentTurn.next(this.currentTurn.value + 1);
    }
  }

  // replace wih valid word checker
  checkIfValid() {
    return true;
  }

  getWordLength() {
    return this.wordLength;
  }

  getMaxTurns() {
    return this.maxTurns;
  }

  getCurrentTurn() {
    return this.currentTurn.value;
  }
}
