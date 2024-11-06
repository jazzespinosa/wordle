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

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.css',
})
export class SideNavComponent implements OnInit, OnDestroy {
  @Output() closeSideNav = new EventEmitter<void>();
  subs!: Subscription;

  isNewGame = false;

  constructor(private router: Router, private gameService: GameService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    // this.subs.unsubscribe();
  }

  onPlayClicked() {
    // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //   this.router.navigate(['/play']);
    // });
    this.gameService.isGameModalOpen.next(true);
    this.closeSideNav.emit();
  }
}
