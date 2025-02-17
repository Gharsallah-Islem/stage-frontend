import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      transition(':enter', [
        animate('500ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class SignupComponent {
  fullName: string = '';
  email: string = '';
  workCode: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    const user = {
      fullName: this.fullName,
      email: this.email,
      workCode: this.workCode,
      password: this.password,
      role: "ROLE_USER"
    };

    if (!this.fullName || !this.email || !this.workCode || !this.password) {
      console.error('All fields are required.');
      alert('Please fill out all fields.');
      return;
    }

    this.authService.register(user).subscribe(
      (response) => {
        console.log('Registration response:', response);
        alert('Signup successful! You can now log in.');
        this.router.navigate(['/login']);
      },
      (error) => {
        console.error('Full error:', error);
        let errorMessage = error.error;

        if (error instanceof HttpErrorResponse) {
          if (error.status === 0) {
            errorMessage = 'Unable to connect to server';
          } else if (error.error instanceof ProgressEvent) {
            errorMessage = 'Network error occurred';
          } else {
            errorMessage = error.error || error.message;
          }
        }

        alert(`Signup failed: ${errorMessage}`);
      }
    );
  }
}
