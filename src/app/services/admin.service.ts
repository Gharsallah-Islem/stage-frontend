import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8081/api/admin';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<any> {
    console.log('Token before getDashboardStats:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/dashboard/stats`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching dashboard stats:', error);
        return throwError(() => error);
      })
    );
  }

  getTrainingNeedsMatrix(): Observable<any> {
    console.log('Token before getTrainingNeedsMatrix:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/dashboard/matrix`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching training needs matrix:', error);
        return throwError(() => error);
      })
    );
  }

  getAllUsers(): Observable<any> {
    console.log('Token before getAllUsers:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/users`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching all users:', error);
        return throwError(() => error);
      })
    );
  }

  changeUserRole(userId: number, newRole: string): Observable<string | Object> {
    console.log('Token before changeUserRole:', localStorage.getItem('token'));
    return this.http.put(
      `${this.apiUrl}/users/${userId}/role`,
      { role: newRole },
      { responseType: 'text' as 'json' }  // Expect plain text response
    ).pipe(
      tap(response => console.log('Role change response:', response)),  // Log the response
      catchError((error: HttpErrorResponse) => {
        console.error('Error changing user role:', error);
        return throwError(() => error);
      })
    );
  }

  getAllModules(): Observable<any> {
    console.log('Token before getAllModules:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/modules`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching all modules:', error);
        return throwError(() => error);
      })
    );
  }

  addModule(module: any): Observable<any> {
    console.log('Token before addModule:', localStorage.getItem('token'));
    return this.http.post(`${this.apiUrl}/modules`, module).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error adding module:', error);
        return throwError(() => error);
      })
    );
  }

  updateModule(moduleId: number, module: any): Observable<any> {
    console.log('Token before updateModule:', localStorage.getItem('token'));
    return this.http.put(`${this.apiUrl}/modules/${moduleId}`, module).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating module:', error);
        return throwError(() => error);
      })
    );
  }

  deleteModule(moduleId: number): Observable<any> {
    console.log('Token before deleteModule:', localStorage.getItem('token'));
    return this.http.delete(`${this.apiUrl}/modules/${moduleId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting module:', error);
        return throwError(() => error);
      })
    );
  }

  getAccountRequests(): Observable<any> {
    console.log('Token before getAccountRequests:', localStorage.getItem('token'));
    console.log('Fetching from:', `${this.apiUrl}/account-requests`);
    return this.http.get<any[]>(`${this.apiUrl}/account-requests`).pipe(
      shareReplay(1),
      tap(data => console.log('Raw API response:', data)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching account requests:', error);
        return throwError(() => error);
      })
    );
  }

  approveAccount(requestId: number): Observable<any> {
    console.log('Token before approveAccount:', localStorage.getItem('token'));
    return this.http.put(`${this.apiUrl}/account-requests/${requestId}/approve`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error approving account:', error);
        return throwError(() => error);
      })
    );
  }

  revokeAccount(requestId: number): Observable<any> {
    console.log('Token before revokeAccount:', localStorage.getItem('token'));
    return this.http.put(`${this.apiUrl}/account-requests/${requestId}/revoke`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error revoking account:', error);
        return throwError(() => error);
      })
    );
  }

  getExamResults(): Observable<any[]> {
    console.log('Token before getExamResults:', localStorage.getItem('token'));
    return this.http.get<any[]>(`${this.apiUrl}/exam-results`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching exam results:', error);
        return throwError(() => error);
      })
    );
  }
}