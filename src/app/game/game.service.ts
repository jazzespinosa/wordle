import { Injectable } from '@angular/core';
import { BehaviorSubject, map, take, tap } from 'rxjs';
import {
  type CellModel,
  type GameConfig,
  type GameOverModel,
  LetterState,
  type TurnModel,
} from './game.model';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly INITIAL_WORD_LENGTH = 5;
  private readonly INITIAL_MAX_TURNS = 6;

  private environment = new Environment();
  private host = this.environment.getApiHost();
  private url = this.environment.getApiUrl();
  private key = this.environment.getApiKey();
  private ua = this.environment.getApiUa();

  private answer = new BehaviorSubject<string>('QWERT');
  answer$ = this.answer.asObservable();

  private isGameModalOpen = new BehaviorSubject<boolean>(false);
  isGameModalOpen$ = this.isGameModalOpen.asObservable();

  private isGameOverModalOpen = new BehaviorSubject<boolean>(false);
  isGameOverModalOpen$ = this.isGameOverModalOpen.asObservable();

  private keyboardState = new BehaviorSubject<CellModel>({
    value: '',
    state: LetterState.default,
  });
  keyboardState$ = this.keyboardState.asObservable();

  private tempTurnValue = new BehaviorSubject<string>('');
  tempTurnValue$ = this.tempTurnValue.asObservable();

  private gameConfig = new BehaviorSubject<GameConfig>({
    wordLength: this.INITIAL_WORD_LENGTH,
    maxTurns: this.INITIAL_MAX_TURNS,
  });
  gameConfig$ = this.gameConfig.asObservable();

  private gameStateValues = new BehaviorSubject<TurnModel[]>([]);
  gameStateValues$ = this.gameStateValues.asObservable();

  private isGameOver = new BehaviorSubject<GameOverModel>({
    isGameOver: false,
    isWin: false,
  });
  isGameOver$ = this.isGameOver.asObservable();

  constructor(private http: HttpClient) {}

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
      let isWinner = true;
      const answer = this.answer.getValue();

      for (let i = 0; i < enteredValue.length; i++) {
        // check state of letter
        let state = LetterState.default;
        let found = false;

        for (let j = 0; j < answer.length; j++) {
          if (enteredValue[i] === answer[j] && i === j) {
            state = LetterState.correct;
            this.keyboardState.next({
              value: enteredValue[i],
              state: LetterState.correct,
            });
            break;
          } else if (enteredValue[i] === answer[j]) {
            state = LetterState.present;
            this.keyboardState.next({
              value: enteredValue[i],
              state: LetterState.present,
            });
            found = true;
          } else {
            state = LetterState.incorrect;
            this.keyboardState.next({
              value: enteredValue[i],
              state: LetterState.incorrect,
            });
          }

          if (found) {
            state = LetterState.present;
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

      for (const cellValue of cellValues) {
        if (cellValue.state !== LetterState.correct) {
          isWinner = false;
          break;
        }
      }

      if (isWinner) {
        this.isGameOver.next({ isGameOver: true, isWin: true });
        this.isGameOverModalOpen.next(true);
        return;
      }

      if (
        this.gameStateValues.getValue().length >=
        this.gameConfig.getValue().maxTurns
      ) {
        this.isGameOver.next({ isGameOver: true, isWin: false });
        this.isGameOverModalOpen.next(true);
        return;
      }

      console.log(this.gameStateValues);
    }
  }

  onNewGameStart() {
    this.gameStateValues.next([]);
    this.tempTurnValue.next('');
    this.isGameOver.next({ isGameOver: false, isWin: false });
    // this.generateRandomWord();
  }

  generateRandomWord() {
    const headers = new HttpHeaders()
      .set('x-rapidapi-host', this.host)
      .set('x-rapidapi-key', this.key)
      .set('x-rapidapi-ua', this.ua);

    const params = new HttpParams().set(
      'length',
      this.gameConfig.value.wordLength
    );

    const options = { params: params, headers: headers };

    return this.http.get<any>(this.url, options);
    // .pipe(
    //   map((response) => {
    //     console.log('responseMap', response);
    //     console.log('value', response['body'][0]);
    //     this.answer.next(<string>response['body'][0].toUpperCase());
    //   })
    // )
    // .subscribe((response) => {
    //   console.log('responseMap', response);
    //   // console.log('value', response['body'][0]);
    //   this.answer.next(<string>response['body'][0].toUpperCase());
    // })
  }

  setNewGameAnswer(value: string) {
    this.answer.next(value);
  }

  setIsGameModalOpen(value: boolean) {
    this.isGameModalOpen.next(value);
  }

  setIsGameOverModalOpen(value: boolean) {
    this.isGameOverModalOpen.next(value);
  }

  setGameConfig(value: GameConfig) {
    this.gameConfig.next(value);
  }

  // replace wih valid word checker
  checkIfValid() {
    return true;
  }
}
