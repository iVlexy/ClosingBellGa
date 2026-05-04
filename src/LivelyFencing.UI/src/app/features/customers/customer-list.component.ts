import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit Customer' : 'New Customer' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Full Name *</mat-label>
          <input matInput formControlName="name" placeholder="John Smith">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Company</mat-label>
          <input matInput formControlName="company" placeholder="Acme Corp">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput formControlName="email" type="email" placeholder="john@example.com">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email address</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="(555) 555-5555">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Billing Address</mat-label>
          <input matInput formControlName="billingAddress" placeholder="123 Main St">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput formControlName="city">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" placeholder="GA" maxlength="2">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>ZIP</mat-label>
          <input matInput formControlName="zip" placeholder="30301">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ data?.id ? 'Save Changes' : 'Create Customer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      padding-top: 8px;
    }
    .full-width { grid-column: span 2; }
    mat-form-field { width: 100%; }
  `]
})
export class CustomerFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<CustomerFormDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as any;

  form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
    company: [this.data?.company ?? ''],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data?.phone ?? ''],
    billingAddress: [this.data?.billingAddress ?? ''],
    city: [this.data?.city ?? ''],
    state: [this.data?.state ?? ''],
    zip: [this.data?.zip ?? ''],
  });

  save() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatDialogModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Customers</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()" *ngIf="auth.hasRole('Admin','Sales')">
          <mat-icon>person_add</mat-icon> New Customer
        </button>
      </div>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search customers</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="loadCustomers()" placeholder="Name, email, or company">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="table-wrap"><table mat-table [dataSource]="customers()" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="company">
          <th mat-header-cell *matHeaderCellDef>Company</th>
          <td mat-cell *matCellDef="let c">{{ c.company || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let c">{{ c.email }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Phone</th>
          <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="city">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let c">{{ c.city || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let c">
            <a mat-icon-button [routerLink]="['/cq/customers', c.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
            <button mat-icon-button matTooltip="Edit" *ngIf="auth.hasRole('Admin','Sales')" (click)="openEditDialog(c)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete customer" *ngIf="auth.isAdmin()" (click)="deleteCustomer(c)" class="delete-btn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="table-row"></tr>
      </table></div>

      <div *ngIf="customers().length === 0" class="empty-state">
        <mat-icon>people_outline</mat-icon>
        <p>No customers found</p>
        <button mat-raised-button color="primary" (click)="openCreateDialog()" *ngIf="auth.hasRole('Admin','Sales')">Add First Customer</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .search-field { width: 100%; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .table-row:hover { background: #F5F5F5; cursor: pointer; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9E9E9E; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .delete-btn { color: #C62828; }
    .delete-btn { color: #C62828; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-company { display: none !important; }
      .mat-column-phone { display: none !important; }
      .mat-column-city { display: none !important; }
      .mat-column-email { font-size: 12px; }
    }
  `]
})
export class CustomerListComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  private dialog = inject(MatDialog);
  customers = signal<any[]>([]);
  search = '';
  displayedColumns = ['name', 'company', 'email', 'phone', 'city', 'actions'];

  ngOnInit() { this.loadCustomers(); }

  loadCustomers() {
    this.api.getCustomers(this.search || undefined).subscribe(c => this.customers.set(c));
  }

  openCreateDialog() {
    const ref = this.dialog.open(CustomerFormDialogComponent, { data: null, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.api.createCustomer(result).subscribe(() => this.loadCustomers());
    });
  }

  openEditDialog(customer: any) {
    const ref = this.dialog.open(CustomerFormDialogComponent, { data: customer, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.api.updateCustomer(customer.id, result).subscribe(() => this.loadCustomers());
    });
  }

  deleteCustomer(c: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Customer', message: `Delete customer "${c.name}"? This can be recovered by an admin.` }, width: '400px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteCustomer(c.id).subscribe(() => this.loadCustomers());
    });
  }
}
