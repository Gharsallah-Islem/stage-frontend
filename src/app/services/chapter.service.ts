import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private link = 'http://localhost:8081/api/chapters';

  constructor(private http: HttpClient) { }

  getAllChapters(): Observable<any> {
    console.log('Token before getAllChapters:', localStorage.getItem('token'));
    return this.http.get(`${this.link}`);
  }

  createChapter(chapter: any): Observable<any> {
    console.log('Token before createChapter:', localStorage.getItem('token'));
    return this.http.post(`${this.link}`, chapter);
  }
}