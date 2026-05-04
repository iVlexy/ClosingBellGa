import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatChipsModule, MatSelectModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Budgets</h1>
        <button mat-flat-button color="primary" (click)="showForm = !showForm"><mat-icon>add</mat-icon> New Budget</button>
      </div>

      <div class="new-budget-form mat-elevation-z2" *ngIf="showForm">
        <h3>Create Budget</h3>
        <div class="form-row">
          <mat-form-field appearance="outline"><mat-label>Name</mat-label><input matInput [(ngModel)]="newBudget.name" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fiscal Year</mat-label><input matInput type="number" [(ngModel)]="newBudget.fiscalYear" /></mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Period</mat-label>
            <mat-select [(ngModel)]="newBudget.period">
              <mat-option value="Annual">Annual</mat-option><mat-option value="Q1">Q1</mat-option><mat-option value="Q2">Q2</mat-option><mat-option value="Q3">Q3</mat-option><mat-option value="Q4">Q4</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" style="width:100%"><mat-label>Notes</mat-label><textarea matInput [(ngModel)]="newBudget.notes" rows="2"></textarea></mat-form-field>
        <div class="form-actions">
          <button mat-button (click)="showForm = false">Cancel</button>
          <button mat-flat-button color="primary" (click)="create()">Create</button>
        </div>
      </div>

      <div class="table-wrap"><table mat-table [dataSource]="budgets()" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Name</th><td mat-cell *matCellDef="let b">{{ b.name }}</td></ng-container>
        <ng-container matColumnDef="fiscalYear"><th mat-header-cell *matHeaderCellDef>Fiscal Year</th><td mat-cell *matCellDef="let b">{{ b.fiscalYear }}</td></ng-container>
        <ng-container matColumnDef="period"><th mat-header-cell *matHeaderCellDef>Period</th><td mat-cell *matCellDef="let b"><mat-chip>{{ b.period }}</mat-chip></td></ng-container>
        <ng-container matColumnDef="totalBudget"><th mat-header-cell *matHeaderCellDef>Budget</th><td mat-cell *matCellDef="let b">{{ b.totalBudgetedAmount | currency }}</td></ng-container>
        <ng-container matColumnDef="totalActual"><th mat-header-cell *matHeaderCellDef>Actual</th><td mat-cell *matCellDef="let b">{{ b.totalActualAmount | currency }}</td></ng-container>
        <ng-container matColumnDef="variance"><th mat-header-cell *matHeaderCellDef>Variance</th>
          <td mat-cell *matCellDef="let b" [style.color]="(b.totalActualAmount - b.totalBudgetedAmount) < 0 ? '#4CAF50' : '#F44336'">
            {{ ((b.totalBudgetedAmount || 0) - (b.totalActualAmount || 0)) | currency }}
          </td>
        </ng-container>
        <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let b">
          <a mat-icon-button [routerLink]="['/cq/budgets', b.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
          <button mat-icon-button matTooltip="Delete budget" *ngIf="auth.isAdmin()" (click)="deleteBudget(b)" class="delete-btn"><mat-icon>delete</mat-icon></button>
        </td></ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
      </table></div>
      <p *ngIf="budgets().length === 0" class="empty-state">No budgets created yet.</p>
    </div>
  `,
  styles: [`.page-container{padding:24px} .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px} .page-title{font-size:24px;font-weight:500;color:#1B5E20;margin:0} .full-width{width:100%} .table-row:hover{background:#F5F5F5;cursor:pointer} .new-budget-form{padding:20px;margin-bottom:16px;background:#fff;border-radius:8px} .new-budget-form h3{margin:0 0 16px;color:#1B5E20} .form-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px} .form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:8px} .empty-state{color:#888;font-style:italic;padding:24px;text-align:center} .delete-btn{color:#C62828} .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; } @media (max-width: 600px) { .page-container { overflow-x: hidden; } .mat-column-period { display: none !important; } .mat-column-totalActual { display: none !important; } .mat-column-variance { display: none !important; } }`]
})
export class BudgetListComponent implements OnInit {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  auth = inject(AuthService);
  budgets = signal<any[]>([]);
  cols = ['name', 'fiscalYear', 'period', 'totalBudget', 'totalActual', 'variance', 'actions'];
  showForm = false;
  newBudget: any = { name: '', fiscalYear: new Date().getFullYear(), period: 'Annual', notes: '' };

  ngOnInit() { this.api.getBudgets().subscribe(b => this.budgets.set(b)); }

  create() {
    this.api.createBudget(this.newBudget).subscribe(b => {
      this.budgets.update(list => [...list, b]);
      this.newBudget = { name: '', fiscalYear: new Date().getFullYear(), period: 'Annual', notes: '' };
      this.showForm = false;
    });
  }

  deleteBudget(b: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Budget', message: `Delete budget "${b.name}"? This can be recovered by an admin.` }, width: '400px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteBudget(b.id).subscribe(() => this.budgets.update(list => list.filter(x => x.id !== b.id)));
    });
  }
}
