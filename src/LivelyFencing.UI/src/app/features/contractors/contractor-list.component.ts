import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/dialogs.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contractor-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatSelectModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Edit Contractor' : 'New Contractor' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Full Name *</mat-label>
          <input matInput formControlName="name" placeholder="Jane Doe">
          <mat-error>Name is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput formControlName="email" type="email" placeholder="jane@example.com">
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="(555) 555-5555">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" *ngIf="!data?.id">
          <mat-label>Tax ID Type *</mat-label>
          <mat-select formControlName="taxIdType">
            <mat-option value="SSN">SSN (Individual)</mat-option>
            <mat-option value="EIN">EIN (Business)</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" *ngIf="!data?.id">
          <mat-label>Tax ID *</mat-label>
          <input matInput formControlName="taxId" [placeholder]="form.get('taxIdType')?.value === 'EIN' ? 'XX-XXXXXXX' : 'XXX-XX-XXXX'">
          <mat-icon matSuffix matTooltip="Stored encrypted in database">lock</mat-icon>
          <mat-hint>Stored encrypted — never displayed after saving</mat-hint>
          <mat-error>Tax ID is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address" placeholder="123 Main St">
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
        {{ data?.id ? 'Save Changes' : 'Add Contractor' }}
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
  .delete-btn { color: #C62828; }
  `]
})
export class ContractorFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<ContractorFormDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as any;

  form = this.fb.group({
    name: [this.data?.name ?? '', Validators.required],
    email: [this.data?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data?.phone ?? ''],
    taxIdType: ['SSN', this.data?.id ? [] : [Validators.required]],
    taxId: ['', this.data?.id ? [] : [Validators.required]],
    address: [this.data?.address ?? ''],
    city: [this.data?.city ?? ''],
    state: [this.data?.state ?? ''],
    zip: [this.data?.zip ?? ''],
  });

  save() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}

@Component({
  selector: 'app-contractor-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Contractors</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon> New Contractor
        </button>
      </div>

      <div class="table-wrap"><table mat-table [dataSource]="contractors()" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let c"><strong>{{ c.name }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let c">{{ c.email }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Phone</th>
          <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="taxId">
          <th mat-header-cell *matHeaderCellDef>Tax ID</th>
          <td mat-cell *matCellDef="let c">
            <span class="tax-id">{{ c.maskedTaxId || '●●●-●●-●●●●' }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="city">
          <th mat-header-cell *matHeaderCellDef>City</th>
          <td mat-cell *matCellDef="let c">{{ c.city || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Active</th>
          <td mat-cell *matCellDef="let c">
            <mat-icon [style.color]="c.isActive ? '#4CAF50' : '#BDBDBD'">
              {{ c.isActive ? 'check_circle' : 'cancel' }}
            </mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let c">
            <a mat-icon-button [routerLink]="['/cq/contractors', c.id]" matTooltip="View"><mat-icon>visibility</mat-icon></a>
            <button mat-icon-button matTooltip="Edit" (click)="openEditDialog(c)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Delete contractor" *ngIf="auth.isAdmin()" (click)="deleteContractor(c)" class="delete-btn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
      </table></div>

      <div *ngIf="contractors().length === 0" class="empty-state">
        <mat-icon>engineering</mat-icon>
        <p>No contractors yet</p>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">Add First Contractor</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .full-width { width: 100%; }
    .table-row:hover { background: #F5F5F5; cursor: pointer; }
    .tax-id { font-family: monospace; color: #757575; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9E9E9E; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
  .delete-btn { color: #C62828; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-phone { display: none !important; }
      .mat-column-taxId { display: none !important; }
      .mat-column-city { display: none !important; }
    }
  `]
})
export class ContractorListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private dialog = inject(MatDialog);
  contractors = signal<any[]>([]);
  cols = ['name', 'email', 'phone', 'taxId', 'city', 'active', 'actions'];

  ngOnInit() { this.load(); }

  load() { this.api.getContractors().subscribe(c => this.contractors.set(c)); }

  openCreateDialog() {
    const ref = this.dialog.open(ContractorFormDialogComponent, { data: null, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.api.createContractor(result).subscribe(() => this.load());
    });
  }

  openEditDialog(contractor: any) {
    const ref = this.dialog.open(ContractorFormDialogComponent, { data: contractor, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.api.updateContractor(contractor.id, result).subscribe(() => this.load());
    });
  }

  deleteContractor(c: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Contractor', message: `Delete contractor "${c.name}"? This can be recovered by an admin.` }, width: '400px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteContractor(c.id).subscribe(() => this.load());
    });
  }


}
