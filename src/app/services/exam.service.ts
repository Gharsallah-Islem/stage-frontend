import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:8081/api/exams';

  constructor(private http: HttpClient) { }

  calculateAverage(scores: number[]): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/calculate`, scores);
  }

  getResultsByUserId(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/${userId}`);
  }

  getResultsByChapterId(chapterId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/chapter/${chapterId}`);
  }

  submitResults(results: any[]): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.apiUrl}/submit-results`, results, { headers });
  }
  getUserResults(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/${userId}`);
  }
}
