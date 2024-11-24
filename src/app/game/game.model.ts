export enum LetterState {
  correct = 'correct',
  present = 'present',
  incorrect = 'incorrect',
  default = 'default',
}

export interface GameConfig {
  wordLength: number;
  maxTurns: number;
}

export interface CellModel {
  value: string;
  state: LetterState;
}

export interface TurnModel {
  turnValue: string; // word of turn / row
  cellValue: CellModel[];
}

export interface GameOverModel {
  isGameOver: boolean;
  isWin: boolean;
}
