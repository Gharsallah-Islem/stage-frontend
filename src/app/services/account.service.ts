import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private link = 'http://localhost:8081/api/account-requests';

  constructor(private http: HttpClient) { }

  getAllAccountRequests(): Observable<any> {
    console.log('Token before getAllAccountRequests:', localStorage.getItem('token'));
    return this.http.get(`${this.link}`);
  }

  approveAccountRequest(id: number): Observable<any> {
    console.log('Token before approveAccountRequest:', localStorage.getItem('token'));
    return this.http.put(`${this.link}/${id}/approve`, {});
  }
}