import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule, MatSelectModule, MatFormFieldModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Reports & Tax Summary</h1>
        <mat-form-field appearance="outline">
          <mat-label>Tax Year</mat-label>
          <mat-select [(ngModel)]="year" (ngModelChange)="loadAll()">
            <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Tax Summary Card -->
      <mat-card class="summary-card" *ngIf="taxSummary()">
        <mat-card-header><mat-card-title>{{ year }} Tax Summary (Schedule C)</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="summary-grid">
            <div class="summary-item revenue"><div class="label">Total Income</div><div class="value">{{ taxSummary().totalIncome | currency }}</div></div>
            <div class="summary-item expense"><div class="label">Business Expenses</div><div class="value">{{ taxSummary().totalExpenses | currency }}</div></div>
            <div class="summary-item profit"><div class="label">Gross Profit</div><div class="value">{{ taxSummary().grossProfit | currency }}</div></div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Expense Breakdown -->
      <mat-card *ngIf="expenseReport()">
        <mat-card-header>
          <mat-card-title>Business Expenses</mat-card-title>
          <mat-card-subtitle>{{ expenseReport().count }} expenses · Total: {{ expenseReport().total | currency }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="two-col">
            <!-- By Category -->
            <div>
              <h3 class="section-label">By Category</h3>
              <div class="table-wrap"><table mat-table [dataSource]="expenseReport().byCategory || []" class="full-width">
                <ng-container matColumnDef="category"><th mat-header-cell *matHeaderCellDef>Category</th><td mat-cell *matCellDef="let e"><mat-chip>{{ e.category }}</mat-chip></td></ng-container>
                <ng-container matColumnDef="count"><th mat-header-cell *matHeaderCellDef class="num">Count</th><td mat-cell *matCellDef="let e" class="num">{{ e.count }}</td></ng-container>
                <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef class="num">Total</th><td mat-cell *matCellDef="let e" class="num"><strong>{{ e.total | currency }}</strong></td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['category','count','total']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['category','count','total'];"></tr>
              </table></div>
            </div>
            <!-- By Month -->
            <div>
              <h3 class="section-label">By Month</h3>
              <div class="table-wrap"><table mat-table [dataSource]="expenseReport().byMonth || []" class="full-width">
                <ng-container matColumnDef="month"><th mat-header-cell *matHeaderCellDef>Month</th><td mat-cell *matCellDef="let e">{{ year }}-{{ e.month | number:'2.0-0' }}</td></ng-container>
                <ng-container matColumnDef="count"><th mat-header-cell *matHeaderCellDef class="num">Count</th><td mat-cell *matCellDef="let e" class="num">{{ e.count }}</td></ng-container>
                <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef class="num">Total</th><td mat-cell *matCellDef="let e" class="num"><strong>{{ e.total | currency }}</strong></td></ng-container>
                <tr mat-header-row *matHeaderRowDef="['month','count','total']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['month','count','total'];"></tr>
              </table></div>
            </div>
          </div>
          <div class="export-row"><button mat-stroked-button (click)="exportCsv(expenseReport().byCategory, 'expenses-by-category-'+year)"><mat-icon>download</mat-icon> Export CSV</button></div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    .summary-item { padding: 16px; border-radius: 4px; text-align: center; }
    .summary-item .label { font-size: 12px; color: #666; }
    .summary-item .value { font-size: 22px; font-weight: bold; margin-top: 4px; }
    .summary-item.revenue { background: #E8F5E9; } .summary-item.revenue .value { color: #2E7D32; }
    .summary-item.profit { background: #E3F2FD; } .summary-item.profit .value { color: #1565C0; }
    .summary-item.expense { background: #FBE9E7; } .summary-item.expense .value { color: #BF360C; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .section-label { font-size: 14px; font-weight: 500; color: #555; margin: 8px 0; }
    .full-width { width: 100%; }
    .num { text-align: right; }
    .export-row { display: flex; justify-content: flex-end; padding: 8px 0; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 768px) {
      .two-col { grid-template-columns: 1fr; }
      .page-container { overflow-x: hidden; padding: 16px; }
      .page-header { flex-wrap: wrap; gap: 8px; }
      .mat-column-email { display: none !important; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  api = inject(ApiService);
  year = new Date().getFullYear();
  years = Array.from({ length: 5 }, (_, i) => this.year - i);
  taxSummary = signal<any>(null);
  expenseReport = signal<any>(null);

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getTaxSummaryReport(this.year).subscribe(d => this.taxSummary.set(d));
    this.api.getExpenseReport(this.year).subscribe(d => this.expenseReport.set(d));
  }

  exportCsv(data: any[], filename: string) {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
  }
}
