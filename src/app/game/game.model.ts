export interface TempTurnModel {
  turn: number;
  turnValue: string;
}

export enum LetterState {
  correct = 'correct',
  present = 'present',
  incorrect = 'incorrect',
  default = 'default',
}

export interface CellModel {
  // turnIndex: number;
  // letterIndex: number;
  value: string;
  state: LetterState;
}

export interface TurnModel {
  turnValue: string; // word of turn / row
  // turnIndex: number;
  cellValue: CellModel[];
}
