import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from '../game.service';
import { map, Observable, Subscription } from 'rxjs';

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
  value = '';
  keyboard!: Keyboard;
  isGameOver = false;

  private answer = '';
  private keyDownListener!: (event: KeyboardEvent) => void;

  private subsGameConfig!: Subscription;
  private subsKeyboardState!: Subscription;
  private subsAnswer!: Subscription;
  private subsIsGameOver!: Subscription;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, // checks the current platform the app is running (browser, server, or mobile env)
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.initKeyboard();

    // checks if the code is running in the browser
    if (isPlatformBrowser(this.platformId)) {
      // Only add the event listener in the browser
      this.keyDownListener = (event: KeyboardEvent) => {
        this.onKeyPress(event.key);
      };
      window.addEventListener('keydown', this.keyDownListener);
    }

    this.subsGameConfig = this.gameService.gameConfig$.subscribe((value) => {
      this.wordLength = value.wordLength;
    });

    this.subsKeyboardState = this.gameService.keyboardState$.subscribe(
      (value) => {
        this.updateKeyboardButtonTheme(value.value, value.state);
      }
    );

    this.subsAnswer = this.gameService.answer$.subscribe((value) => {
      if (value !== this.answer) {
        this.keyboard.destroy();
        this.initKeyboard();
      }
    });

    this.subsIsGameOver = this.gameService.isGameOver$.subscribe((value) => {
      this.isGameOver = value.isGameOver;
    });
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
    }

    this.subsGameConfig.unsubscribe();
    this.subsKeyboardState.unsubscribe();
    this.subsAnswer.unsubscribe();
    this.subsIsGameOver.unsubscribe();
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

  onKeyPress(key: string) {
    if (this.isGameOver) {
      return;
    }

    if ((key === '{bksp}' || key === 'Backspace') && this.value.length > 0) {
      this.value = this.value.slice(0, this.value.length - 1);
      this.gameService.onChangeTurnValue(this.value);
    } else if (
      (key === '{enter}' || key === 'Enter') &&
      this.value.length === this.wordLength
    ) {
      // this.keyboard.addButtonTheme(key, 'correct-btn');
      this.gameService.onEnterValue(this.value);
      this.value = '';
    } else if (this.isAlphabet(key) && this.value.length < this.wordLength) {
      this.value = this.value + key.toUpperCase();
      this.gameService.onChangeTurnValue(this.value);
    }
  }

  isAlphabet(input: string) {
    if (input.length === 1 && input.match(/[a-z]/i)) {
      return true;
    }
    return false;
  }

  updateKeyboardButtonTheme(key: string, state: string) {
    let keyboardClasses: string[] = [];
    if (this.keyboard.getButtonThemeClasses(key).length > 0) {
      keyboardClasses = this.keyboard.getButtonThemeClasses(key);
    }

    if (
      state === 'correct' ||
      (state === 'present' && !keyboardClasses.includes('correct')) ||
      (state === 'incorrect' &&
        !keyboardClasses.includes('correct') &&
        !keyboardClasses.includes('present'))
    ) {
      keyboardClasses.forEach((state) => {
        this.keyboard.removeButtonTheme(key, state);
      });
      this.keyboard.addButtonTheme(key, state);
    }
  }
}
