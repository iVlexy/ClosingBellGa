import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';

@Component({
  selector: 'app-income-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Income' : 'Add Income' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="form.description" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date</mat-label>
          <input matInput [matDatepicker]="dp" [(ngModel)]="form.date" required>
          <mat-datepicker-toggle matIconSuffix [for]="dp"></mat-datepicker-toggle>
          <mat-datepicker #dp></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Amount ($)</mat-label>
          <input matInput type="number" step="0.01" min="0" [(ngModel)]="form.amount" required>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="form.category" required>
            <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput rows="2" [(ngModel)]="form.notes"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="working">
        {{ data ? 'Update' : 'Add' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 8px; } .full { grid-column: 1/-1; }`]
})
export class IncomeDialogComponent {
  api = inject(ApiService);
  snack = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<IncomeDialogComponent>);
  categories = ['JobPayment','ChangeOrder','Deposit','Referral','MaterialSale','Other'];
  working = false;
  form: any = {};

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.form = data ? {
      description: data.description,
      date: new Date(data.date),
      amount: data.amount,
      category: data.category,
      notes: data.notes,
      jobId: data.jobId,
      quoteId: data.quoteId
    } : { description: '', date: new Date(), amount: null, category: 'JobPayment', notes: '' };
  }

  save() {
    if (!this.form.description || !this.form.amount || !this.form.category) return;
    this.working = true;
    const payload = { ...this.form, date: new Date(this.form.date).toISOString(), jobId: this.form.jobId || null, quoteId: this.form.quoteId || null };
    const req = this.data
      ? this.api.updateIncome(this.data.id, payload)
      : this.api.createIncome(payload);
    req.subscribe({
      next: () => { this.snack.open(this.data ? 'Updated' : 'Added', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
      error: () => { this.working = false; this.snack.open('Error saving', 'OK', { duration: 3000 }); }
    });
  }
}

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Income</h1>
        <button mat-raised-button color="primary" (click)="openAdd()" *ngIf="auth.hasRole('Admin','Accountant')">
          <mat-icon>add</mat-icon> Add Income
        </button>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Year</mat-label>
            <mat-select [(ngModel)]="yearFilter" (ngModelChange)="load()">
              <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="catFilter" (ngModelChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>
          <div class="total-chip">
            <mat-chip color="primary">Total: {{ total() | currency }}</mat-chip>
          </div>
        </div>
      </mat-card>

      <mat-card>
        <div class="table-wrap"><table mat-table [dataSource]="incomes()" class="full-width">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let i">{{ i.date | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let i"><mat-chip [class]="'cat-' + i.category.toLowerCase()">{{ i.category }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let i">{{ i.description }}</td>
          </ng-container>
          <ng-container matColumnDef="job">
            <th mat-header-cell *matHeaderCellDef>Job</th>
            <td mat-cell *matCellDef="let i">
              <a *ngIf="i.jobId" [routerLink]="['/cq/jobs', i.jobId]" class="job-link">{{ i.jobTitle }}</a>
              <span *ngIf="!i.jobId" class="muted">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let i" class="amount">{{ i.amount | currency }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let i">
              <button mat-icon-button (click)="openEdit(i)" matTooltip="Edit" *ngIf="auth.hasRole('Admin','Accountant')"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(i)" matTooltip="Delete" *ngIf="auth.isAdmin()"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          <tr class="mat-row" *matNoDataRow><td [attr.colspan]="cols.length" class="no-data">No income records found.</td></tr>
        </table></div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 24px; color: #1B5E20; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .filters mat-form-field { width: 160px; }
    .total-chip { margin-left: auto; font-weight: bold; }
    .full-width { width: 100%; }
    .amount { font-weight: 600; color: #2E7D32; }
    .no-data { padding: 24px; text-align: center; color: #888; }
    .job-link { color: #1565C0; text-decoration: none; }
    .job-link:hover { text-decoration: underline; }
    .muted { color: #BDBDBD; }
    mat-chip { font-size: 12px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  `]
})
export class IncomeListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);

  incomes = signal<any[]>([]);
  yearFilter = new Date().getFullYear();
  catFilter = '';
  cols = ['date', 'category', 'description', 'job', 'amount', 'actions'];
  categories = ['JobPayment','ChangeOrder','Deposit','Referral','MaterialSale','Other'];
  years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  total = () => this.incomes().reduce((s, i) => s + i.amount, 0);

  ngOnInit() { this.load(); }

  load() {
    this.api.getIncomes(this.yearFilter, this.catFilter || undefined).subscribe(i => this.incomes.set(i));
  }

  openAdd() {
    this.dialog.open(IncomeDialogComponent, { width: '480px', data: null }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(i: any) {
    this.dialog.open(IncomeDialogComponent, { width: '480px', data: i }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(i: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Income', message: `Delete "${i.description}"?` }, width: '360px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteIncome(i.id).subscribe({ next: () => { this.snack.open('Deleted', 'OK', { duration: 3000 }); this.load(); } });
    });
  }
}
