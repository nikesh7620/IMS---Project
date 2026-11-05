import { Routes } from '@angular/router';

import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { Candidates } from './components/candidates/candidates';
import { AddCandidate } from './components/add-candidate/add-candidate';

import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'candidates',
    component: Candidates,
    canActivate: [authGuard]
  },
  {
    path: 'candidates/new',
    component: AddCandidate,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];