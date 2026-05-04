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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseDialogComponent } from './expense-dialog.component';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatTableModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatCardModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Business Expenses</h1>
        <button mat-raised-button color="primary" (click)="openAdd()" *ngIf="auth.hasRole('Admin','Accountant')">
          <mat-icon>add</mat-icon> Add Expense
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
            <mat-chip>Total: {{ total() | currency }}</mat-chip>
          </div>
        </div>
      </mat-card>

      <mat-card>
        <div class="table-wrap"><table mat-table [dataSource]="expenses()" class="full-width">
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date</th>
            <td mat-cell *matCellDef="let e">{{ e.date | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let e"><mat-chip [class]="'cat-' + e.category.toLowerCase()">{{ e.category }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let e">{{ e.description }}</td>
          </ng-container>
          <ng-container matColumnDef="vendor">
            <th mat-header-cell *matHeaderCellDef>Vendor</th>
            <td mat-cell *matCellDef="let e">{{ e.vendor || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="job">
            <th mat-header-cell *matHeaderCellDef>Job</th>
            <td mat-cell *matCellDef="let e">
              <a *ngIf="e.jobId" [routerLink]="['/cq/jobs', e.jobId]">{{ e.jobTitle }}</a>
              <span *ngIf="!e.jobId">—</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Amount</th>
            <td mat-cell *matCellDef="let e" class="amount">{{ e.amount | currency }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button (click)="openEdit(e)" matTooltip="Edit" *ngIf="auth.hasRole('Admin','Accountant')"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(e)" matTooltip="Delete" *ngIf="auth.isAdmin()"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          <tr class="mat-row" *matNoDataRow><td [attr.colspan]="cols.length" class="no-data">No expenses found.</td></tr>
        </table></div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .filter-card { margin-bottom: 16px; padding: 16px; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
    .filters mat-form-field { width: 160px; }
    .total-chip { margin-left: auto; font-weight: bold; }
    .full-width { width: 100%; }
    .amount { font-weight: 500; }
    .no-data { padding: 24px; text-align: center; color: #888; }
    mat-chip { font-size: 12px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-description { display: none !important; }
      .mat-column-vendor { display: none !important; }
      .mat-column-job { display: none !important; }
    }
  `]
})
export class ExpenseListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);

  expenses = signal<any[]>([]);
  yearFilter = new Date().getFullYear();
  catFilter = '';
  cols = ['date', 'category', 'description', 'vendor', 'job', 'amount', 'actions'];
  categories = ['Supplies','Equipment','Fuel','Insurance','Tools','Marketing','Utilities','Office','Maintenance','Other'];
  years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  total = () => this.expenses().reduce((s, e) => s + e.amount, 0);

  ngOnInit() { this.load(); }

  load() {
    this.api.getExpenses(this.yearFilter, this.catFilter || undefined).subscribe(e => this.expenses.set(e));
  }

  openAdd() {
    this.dialog.open(ExpenseDialogComponent, { width: '480px', data: null }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(e: any) {
    this.dialog.open(ExpenseDialogComponent, { width: '480px', data: e }).afterClosed().subscribe(r => { if (r) this.load(); });
  }

  delete(e: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Expense', message: `Delete "${e.description}"?` }, width: '360px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteExpense(e.id).subscribe({ next: () => { this.snack.open('Deleted', 'OK', { duration: 3000 }); this.load(); } });
    });
  }
}
