import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChapterRatingService {
  private apiUrl = 'http://localhost:8081/api/chapter-ratings';

  constructor(private http: HttpClient) { }

  submitRating(userId: number, chapterId: number, rating: number): Observable<any> {
    const payload = {
      user: { id: userId },
      chapter: { id: chapterId },
      rating: rating
    };
    console.log('Token before submitRating:', localStorage.getItem('token'));
    console.log('Submitting rating:', payload);
    return this.http.post(`${this.apiUrl}`, payload);
  }

  getUserRatings(userId: number): Observable<any> {
    console.log('Token before getUserRatings:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }

  getRatingsByChapter(chapterId: number): Observable<any> {
    console.log('Token before getRatingsByChapter:', localStorage.getItem('token'));
    return this.http.get(`${this.apiUrl}/chapter/${chapterId}`);
  }
}