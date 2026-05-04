import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-reviews-management',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="rm-page">
      <div class="rm-header">
        <h1>Reviews</h1>
        <span class="pending-badge" *ngIf="pendingCount > 0">{{ pendingCount }} pending</span>
      </div>

      <div class="rm-loading" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="rm-sections" *ngIf="!loading">
        <!-- Pending approval -->
        <div class="rm-section" *ngIf="pending.length > 0">
          <h2 class="section-title pending-title">
            <mat-icon>pending</mat-icon> Pending Approval ({{ pending.length }})
          </h2>
          <div class="reviews-grid">
            <div class="review-card pending-card" *ngFor="let r of pending">
              <div class="card-top">
                <div class="reviewer-info">
                  <div class="reviewer-name">{{ r.reviewerName }}</div>
                  <div class="reviewer-email" *ngIf="r.reviewerEmail">{{ r.reviewerEmail }}</div>
                  <div class="review-date">{{ r.createdAt | date:'mediumDate' }}</div>
                </div>
                <div class="stars">
                  <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= r.rating">★</span>
                </div>
              </div>
              <p class="comment">"{{ r.comment }}"</p>
              <div class="card-actions">
                <button mat-raised-button color="primary" class="approve-btn" (click)="approve(r)">
                  <mat-icon>check</mat-icon> Approve
                </button>
                <button mat-stroked-button color="warn" (click)="remove(r)">
                  <mat-icon>delete</mat-icon> Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Approved -->
        <div class="rm-section">
          <h2 class="section-title">
            <mat-icon>verified</mat-icon> Live Reviews ({{ approved.length }})
          </h2>
          <div *ngIf="approved.length === 0" class="empty-state">No approved reviews yet.</div>
          <div class="reviews-grid">
            <div class="review-card" *ngFor="let r of approved">
              <div class="card-top">
                <div class="reviewer-info">
                  <div class="reviewer-name">{{ r.reviewerName }}</div>
                  <div class="review-date">{{ r.createdAt | date:'mediumDate' }}</div>
                </div>
                <div class="stars">
                  <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= r.rating">★</span>
                </div>
              </div>
              <p class="comment">"{{ r.comment }}"</p>
              <div class="card-actions">
                <button mat-stroked-button color="warn" (click)="remove(r)">
                  <mat-icon>delete</mat-icon> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .rm-page { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .rm-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .rm-header h1 { font-size: 28px; font-weight: 700; color: #1B5E20; margin: 0; }
    .pending-badge { background: #E53935; color: #fff; border-radius: 12px; font-size: 13px; font-weight: 700; padding: 2px 10px; }
    .rm-loading { display: flex; justify-content: center; padding: 60px; }
    .rm-section { margin-bottom: 48px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #1B5E20; margin: 0 0 20px; }
    .pending-title { color: #E65100; }
    .pending-title mat-icon, .section-title mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .review-card { background: #fff; border: 1px solid #E8F5E9; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .pending-card { border-color: #FFE0B2; background: #FFFDE7; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .reviewer-name { font-weight: 600; color: #1B5E20; font-size: 15px; }
    .reviewer-email { font-size: 12px; color: #777; margin-top: 2px; }
    .review-date { font-size: 12px; color: #aaa; margin-top: 2px; }
    .stars { display: flex; gap: 2px; }
    .star { font-size: 16px; color: #ddd; }
    .star.filled { color: #F9A825; }
    .comment { font-size: 14px; color: #555; line-height: 1.7; margin: 0; font-style: italic; flex: 1; }
    .card-actions { display: flex; gap: 8px; }
    .approve-btn { background: #2E7D32 !important; }
    .empty-state { color: #aaa; font-size: 14px; padding: 20px 0; }
  `]
})
export class ReviewsManagementComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  loading = true;
  all: any[] = [];

  get pending() { return this.all.filter(r => !r.approved); }
  get approved() { return this.all.filter(r => r.approved); }
  get pendingCount() { return this.pending.length; }

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getAllReviews().subscribe({
      next: reviews => { this.all = reviews; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(review: any) {
    this.api.approveReview(review.id).subscribe({
      next: () => {
        review.approved = true;
        this.snack.open('Review approved and now live.', 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to approve review.', 'OK', { duration: 3000 })
    });
  }

  remove(review: any) {
    this.api.deleteReview(review.id).subscribe({
      next: () => {
        this.all = this.all.filter(r => r.id !== review.id);
        this.snack.open('Review deleted.', 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to delete review.', 'OK', { duration: 3000 })
    });
  }
}
