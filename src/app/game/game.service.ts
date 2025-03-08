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
  private key = this.environment.getApiKey();
  private url = this.environment.getApiUrl();

  // only for rapidapi word generator API
  // private host = this.environment.getApiHost();
  // private ua = this.environment.getApiUa();

  private answer = new BehaviorSubject<string>('WORDS');
  answer$ = this.answer.asObservable();

  private isGameModalOpen = new BehaviorSubject<boolean>(false);
  isGameModalOpen$ = this.isGameModalOpen.asObservable();

  private isGameOverModalOpen = new BehaviorSubject<boolean>(false);
  isGameOverModalOpen$ = this.isGameOverModalOpen.asObservable();

  private keyboardStates = new BehaviorSubject<CellModel[]>([]);
  keyboardStates$ = this.keyboardStates.asObservable();

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
        let isPresent = false;

        for (let j = 0; j < answer.length; j++) {
          if (enteredValue[i] === answer[j] && i === j) {
            state = LetterState.correct;
            break;
          } else if (enteredValue[i] === answer[j]) {
            isPresent = true;
          }

          if (isPresent) {
            state = LetterState.present;
          } else {
            state = LetterState.incorrect;
          }
        }

        this.keyboardState.next({
          value: enteredValue[i],
          state: state,
        });
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

      this.clearTempTurn();

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

      // console.log(this.gameStateValues);
      // console.log('keyboardstate', this.keyboardState.getValue());
    }
  }

  // updateKeyboardStates(letterStateToUpdate: string, state: LetterState) {
  //   let tempKeyboardStates = this.keyboardState.getValue(); // get current keyboard states
  //   let index = tempKeyboardStates.findIndex(
  //     (item) => item.value === letterStateToUpdate
  //   ); // find index of letter to update
  //   tempKeyboardStates[index].state = state; // update state of letter
  //   this.keyboardState.next(tempKeyboardStates); // push updates to keyboard states
  // }

  onNewGameStart() {
    this.gameStateValues.next([]);
    this.clearTempTurn();
    this.isGameOver.next({ isGameOver: false, isWin: false });
    // this.generateRandomWord();
  }

  generateRandomWord() {
    // only for rapidapi word generator API
    // const headers = new HttpHeaders()
    // .set('x-rapidapi-key', this.key);
    // .set('x-rapidapi-host', this.host)
    // .set('x-rapidapi-ua', this.ua);
    // const params = new HttpParams().set(
    //   'length',
    //   this.gameConfig.value.wordLength
    // );

    // wordnik API
    const headers = new HttpHeaders().set('api_key', this.key);

    const params = new HttpParams()
      .set('hasDictionaryDef', true)
      .set('minLength', this.gameConfig.value.wordLength)
      .set('maxLength', this.gameConfig.value.wordLength)
      .set('minCorpusCount', 100);

    const options = { params: params, headers: headers };

    let x = this.gameConfig.value.wordLength;
    const completeURL = `${this.url}?hasDictionaryDef=true&minLength=${x}&maxLength=${x}&minCorpusCount=5&minDictionaryCount=1&api_key=${this.key}`;

    return this.http.get<any>(completeURL);
    // return this.http.get<any>(this.url, options);
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

  getKeyboardStates() {
    return this.keyboardStates.getValue();
  }

  setKeyboardStates(values: CellModel[]) {
    this.keyboardStates.next(values);
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

  clearTempTurn() {
    this.tempTurnValue.next('');
  }

  // replace wih valid word checker
  checkIfValid() {
    return true;
  }
}
