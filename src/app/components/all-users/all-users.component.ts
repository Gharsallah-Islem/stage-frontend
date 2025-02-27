import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('rowAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class AllUsersComponent implements OnInit {
  users: any[] = [];
  examResults: any[] = [];

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    forkJoin({
      users: this.adminService.getAllUsers(),
      examResults: this.adminService.getExamResults()
    }).subscribe(({ users, examResults }) => {
      this.users = users;
      this.examResults = examResults;
      this.computeAverages();
    });
  }

  computeAverages(): void {
    if (this.users.length && this.examResults.length) {
      this.users.forEach(user => {
        const userResults = this.examResults.filter((er: any) => +er.user_id === +user.id);
        console.log(`User ${user.id} exam results count: ${userResults.length}`, userResults);
        if (userResults.length > 0) {
          const totalScore = userResults.reduce((sum: number, result: any) => sum + Number(result.score), 0);
          user.avgTestScore = totalScore / userResults.length;
        } else {
          user.avgTestScore = 0;
        }
      });
    }
  }

  toggleRole(user: any): void {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    this.adminService.changeUserRole(user.id, newRole).subscribe({
      next: (response: string) => {
        console.log('Role updated successfully:', response);
        user.role = newRole;  // Update the UI only on success
      },
      error: (err) => console.error('Error updating role:', err)
    });
  }
}