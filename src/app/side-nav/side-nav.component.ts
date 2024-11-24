import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../game/game.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
})
export class SideNavComponent implements OnInit {
  @Output() closeSideNav = new EventEmitter<void>();

  constructor(private router: Router, private gameService: GameService) {}

  ngOnInit(): void {}

  onPlayClicked() {
    this.gameService.setIsGameModalOpen(true);
    this.closeSideNav.emit();
  }

  onAboutClicked() {
    this.closeSideNav.emit();
  }
}
