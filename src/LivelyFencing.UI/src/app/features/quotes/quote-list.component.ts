import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-new-quote-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>New Quote</h2>
    <mat-dialog-content>
      <p class="hint">Select a customer and job, then choose how to create the quote.</p>
      <form [formGroup]="form" class="form-col">
        <mat-form-field appearance="outline">
          <mat-label>Customer *</mat-label>
          <mat-select formControlName="customerId" (selectionChange)="onCustomerChange()">
            <mat-option *ngFor="let c of data.customers" [value]="c.id">{{ c.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Job *</mat-label>
          <mat-select formControlName="jobId">
            <mat-option *ngFor="let j of filteredJobs" [value]="j.id">{{ j.title }} ({{ j.fencingType }})</mat-option>
          </mat-select>
          <mat-hint *ngIf="form.get('customerId')?.value && filteredJobs.length === 0">
            No active jobs for this customer — create a job first
          </mat-hint>
        </mat-form-field>
      </form>
      <div *ngIf="generating" class="spinner-row">
        <mat-spinner diameter="24"></mat-spinner>
        <span>Generating AI quote...</span>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="generating">Cancel</button>
      <button mat-stroked-button color="primary" [disabled]="form.invalid || generating" (click)="save('manual')">
        Manual Quote
      </button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || generating" (click)="save('ai')">
        <mat-icon>smart_toy</mat-icon> AI Generate
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-col { display: flex; flex-direction: column; width: 100%; gap: 4px; padding-top: 8px; }
    mat-form-field { width: 100%; }
    .hint { color: #757575; margin: 0 0 12px; font-size: 14px; }
    .spinner-row { display: flex; align-items: center; gap: 12px; margin-top: 12px; color: #1B5E20; }
  `]
})
export class NewQuoteDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<NewQuoteDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { customers: any[], jobs: any[] };
  filteredJobs: any[] = [];
  generating = false;

  form = this.fb.group({
    customerId: ['', Validators.required],
    jobId: ['', Validators.required],
  });

  onCustomerChange() {
    const cid = this.form.get('customerId')?.value;
    this.filteredJobs = this.data.jobs.filter(j => j.customerId === cid && j.status === 'Active');
    this.form.get('jobId')?.setValue('');
  }

  save(mode: 'ai' | 'manual') {
    if (this.form.valid) {
      if (mode === 'ai') this.generating = true;
      this.dialogRef.close({ jobId: this.form.get('jobId')!.value, mode });
    }
  }
}

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, MatFormFieldModule, MatDialogModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Quotes</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Filter by status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="loadQuotes()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="openNewQuoteDialog()" *ngIf="auth.hasRole('Admin','Sales')">
            <mat-icon>request_quote</mat-icon> New Quote
          </button>
        </div>
      </div>

      <div class="table-wrap"><table mat-table [dataSource]="quotes()" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef>Customer</th>
          <td mat-cell *matCellDef="let q">{{ q.customer?.name }}</td>
        </ng-container>
        <ng-container matColumnDef="job">
          <th mat-header-cell *matHeaderCellDef>Job</th>
          <td mat-cell *matCellDef="let q">{{ q.job?.title }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let q">
            <mat-chip [ngClass]="'status-' + q.status.toLowerCase()">{{ q.status }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let q"><strong>{{ q.totalAmount | currency }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="ai">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let q">
            <mat-icon *ngIf="q.aiGenerated" class="ai-icon" matTooltip="AI Generated">smart_toy</mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="created">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let q">{{ q.createdAt | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let q">
            <a mat-icon-button [routerLink]="['/cq/quotes', q.id]" matTooltip="View quote"><mat-icon>visibility</mat-icon></a>
            <button mat-icon-button matTooltip="Delete quote" *ngIf="auth.isAdmin() && q.status !== 'Accepted'" (click)="deleteQuote(q)" class="delete-btn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
      </table></div>

      <div *ngIf="quotes().length === 0" class="empty-state">
        <mat-icon>request_quote</mat-icon>
        <p>No quotes yet</p>
        <button mat-raised-button color="primary" (click)="openNewQuoteDialog()" *ngIf="auth.hasRole('Admin','Sales')">Create First Quote</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .status-filter { width: 200px; }
    .full-width { width: 100%; }
    .table-row:hover { background: #F5F5F5; cursor: pointer; }
    .ai-icon { color: #7B1FA2; font-size: 18px; width: 18px; height: 18px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9E9E9E; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .status-draft { background-color: #F5F5F5; color: #616161; }
    .status-pendingapproval { background-color: #FFF3E0; color: #E65100; }
    .status-approved { background-color: #E8F5E9; color: #2E7D32; }
    .status-sent { background-color: #E3F2FD; color: #1565C0; }
    .status-accepted { background-color: #E8F5E9; color: #1B5E20; }
    .status-rejected { background-color: #FFEBEE; color: #C62828; }
    .status-expired { background-color: #FAFAFA; color: #9E9E9E; }
    .delete-btn { color: #C62828; }
    .delete-btn { color: #C62828; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-job { display: none !important; }
      .mat-column-ai { display: none !important; }
      .mat-column-created { display: none !important; }
    }
  `]
})
export class QuoteListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  quotes = signal<any[]>([]);
  customers = signal<any[]>([]);
  jobs = signal<any[]>([]);
  statusFilter = '';
  statuses = ['Draft', 'PendingApproval', 'Approved', 'Sent', 'Accepted', 'Rejected', 'Expired'];
  displayedColumns = ['customer', 'job', 'status', 'total', 'ai', 'created', 'actions'];

  ngOnInit() {
    this.loadQuotes();
    this.api.getCustomers().subscribe(c => this.customers.set(c));
    this.api.getJobs().subscribe(j => this.jobs.set(j));
  }

  loadQuotes() {
    this.api.getQuotes(this.statusFilter || undefined).subscribe(q => this.quotes.set(q));
  }

  deleteQuote(q: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Quote', message: `Delete quote for "${q.customer?.name}"? This can be recovered by an admin.` }, width: '400px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteQuote(q.id).subscribe(() => this.loadQuotes());
    });
  }



  openNewQuoteDialog() {
    const ref = this.dialog.open(NewQuoteDialogComponent, {
      data: { customers: this.customers(), jobs: this.jobs() },
      width: '480px'
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      if (result.mode === 'ai') {
        this.api.generateQuote(result.jobId).subscribe(q => {
          this.loadQuotes();
          this.router.navigate(['/cq/quotes', q.id]);
        });
      } else {
        this.api.createManualQuote({ jobId: result.jobId }).subscribe(q => {
          this.loadQuotes();
          this.router.navigate(['/cq/quotes', q.id]);
        });
      }
    });
  }
}
