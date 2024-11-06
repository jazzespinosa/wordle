import { Component, EventEmitter, Output } from '@angular/core';
import { GameService } from '../game/game.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../game/modal/modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  isModalOpen = false;

  constructor(private gameService: GameService, private router: Router) {}

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  startModal() {
    this.isModalOpen = false;
    this.gameService.gameStateValues.next([]);
    this.router.navigate(['/play']);
  }

  onCancelModal() {
    this.isModalOpen = false;
  }
}
