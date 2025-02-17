import { Component, OnDestroy, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-account-requests',
  templateUrl: './account-requests.component.html',
  styleUrls: ['./account-requests.component.css'],
  standalone: true,
  imports: [CommonModule, DatePipe],
  animations: [
    trigger('containerFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px) scale(0.98)' }),
        animate('600ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ])
    ]),
    trigger('rowAnimation', [
      transition(':enter', [
        query('.grid-row', [
          style({ opacity: 0, transform: 'translateX(20px)' }),
          stagger(50, [
            animate('400ms 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ])
      ])
    ])
  ]
})
export class AccountRequestsComponent implements OnInit, OnDestroy {
  accountRequests: any[] | null = null;
  private destroy$ = new Subject<void>();

  constructor(public adminService: AdminService) { }

  ngOnInit(): void {
    this.loadAccountRequests();
  }

  loadAccountRequests(): void {
    this.adminService.getAccountRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: any[]) => {
        this.accountRequests = data.map(request => ({
          ...request,
          joinDate: this.parseDate(request.joinDate)
        }));
      },
      error: (error) => {
        console.error('Error loading requests:', error);
        this.accountRequests = [];
      }
    });
  }

  private parseDate(dateString: any): Date | null {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  trackById(index: number, item: any): number {
    return item.id;
  }

  approveAccount(requestId: number): void {
    const request = this.accountRequests?.find(r => r.id === requestId);
    if (!request) return;

    request.loading = true;
    this.adminService.approveAccount(requestId).subscribe({
      next: () => this.loadAccountRequests(),
      error: (error) => {
        console.error('Approval failed:', error);
        request.loading = false;
      }
    });
  }

  revokeAccount(requestId: number): void {
    if (!confirm('Are you sure you want to revoke this account?')) return;

    const request = this.accountRequests?.find(r => r.id === requestId);
    if (!request) return;

    request.loading = true;
    this.adminService.revokeAccount(requestId).subscribe({
      next: () => this.loadAccountRequests(),
      error: (error) => {
        console.error('Revocation failed:', error);
        request.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}