import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, keyframes } from '@angular/animations';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  animations: [
    trigger('formAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateZ(0) rotateX(10deg)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateZ(60px) rotateX(5deg)' }))
      ])
    ]),
    trigger('fieldAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateZ(0)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateZ(20px)' }))
      ])
    ]),
    trigger('labelAnimation', [
      transition('idle => focused', [
        animate('0.3s ease', style({ top: '-15px', fontSize: '0.9rem', color: 'var(--accent-color)' }))
      ]),
      transition('focused => idle', [
        animate('0.3s ease', style({ top: '50%', fontSize: '1.2rem', color: 'rgba(255, 255, 255, 0.7)' }))
      ])
    ]),
    trigger('errorAnimation', [
      transition(':enter', [
        animate('0.4s ease', keyframes([
          style({ opacity: 0, transform: 'scale(0.9)' }),
          style({ opacity: 1, transform: 'scale(1)' })
        ]))
      ])
    ]),
    trigger('buttonAnimation', [
      transition('idle => submitting', [
        animate('0.2s ease', style({ transform: 'translateZ(15px) translateY(2px)' }))
      ]),
      transition('submitting => idle', [
        animate('0.2s ease', style({ transform: 'translateZ(20px) translateY(0)' }))
      ])
    ])
  ]
})
export class SignupComponent implements OnInit {
  fullName: string = '';
  email: string = '';
  workCode: string = '';
  password: string = '';
  isSubmitting: boolean = false;

  fields = [
    { id: 'fullName', label: 'Full Name', type: 'text', model: this.fullName, errorMessage: 'Full Name is required.', focused: false },
    { id: 'email', label: 'Email', type: 'email', model: this.email, errorMessage: 'Please enter a valid email.', pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$', focused: false },
    { id: 'workCode', label: 'Work Code', type: 'text', model: this.workCode, errorMessage: 'Work Code is required.', focused: false },
    { id: 'password', label: 'Password', type: 'password', model: this.password, errorMessage: 'Password must be at least 6 characters.', minlength: 6, focused: false }
  ];

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.createParticles();
    this.fields.forEach((field, index) => {
      setTimeout(() => {
        field['animate'] = true;
      }, index * 200);
    });
  }

  createParticles() {
    const particlesContainer = document.querySelector('.particles') as HTMLElement;
    const particleCount = 60;
    const colors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--accent-color)'];
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 25 + 10;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.bottom = `${Math.random() * 100}%`;
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDuration = `${Math.random() * 8 + 4}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      particlesContainer.appendChild(particle);
    }
  }

  onInputFocus(index: number) {
    this.fields[index].focused = true;
  }

  onInputBlur(index: number) {
    this.fields[index].focused = false;
  }

  onSubmit() {
    this.isSubmitting = true;
    const user = {
      fullName: this.fullName,
      email: this.email,
      workCode: this.workCode,
      password: this.password,
      role: 'ROLE_USER'
    };

    this.authService.register(user).subscribe(
      (response) => {
        console.log('Registration response:', response);
        alert('Signup successful! You can now log in.');
        this.router.navigate(['/login']);
      },
      (error: HttpErrorResponse) => {
        console.error('Full error:', error);
        let errorMessage = error.error || 'An unknown error occurred';
        if (error.status === 0) {
          errorMessage = 'Unable to connect to server';
        } else if (error.error instanceof ProgressEvent) {
          errorMessage = 'Network error occurred';
        }
        alert(`Signup failed: ${errorMessage}`);
        this.isSubmitting = false;
      },
      () => {
        this.isSubmitting = false;
      }
    );
  }
}