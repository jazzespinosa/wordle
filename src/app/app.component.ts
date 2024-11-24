import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HeaderComponent } from './header/header.component';
import { AppService } from './app.service';
import { SideNavComponent } from './side-nav/side-nav.component';
import { HomeComponent } from './home/home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    CommonModule,
    SideNavComponent,
    MatSidenavModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'wordle-app';

  ngOnInit(): void {}

  @ViewChild('sidenav') sidenav!: MatSidenav;
  isSideNavOpen = false;

  onSideNavClicked() {
    this.isSideNavOpen = !this.isSideNavOpen;
  }

  closeSideNav() {
    this.isSideNavOpen = false;
    this.sidenav.close();
  }
}
