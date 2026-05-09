import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RejectDialogComponent } from '../../shared/dialogs.component';

@Component({
  selector: 'app-portal-quote',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatProgressBarModule, MatSnackBarModule, MatDividerModule, MatDialogModule],
  template: `
    <div class="portal-container">
      <div class="portal-top-bar">
        <a href="/" class="back-home-btn">
          <mat-icon>arrow_back</mat-icon> Back to Home
        </a>
      </div>
      <div class="portal-header">
        <mat-icon class="logo-icon">home</mat-icon>
        <h1>Closing Bell Real Estate</h1>
        <p>Real Estate Services</p>
      </div>

      <div class="portal-content" *ngIf="quote(); else loading">
        <!-- Accepted/Rejected banner -->
        <div class="status-banner accepted" *ngIf="quote().status === 'Accepted'">
          <mat-icon>check_circle</mat-icon>
          <span>You accepted this quote on {{ quote().acceptedAt | date:'mediumDate' }}. We'll be in touch shortly!</span>
        </div>
        <div class="status-banner rejected" *ngIf="quote().status === 'Rejected'">
          <mat-icon>cancel</mat-icon>
          <span>This quote was declined.</span>
        </div>
        <div class="status-banner expired" *ngIf="quote().status === 'Expired'">
          <mat-icon>timer_off</mat-icon>
          <span>This quote has expired. Please contact us for an updated quote.</span>
        </div>

        <mat-card class="quote-card">
          <mat-card-header>
            <mat-card-title>Quote #{{ quote().id.substring(0,8).toUpperCase() }}</mat-card-title>
            <mat-card-subtitle>For: {{ quote().job?.title }} | Valid until: {{ quote().validUntil | date:'mediumDate' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="quote().lineItems || []" class="full-width">
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let li">{{ li.description }}</td>
              </ng-container>
              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef class="num">Qty</th>
                <td mat-cell *matCellDef="let li" class="num">{{ li.quantity }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="num">Total</th>
                <td mat-cell *matCellDef="let li" class="num">{{ li.quantity * li.unitPrice | currency }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['description','qty','total']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['description','qty','total'];"></tr>
            </table>
            <div class="total-row">
              <span>TOTAL</span>
              <span class="total-amount">{{ quote().totalAmount | currency }}</span>
            </div>
          </mat-card-content>
          <mat-card-actions *ngIf="quote().status === 'Sent'">
            <button mat-raised-button color="primary" (click)="accept()" [disabled]="working">
              <mat-icon>check</mat-icon> Accept This Quote
            </button>
            <button mat-stroked-button color="warn" (click)="decline()" [disabled]="working">
              <mat-icon>close</mat-icon> Decline
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <ng-template #loading>
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        <p class="loading-text">Loading your quote...</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .portal-container { max-width: 700px; margin: 0 auto; padding: 24px; }
    .portal-top-bar { display: flex; align-items: center; margin-bottom: 16px; }
    .back-home-btn { display: inline-flex; align-items: center; gap: 6px; color: #2E7D32; text-decoration: none; font-size: 14px; font-weight: 600; padding: 6px 12px; border-radius: 6px; transition: background .2s; }
    .back-home-btn:hover { background: #E8F5E9; }
    .back-home-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .portal-header { text-align: center; background: #2E7D32; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .portal-header h1 { margin: 8px 0 4px; font-size: 28px; }
    .portal-header p { margin: 0; opacity: 0.8; }
    .logo-icon { font-size: 40px; width: 40px; height: 40px; color: #A5D6A7; }
    .status-banner { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; }
    .status-banner.accepted { background: #E8F5E9; color: #1B5E20; }
    .status-banner.rejected { background: #FFEBEE; color: #B71C1C; }
    .status-banner.expired { background: #FFF8E1; color: #F57F17; }
    .quote-card { width: 100%; }
    .full-width { width: 100%; }
    .num { text-align: right; }
    .total-row { display: flex; justify-content: space-between; padding: 16px 0 4px; font-weight: bold; border-top: 1px solid #eee; margin-top: 8px; }
    .total-amount { color: #2E7D32; font-size: 20px; }
    .loading-text { text-align: center; color: #666; }
    mat-card-actions { display: flex; gap: 8px; padding: 8px 16px 16px; flex-wrap: wrap; }
  `]
})
export class PortalQuoteComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  quote = signal<any>(null);
  working = false;

  ngOnInit() {
    this.api.getPortalQuote(this.route.snapshot.params['token']).subscribe(q => this.quote.set(q));
  }

  accept() {
    this.working = true;
    this.api.acceptPortalQuote(this.route.snapshot.params['token']).subscribe({
      next: (res) => { this.loadQuote(); this.snackBar.open(res.message, 'OK', { duration: 5000 }); this.working = false; },
      error: () => this.working = false
    });
  }

  decline() {
    this.dialog.open(RejectDialogComponent, {
      data: { title: 'Decline Quote', message: 'Let us know why (optional).', placeholder: 'Reason (optional)', required: false, confirmLabel: 'Decline' },
      width: '420px'
    }).afterClosed().subscribe(reason => {
      if (reason === undefined) return;
      this.working = true;
      this.api.rejectPortalQuote(this.route.snapshot.params['token'], reason ?? undefined).subscribe({
        next: () => { this.loadQuote(); this.working = false; },
        error: () => this.working = false
      });
    });
  }

  private loadQuote() {
    this.api.getPortalQuote(this.route.snapshot.params['token']).subscribe(q => this.quote.set(q));
  }
}
