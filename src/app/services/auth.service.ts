import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private link = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.link}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('userId', response.userId);
          localStorage.setItem('role', response.role);
          localStorage.setItem('status', response.status);
          console.log('Token set after login:', response.token);
          console.log('User data stored:', { userId: response.userId, role: response.role, status: response.status });
        } else {
          console.error('No token received in login response:', response);
        }
      })
    );
  }

  register(user: any): Observable<any> {
    console.log('Token before register:', localStorage.getItem('token'));
    return this.http.post(`${this.link}/register`, user, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      responseType: 'text'
    }).pipe(
      tap(() => console.log('Registration request sent'))
    );
  }

  getUserId(): number | null {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : null;
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return token !== null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('status');
    console.log('User logged out, localStorage cleared');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getStatus(): string | null {
    const status = localStorage.getItem('status');
    console.log('Retrieved status from storage:', status);
    return status;
  }
}