import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from '../game.service';
import { Subscription, tap } from 'rxjs';
import { CellModel, GameState, LetterState } from '../game.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppService } from '../../app.service';

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './keyboard.component.html',
  styleUrl: './keyboard.component.css',
})
export class KeyboardComponent implements OnInit, OnDestroy {
  wordLength = 0;
  inputValue = '';
  keyboard!: Keyboard;
  isGameOver = false;

  isModalOpen = false;
  isSideNavOpen = false;

  private keyDownListener!: (event: KeyboardEvent) => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, // checks the current platform the app is running (browser, server, or mobile env)
    private gameService: GameService,
    private appService: AppService,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.initKeyboard();

    this.gameService.isGameModalOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.isModalOpen = value;
      });

    this.appService.isSideNavOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.isSideNavOpen = value;
      });

    // checks if the code is running in the browser
    if (isPlatformBrowser(this.platformId)) {
      // Only add the event listener in the browser
      this.keyDownListener = (event: KeyboardEvent) => {
        this.onKeyPress(event.key);
      };
      window.addEventListener('keydown', this.keyDownListener);
    }

    this.gameService.globalGameStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.wordLength = value.wordLength;
      });

    this.gameService.globalGameStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.guesses.length > 0) {
          for (let guess of value.guesses) {
            let latestCellModel = guess.cellValue;
            for (let index = 0; index < latestCellModel.length; index++) {
              this.updateKeyboardButtonTheme({
                value: latestCellModel[index].value,
                state: latestCellModel[index].state,
              });
            }
          }
        }
      });

    this.gameService.globalGameStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (
          value.gameState === GameState.win ||
          value.gameState === GameState.lose
        ) {
          this.isGameOver = true;
        } else {
          this.isGameOver = false;
        }
      });

    this.gameService.globalGameStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (
          value.gameState === GameState.newGame ||
          value.gameState === GameState.default
        ) {
          this.resetKeyboardStates();
        }
      });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
    }
  }

  initKeyboard() {
    this.keyboard = new Keyboard({
      onKeyPress: (key) => this.onKeyPress(key),
      layout: {
        default: [
          'Q W E R T Y U I O P',
          'A S D F G H J K L',
          '{enter} Z X C V B N M {bksp}',
        ],
      },
      display: {
        '{bksp}': '⌫',
        '{enter}': 'ENTER',
      },
    });
  }

  resetKeyboardStates() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    letters.forEach((item) => {
      let keyTheme = this.keyboard.getButtonThemeClasses(item);
      this.keyboard.removeButtonTheme(item, keyTheme[0]);
    });
  }

  onKeyPress(key: string) {
    if (this.isGameOver) {
      return;
    }

    if (this.isModalOpen || this.isSideNavOpen) {
      return;
    }

    if (
      (key === '{bksp}' || key === 'Backspace') &&
      this.inputValue.length > 0
    ) {
      this.inputValue = this.inputValue.slice(0, this.inputValue.length - 1);
      this.gameService.onChangeTurnValue(this.inputValue);
    } else if (key === '{enter}' || key === 'Enter') {
      this.gameService
        .onEnterValue(this.inputValue)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (value) => {
            this.gameService.setIsGuessValid(true);
            this.gameService.setIsGuessLoading(false);
            this.inputValue = '';
          },
          error: (err) => {
            if (
              err.message ===
                'Guess word length does not match the game word length.' ||
              err.error.message.startsWith('Invalid guess word') ||
              err.error.message ===
                'Guess word length does not match the game word length.'
            ) {
              this.gameService.setIsGuessValid(false);
              this.gameService.setIsGuessLoading(false);
            }
          },
        });
    } else if (
      this.isAlphabet(key) &&
      this.inputValue.length < this.wordLength
    ) {
      this.inputValue = this.inputValue + key.toUpperCase();
      this.gameService.onChangeTurnValue(this.inputValue);
    }
  }

  isAlphabet(input: string) {
    if (input.length === 1 && input.match(/[a-z]/i)) {
      return true;
    }
    return false;
  }

  updateKeyboardButtonTheme(cellModel: CellModel) {
    let keyboardClasses: string[] = [];
    if (this.keyboard.getButtonThemeClasses(cellModel.value).length > 0) {
      keyboardClasses = this.keyboard.getButtonThemeClasses(cellModel.value);
    }
    if (
      cellModel.state === LetterState.correct ||
      (cellModel.state === LetterState.present &&
        !keyboardClasses.includes('correct')) ||
      (cellModel.state === LetterState.incorrect &&
        !keyboardClasses.includes('correct') &&
        !keyboardClasses.includes('present'))
    ) {
      keyboardClasses.forEach((state) => {
        this.keyboard.removeButtonTheme(cellModel.value, state);
      });
      this.keyboard.addButtonTheme(cellModel.value, cellModel.state);
    }
  }
}
