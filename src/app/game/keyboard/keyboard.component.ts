import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import Keyboard from 'simple-keyboard';
import { GameService } from '../game.service';

@Component({
  selector: 'app-keyboard',
  standalone: true,
  imports: [],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './keyboard.component.html',
  styleUrl: './keyboard.component.css',
})
export class KeyboardComponent implements AfterViewInit, OnInit, OnDestroy {
  wordLength = 0;
  value = '';
  keyboard!: Keyboard;
  private keyDownListener!: (event: KeyboardEvent) => void;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, // checks the current platform the app is running (browser, server, or mobile env)
    private gameService: GameService
  ) {}

  ngAfterViewInit() {
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

  ngOnInit(): void {
    // checks if the code is running in the browser
    if (isPlatformBrowser(this.platformId)) {
      // Only add the event listener in the browser
      this.keyDownListener = (event: KeyboardEvent) => {
        this.onKeyPress(event.key);
      };
      window.addEventListener('keydown', this.keyDownListener);
    }

    this.wordLength = this.gameService.getWordLength();
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.keyDownListener) {
      window.removeEventListener('keydown', this.keyDownListener);
    }
  }

  onKeyPress(key: string) {
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
}
