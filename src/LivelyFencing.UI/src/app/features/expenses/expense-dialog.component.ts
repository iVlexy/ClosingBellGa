import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Expense' : 'Add Expense' }}</h2>
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
        <mat-form-field appearance="outline">
          <mat-label>Vendor (optional)</mat-label>
          <input matInput [(ngModel)]="form.vendor">
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
export class ExpenseDialogComponent {
  api = inject(ApiService);
  snack = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ExpenseDialogComponent>);

  categories = ['Supplies','Equipment','Fuel','Insurance','Tools','Marketing','Utilities','Office','Maintenance','Other'];
  working = false;
  form: any = {};

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.form = data ? {
      description: data.description,
      date: new Date(data.date),
      amount: data.amount,
      category: data.category,
      vendor: data.vendor,
      notes: data.notes,
      jobId: data.jobId
    } : { description: '', date: new Date(), amount: null, category: 'Supplies', vendor: '', notes: '' };
  }

  save() {
    if (!this.form.description || !this.form.amount || !this.form.category) return;
    this.working = true;
    const payload = { ...this.form, date: new Date(this.form.date).toISOString(), jobId: this.form.jobId || null };
    const req = this.data
      ? this.api.updateExpense(this.data.id, payload)
      : this.api.createExpense(payload);
    req.subscribe({
      next: () => { this.snack.open(this.data ? 'Updated' : 'Added', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
      error: () => { this.working = false; this.snack.open('Error saving expense', 'OK', { duration: 3000 }); }
    });
  }
}
