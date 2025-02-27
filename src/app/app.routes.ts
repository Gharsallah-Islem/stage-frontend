import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AllUsersComponent } from './components/all-users/all-users.component';
import { AccountRequestsComponent } from './components/account-requests/account-requests.component';
import { AllModulesComponent } from './components/all-modules/all-modules.component';
import { AdminHomeComponent } from './components/admin-home/admin-home.component';
import { authGuard } from './auth.guard';
import { loginGuard } from './login.guard';
import { ExamSimulatorComponent } from './exam-simulator/exam-simulator.component';
import { QuestionBankComponent } from './question-bank/question-bank.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [loginGuard] },
  { path: 'exam', component: ExamSimulatorComponent, canActivate: [loginGuard] },
  { path: 'question-bank', component: QuestionBankComponent, canActivate: [loginGuard] },
  {
    path: 'dashboard/admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AdminHomeComponent },
      { path: 'users', component: AllUsersComponent },
      { path: 'account-requests', component: AccountRequestsComponent },
      { path: 'modules', component: AllModulesComponent },
    ],
  },
];