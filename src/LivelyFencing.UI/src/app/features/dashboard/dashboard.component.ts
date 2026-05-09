import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatChipsModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, {{ auth.currentUser?.name }}</p>

      <div class="stats-grid" *ngIf="!loading; else spinner">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon clients"><mat-icon>people</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.clients }}</div>
              <div class="stat-label">Active Clients</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/customers">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon new-leads"><mat-icon>fiber_new</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.newLeads }}</div>
              <div class="stat-label">New Leads</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon total-leads"><mat-icon>record_voice_over</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLeads }}</div>
              <div class="stat-label">Total Leads</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon converted"><mat-icon>how_to_reg</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.converted }}</div>
              <div class="stat-label">Converted</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>
      </div>

      <!-- Pending Reviews -->
      <div class="section-header" *ngIf="!loading && pendingReviews.length > 0">
        <h2 class="section-title">
          <mat-icon>rate_review</mat-icon>
          Pending Reviews
          <span class="badge">{{ pendingReviews.length }}</span>
        </h2>
      </div>

      <div class="reviews-list" *ngIf="!loading && pendingReviews.length > 0">
        <mat-card class="review-card" *ngFor="let rv of pendingReviews">
          <mat-card-content>
            <div class="review-top">
              <div class="reviewer-info">
                <div class="reviewer-avatar" *ngIf="!rv.reviewerPhotoUrl">{{ rv.reviewerName.charAt(0) }}</div>
                <img *ngIf="rv.reviewerPhotoUrl" [src]="rv.reviewerPhotoUrl" class="reviewer-photo" alt=""/>
                <div>
                  <div class="reviewer-name">{{ rv.reviewerName }}</div>
                  <div class="review-meta">
                    <span class="stars">{{ starsText(rv.rating) }}</span>
                    <span class="review-date">{{ rv.createdAt | date:'MMM d, y' }}</span>
                    <span class="source-badge" *ngIf="rv.source === 'Google'">Google</span>
                  </div>
                </div>
              </div>
              <div class="review-actions">
                <button mat-stroked-button color="primary" (click)="approveReview(rv)">
                  <mat-icon>check</mat-icon> Approve
                </button>
                <button mat-stroked-button color="warn" (click)="dismissReview(rv)">
                  <mat-icon>close</mat-icon> Dismiss
                </button>
              </div>
            </div>
            <p class="review-comment">{{ rv.comment }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #spinner>
        <div class="spinner-center"><mat-spinner /></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-subtitle { color: #666; margin: 4px 0 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: white; }
    .stat-icon.clients { background: #1A3A2A; }
    .stat-icon.new-leads { background: #E65100; }
    .stat-icon.total-leads { background: #1565C0; }
    .stat-icon.converted { background: #2E7D32; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #666; }
    .spinner-center { display: flex; justify-content: center; padding: 60px; }

    .section-header { margin: 32px 0 12px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #1A3A2A; margin: 0; }
    .section-title mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .badge { background: #C9A96E; color: white; border-radius: 12px; padding: 2px 8px; font-size: 12px; font-weight: 700; }

    .reviews-list { display: flex; flex-direction: column; gap: 12px; }
    .review-card mat-card-content { padding: 16px 20px; }
    .review-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .reviewer-info { display: flex; align-items: center; gap: 12px; }
    .reviewer-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1A3A2A; color: #C9A96E; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
    .reviewer-photo { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .reviewer-name { font-weight: 600; font-size: 14px; }
    .review-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
    .stars { color: #C9A96E; font-size: 13px; letter-spacing: 1px; }
    .review-date { font-size: 12px; color: #888; }
    .source-badge { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #4285F4; background: rgba(66,133,244,.1); padding: 2px 6px; border-radius: 3px; }
    .review-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .review-comment { margin: 12px 0 0; font-size: 14px; color: #444; line-height: 1.6; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  loading = true;
  stats = { clients: 0, newLeads: 0, totalLeads: 0, converted: 0 };
  pendingReviews: any[] = [];

  ngOnInit() {
    // Fire-and-forget Google sync on every dashboard load
    this.api.syncGoogleReviews().subscribe({ error: () => {} });

    forkJoin({
      customers: this.api.getCustomers(),
      leads: this.api.getLeads(),
      allReviews: this.api.getAllReviews()
    }).subscribe({
      next: (data) => {
        this.stats.clients = data.customers.length;
        this.stats.totalLeads = data.leads.length;
        this.stats.newLeads = data.leads.filter((l: any) => !l.contacted).length;
        this.stats.converted = data.leads.filter((l: any) => l.convertedAt).length;
        this.pendingReviews = data.allReviews.filter((r: any) => !r.approved && !r.isDeleted);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  starsText(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  approveReview(rv: any) {
    this.api.approveReview(rv.id).subscribe({
      next: () => { this.pendingReviews = this.pendingReviews.filter(r => r.id !== rv.id); }
    });
  }

  dismissReview(rv: any) {
    this.api.deleteReview(rv.id).subscribe({
      next: () => { this.pendingReviews = this.pendingReviews.filter(r => r.id !== rv.id); }
    });
  }
}
