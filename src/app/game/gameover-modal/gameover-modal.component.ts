import { Component, Input, OnInit } from '@angular/core';
import { GameService } from '../game.service';
import { map, Observable, tap } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gameover-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gameover-modal.component.html',
  styleUrl: './gameover-modal.component.css',
})
export class GameoverModalComponent implements OnInit {
  isWin!: Observable<boolean>;
  answer!: Observable<string>;
  answerLink = '';

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.isWin = this.gameService.isGameOver$.pipe(map((value) => value.isWin));

    this.answer = this.gameService.answer$.pipe(
      tap((value) => {
        this.answerLink =
          'https://www.google.com/search?q=' + value.toLowerCase();
      })
    );
  }

  onOKClick() {
    this.gameService.setIsGameOverModalOpen(false);
  }
}
