import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private link = 'http://localhost:8081/api/chapters';

  constructor(private http: HttpClient) { }

  getAllChapters(): Observable<any> {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token);

    return this.http.get(`${this.link}`, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }


  createChapter(chapter: any): Observable<any> {
    return this.http.post(`${this.link}`, chapter);
  }
}
