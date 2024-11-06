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
  @Output() sideNavMenuClicked = new EventEmitter<void>();
  @Output() headerClicked = new EventEmitter<void>();

  isSideNavOpen = false;

  constructor() {}

  onSideNavMenuClick() {
    this.isSideNavOpen = !this.isSideNavOpen;
    this.sideNavMenuClicked.emit();
  }

  onHeaderClick() {
    this.headerClicked.emit();
  }
}
