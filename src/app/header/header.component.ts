import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Output() sideNavClicked = new EventEmitter<void>();

  isSideNavOpen = false;

  constructor() {}

  onSideNavClick() {
    this.isSideNavOpen = !this.isSideNavOpen;
    this.sideNavClicked.emit();
  }
}
