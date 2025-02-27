import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:8081/api/exams';

  constructor(private http: HttpClient) { }

  calculateAverage(scores: number[]): Observable<number> {
    console.log('Token before calculateAverage:', localStorage.getItem('token'));
    return this.http.post<number>(`${this.apiUrl}/calculate`, scores);
  }

  getResultsByUserId(userId: number): Observable<any> {
    console.log('Token before getResultsByUserId:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/results/${userId}`);
  }

  getResultsByChapterId(chapterId: number): Observable<any> {
    console.log('Token before getResultsByChapterId:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/results/chapter/${chapterId}`);
  }

  submitResults(results: any[]): Observable<any> {
    console.log('Token before submitResults:', localStorage.getItem('token'));
    return this.http.post(`${this.apiUrl}/submit-results`, results);
  }

  getUserResults(userId: number): Observable<any> {
    console.log('Token before getUserResults:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/results/${userId}`);
  }
}