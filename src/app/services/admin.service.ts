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
    return this.http.get(`${this.apiUrl}/dashboard/stats`);
  }


  getTrainingNeedsMatrix(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/matrix`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching training needs matrix:', error);
        return throwError(() => error);
      })
    );
  }


  getAllUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`);
  }

  changeUserRole(userId: number, newRole: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/users/${userId}/role`,
      { role: newRole },
      { responseType: 'text' }
    );
  }


  getAllModules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/modules`);
  }

  addModule(module: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/modules`, module);
  }

  updateModule(moduleId: number, module: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/modules/${moduleId}`, module);
  }

  deleteModule(moduleId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/modules/${moduleId}`);
  }
  getAccountRequests(): Observable<any> {
    console.log('Fetching from:', `${this.apiUrl}/account-requests`);
    return this.http.get<any[]>(`${this.apiUrl}/account-requests`).pipe(
      shareReplay(1),
      tap(data => console.log('Raw API response:', data)),
      catchError(error => {
        console.error('API Error:', error);
        return throwError(() => error);
      })
    );
  }

  approveAccount(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/account-requests/${requestId}/approve`, {});
  }

  revokeAccount(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/account-requests/${requestId}/revoke`, {});
  }
  getExamResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/exam-results`);
  }



}
