import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
import { TestpageComponent } from './testpage/testpage.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'play', component: GameComponent },
  { path: 'about', component: AboutComponent },
  { path: 'test', component: TestpageComponent },
];
