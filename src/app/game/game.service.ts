import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  concatMap,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import {
  type CellModel,
  type GuessPostResponseDto,
  type GetCurrentGameDto,
  LetterState,
  type TurnModel,
  GameState,
  NewGameResponseDto,
  GlobalGameStatusModel,
  HomeStatsModel,
  GameHistoryModel,
  StatsModel,
} from './game.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GameService {
  constructor(private http: HttpClient) {}

  private readonly INITIAL_WORD_LENGTH = 5;
  private readonly INITIAL_MAX_TURNS = 6;

  private readonly baseUrl = environment.backendUrl;

  // ========== isGameModalOpen ==========
  private readonly isGameModalOpen = new BehaviorSubject<boolean>(false);
  readonly isGameModalOpen$ = this.isGameModalOpen.asObservable();
  setIsGameModalOpen(value: boolean) {
    this.isGameModalOpen.next(value);
  }

  // ========== isGameOverModalOpen ==========
  private readonly isGameOverModalOpen = new BehaviorSubject<boolean>(false);
  readonly isGameOverModalOpen$ = this.isGameOverModalOpen.asObservable();
  setIsGameOverModalOpen(value: boolean) {
    this.isGameOverModalOpen.next(value);
  }

  // ========== globalGameStatus ==========
  private readonly globalGameStatus =
    new BehaviorSubject<GlobalGameStatusModel>({
      gameState: GameState.default,
      gameId: 0,
      wordLength: this.INITIAL_WORD_LENGTH,
      maxTurns: this.INITIAL_MAX_TURNS,
      currentTurn: 0,
      guesses: [],
    });
  readonly globalGameStatus$ = this.globalGameStatus.asObservable();
  setGlobalGameStatus(value: GlobalGameStatusModel) {
    this.globalGameStatus.next(value);
  }
  updateGlobalGameStatus(patch: Partial<GlobalGameStatusModel>) {
    const current = this.globalGameStatus.value;
    if (!current) {
      return;
    }
    this.globalGameStatus.next({
      ...current,
      ...patch,
    });
  }
  addGuessToGlobalGameStatus(guess: TurnModel) {
    const current = this.globalGameStatus.value;
    if (!current) return;
    this.globalGameStatus.next({
      ...current,
      guesses: [...current.guesses, guess],
    });
  }

  // ========== tempInputValue ==========
  private readonly tempTurnValue = new BehaviorSubject<string>('');
  readonly tempTurnValue$ = this.tempTurnValue.asObservable();
  setTempTurnValue(value: string) {
    this.tempTurnValue.next(value);
  }

  // ========== guessResponse ==========
  private readonly guessResponse =
    new BehaviorSubject<GuessPostResponseDto | null>(null);
  readonly guessResponse$ = this.guessResponse.asObservable();
  getGuessResponse(): GuessPostResponseDto | null {
    return this.guessResponse.getValue();
  }
  setGuessResponse(value: GuessPostResponseDto | null) {
    this.guessResponse.next(value);
  }

  // ========== isGuessValid ==========
  private readonly isGuessValid = new Subject<boolean>();
  readonly isGuessValid$ = this.isGuessValid.asObservable();
  setIsGuessValid(value: boolean) {
    this.isGuessValid.next(value);
  }

  // ========== isGuessLoading ==========
  private readonly isGuessLoading = new BehaviorSubject<boolean>(false);
  readonly isGuessLoading$ = this.isGuessLoading.asObservable();
  setIsGuessLoading(value: boolean) {
    this.isGuessLoading.next(value);
  }

  resetGame() {
    this.setIsGuessLoading(false);
    this.setGlobalGameStatus({
      gameState: GameState.default,
      gameId: 0,
      wordLength: this.INITIAL_WORD_LENGTH,
      maxTurns: this.INITIAL_MAX_TURNS,
      currentTurn: 0,
      guesses: [],
    });
  }

  onChangeTurnValue(newValue: string) {
    if (newValue.length <= this.globalGameStatus.value.wordLength) {
      this.setTempTurnValue(newValue);
    }
  }

  onEnterValue(enteredValue: string): Observable<GuessPostResponseDto> {
    this.setIsGuessLoading(true);

    if (enteredValue.length !== this.globalGameStatus.value.wordLength) {
      this.setIsGuessValid(false);
      this.setIsGuessLoading(false);
      return throwError(
        () =>
          new Error('Guess word length does not match the game word length.'),
      );
    }

    return this.http
      .post<GuessPostResponseDto>(`${this.baseUrl}/api/Game/guess`, {
        GameId: this.globalGameStatus.value.gameId,
        Guess: enteredValue,
      })
      .pipe(
        map((response) => ({
          gameId: response.gameId,
          guess: response.guess,
          turn: response.turn,
          isGuessCorrect: response.isGuessCorrect,
          answer: response.answer,
          letterStates: response.letterStates,
        })),
        tap((postResponse) => {
          this.processGuess(postResponse, enteredValue);
          this.setGuessResponse(postResponse);
        }),
      );
  }

  processGuess(postResponse: GuessPostResponseDto, enteredValue: string) {
    let cellValues: CellModel[] = [];
    let isWinner = false;
    let guess = postResponse.guess;
    let letterStates: number[] = postResponse.letterStates;
    let prevTurn = this.globalGameStatus.value.currentTurn;

    for (let i = 0; i < guess.length; i++) {
      let stateNumber = letterStates[i];
      let state: LetterState = this.getCellStateFromNumber(stateNumber);

      cellValues.push({
        value: enteredValue[i],
        state: state,
      });
    }

    this.addGuessToGlobalGameStatus({
      turnValue: enteredValue,
      cellValue: cellValues,
    });
    this.updateGlobalGameStatus({
      currentTurn: prevTurn + 1,
    });
    this.setTempTurnValue('');
    this.setIsGuessLoading(false);

    for (const cellValue of cellValues) {
      if (cellValue.state !== LetterState.correct) {
        isWinner = false;
        break;
      }
      isWinner = true;
    }

    if (isWinner) {
      this.onGameOver(GameState.win);
      return;
    }

    if (
      (this.globalGameStatus.value.currentTurn || 0) >=
      this.globalGameStatus.value.maxTurns
    ) {
      this.onGameOver(GameState.lose);
      return;
    }
  }

  onGameOver(gameState: GameState) {
    this.updateGlobalGameStatus({ gameState: gameState });
    this.setIsGameOverModalOpen(true);
  }

  onNewGameStart(wordLength: number, maxTurns: number) {
    this.resetGame();

    return this.http
      .post<NewGameResponseDto>(`${this.baseUrl}/api/Game/newgame`, {
        WordLength: wordLength,
        MaxTurns: maxTurns,
      })
      .pipe(
        map((response) => ({
          gameId: response.gameId,
          wordLength: response.wordLength,
          maxTurns: response.maxTurns,
        })),
        tap((response) => {
          this.setTempTurnValue('');
          this.setGlobalGameStatus({
            gameState: GameState.newGame,
            gameId: response.gameId,
            wordLength: response.wordLength,
            maxTurns: response.maxTurns,
            currentTurn: 0,
            guesses: [],
          });
        }),
      );
  }

  getGame() {
    return this.http
      .get<GetCurrentGameDto>(`${this.baseUrl}/api/Game/get-game`)
      .pipe(
        switchMap((response) => this.getGameHelper(response)),
        catchError((error) => {
          if (
            error.error.message === 'No active game found.' ||
            error.error.message === 'Game not found.'
          ) {
            this.updateGlobalGameStatus({
              gameState: GameState.default,
              gameId: 0,
              wordLength: this.INITIAL_WORD_LENGTH,
              maxTurns: this.INITIAL_MAX_TURNS,
              currentTurn: 0,
              guesses: [],
            });
          }
          return throwError(() => error);
        }),
      );
  }

  private getGameHelper(game: GetCurrentGameDto) {
    if (game) {
      let guessWord = '';
      let letterStates: number[] = [];
      let guessesAndStates: TurnModel[] = [];
      game.guesses.forEach((guess) => {
        guessWord = guess.guess;
        letterStates = guess.letterStates;
        let cellModels: CellModel[] = [];
        for (let index = 0; index < guessWord.length; index++) {
          let cellModel: CellModel = {
            value: guessWord[index],
            state: this.getCellStateFromNumber(letterStates[index]),
          };
          cellModels.push(cellModel);
        }

        guessesAndStates.push({
          turnValue: guessWord,
          cellValue: cellModels,
        });
      });

      this.setGlobalGameStatus({
        gameState: GameState.inProgress,
        gameId: game.gameId,
        wordLength: game.guessLength,
        maxTurns: game.maxTurns,
        currentTurn: game.turnsPlayed,
        guesses: guessesAndStates,
      });
    }
    return of(game);
  }

  getCellStateFromNumber(stateNumber: number): LetterState {
    let state: LetterState = LetterState.default;
    switch (stateNumber) {
      case 0:
        state = LetterState.correct;
        break;
      case 1:
        state = LetterState.present;
        break;
      case 2:
        state = LetterState.incorrect;
        break;
      case 3:
        state = LetterState.default;
        break;
      default:
    }

    return state;
  }

  getHomeStats(): Observable<HomeStatsModel> {
    return this.http
      .get<HomeStatsModel>(`${this.baseUrl}/api/Game/get-homestats`)
      .pipe(
        map((response) => ({
          hasExistingGame: response.hasExistingGame,
          gamesPlayed: response.gamesPlayed,
          winPercentage: response.winPercentage,
          currentStreak: response.currentStreak,
          homeGameHistories: response.homeGameHistories
            .map((history) => ({
              ...history,
              date: new Date(history.date + 'Z'),
            }))
            .map((history) => ({
              ...history,
              result: this.getGameStateFromNumber(
                +history.result,
                history.turnsSolved,
                history.maxTurns,
              ),
            })),
        })),
      );
  }

  private getGameStateFromNumber(
    stateNumber: number,
    turnsSolved: number,
    maxTurns: number,
  ): string {
    let state: string = '';
    switch (stateNumber) {
      case 0:
        state = 'UNKNOWN';
        break;
      case 1:
        state = 'IN PROGRESS';
        break;
      case 2:
        state = 'WIN';
        break;
      case 3:
        state = 'LOSS';
        break;
      default:
    }

    if (state === 'LOSS' && turnsSolved < maxTurns) {
      state = 'ABANDONED';
    }

    return state;
  }

  getGameDetails(gameId: number): Observable<GetCurrentGameDto> {
    return this.http.get<GetCurrentGameDto>(
      `${this.baseUrl}/api/Game/game-id/${gameId}`,
    );
  }

  getStats(): Observable<StatsModel> {
    return this.http.get<any>(`${this.baseUrl}/api/Game/get-stats`);
  }

  getFullHistory(page: number, size: number): Observable<GameHistoryModel[]> {
    return this.http
      .get<
        GameHistoryModel[]
      >(`${this.baseUrl}/api/Game/get-history?pageNumber=${page}&pageSize=${size}`)
      .pipe(
        map((response) =>
          response
            .map((history) => ({
              ...history,
              date: new Date(history.date + 'Z'),
            }))
            .map((history) => ({
              ...history,
              result: this.getGameStateFromNumber(
                +history.result,
                history.turnsSolved,
                history.maxTurns,
              ),
            })),
        ),
      );
  }
}
