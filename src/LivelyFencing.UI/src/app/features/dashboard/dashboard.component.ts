import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, {{ auth.currentUser?.name }}</p>

      <div class="stats-grid" *ngIf="!loading; else spinner">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon customers"><mat-icon>people</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.customers }}</div>
              <div class="stat-label">Active Customers</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/customers">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon jobs"><mat-icon>build</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeJobs }}</div>
              <div class="stat-label">Active Jobs</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/jobs">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon pending"><mat-icon>pending_actions</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingApproval }}</div>
              <div class="stat-label">Quotes Pending Approval</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/quotes" [queryParams]="{status:'PendingApproval'}">Review</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon revenue"><mat-icon>attach_money</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">\${{ stats.yearRevenue | number:'1.0-0' }}</div>
              <div class="stat-label">{{ currentYear }} Revenue</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/reports">Reports</a></mat-card-actions>
        </mat-card>
      </div>

      <ng-template #spinner>
        <div class="spinner-center"><mat-spinner /></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .page-subtitle { color: #666; margin: 4px 0 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: white; }
    .stat-icon.customers { background: #1565C0; }
    .stat-icon.jobs { background: #E65100; }
    .stat-icon.pending { background: #F57F17; }
    .stat-icon.revenue { background: #2E7D32; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #666; }
    .spinner-center { display: flex; justify-content: center; padding: 60px; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  loading = true;
  currentYear = new Date().getFullYear();
  stats = { customers: 0, activeJobs: 0, pendingApproval: 0, yearRevenue: 0 };

  ngOnInit() {
    forkJoin({
      customers: this.api.getCustomers(),
      jobs: this.api.getJobs(undefined, 'Active'),
      pendingQuotes: this.api.getQuotes('PendingApproval'),
      revenue: this.api.getRevenueReport(this.currentYear)
    }).subscribe({
      next: (data) => {
        this.stats.customers = data.customers.length;
        this.stats.activeJobs = data.jobs.length;
        this.stats.pendingApproval = data.pendingQuotes.length;
        this.stats.yearRevenue = data.revenue.total ?? 0;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
