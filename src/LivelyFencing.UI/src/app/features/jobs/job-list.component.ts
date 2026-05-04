import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-job-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>New Job</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Customer *</mat-label>
          <mat-select formControlName="customerId">
            <mat-option *ngFor="let c of data.customers" [value]="c.id">{{ c.name }}{{ c.company ? ' — ' + c.company : '' }}</mat-option>
          </mat-select>
          <mat-error>Customer is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Job Title *</mat-label>
          <input matInput formControlName="title" placeholder="Backyard wood fence installation">
          <mat-error>Title is required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="2" placeholder="Brief description of the work needed"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fencing Type *</mat-label>
          <mat-select formControlName="fencingType">
            <mat-option value="Wood">Wood</mat-option>
            <mat-option value="ChainLink">Chain Link</mat-option>
            <mat-option value="Vinyl">Vinyl</mat-option>
            <mat-option value="Aluminum">Aluminum</mat-option>
            <mat-option value="WroughtIron">Wrought Iron</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Job Location / Address</mat-label>
          <input matInput formControlName="location" placeholder="123 Oak St, Atlanta GA">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Linear Feet</mat-label>
          <input matInput formControlName="linearFeet" type="number" min="0">
          <span matSuffix style="padding-right:8px">ft</span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fence Height</mat-label>
          <input matInput formControlName="height" type="number" min="0">
          <span matSuffix style="padding-right:8px">ft</span>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Number of Gates</mat-label>
          <input matInput formControlName="gates" type="number" min="0">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Any special requirements or notes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Create Job</button>
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
export class JobFormDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<JobFormDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as { customers: any[] };

  form = this.fb.group({
    customerId: ['', Validators.required],
    title: ['', Validators.required],
    description: [''],
    fencingType: ['Wood', Validators.required],
    location: [''],
    linearFeet: [null as number | null],
    height: [null as number | null],
    gates: [null as number | null],
    notes: [''],
  });

  save() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatTooltipModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Jobs</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="loadJobs()">
              <mat-option value="">All</mat-option>
              <mat-option value="Active">Active</mat-option>
              <mat-option value="Completed">Completed</mat-option>
              <mat-option value="OnHold">On Hold</mat-option>
              <mat-option value="Cancelled">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="openCreateDialog()" *ngIf="auth.hasRole('Admin','Sales')">
            <mat-icon>add</mat-icon> New Job
          </button>
        </div>
      </div>

      <div class="table-wrap"><table mat-table [dataSource]="jobs()" class="mat-elevation-z2 full-width">
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let j"><strong>{{ j.title }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="customer">
          <th mat-header-cell *matHeaderCellDef>Customer</th>
          <td mat-cell *matCellDef="let j">{{ j.customer?.name }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Type</th>
          <td mat-cell *matCellDef="let j">{{ j.fencingType }}</td>
        </ng-container>
        <ng-container matColumnDef="location">
          <th mat-header-cell *matHeaderCellDef>Location</th>
          <td mat-cell *matCellDef="let j">{{ j.location || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let j">
            <mat-chip [ngClass]="'status-' + j.status.toLowerCase()">{{ j.status }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="created">
          <th mat-header-cell *matHeaderCellDef>Created</th>
          <td mat-cell *matCellDef="let j">{{ j.createdAt | date:'mediumDate' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let j">
            <a mat-icon-button [routerLink]="['/cq/jobs', j.id]" matTooltip="View job"><mat-icon>visibility</mat-icon></a>
            <button mat-icon-button matTooltip="Delete job" *ngIf="auth.isAdmin()" (click)="deleteJob(j)" class="delete-btn">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
      </table></div>

      <div *ngIf="jobs().length === 0" class="empty-state">
        <mat-icon>work_outline</mat-icon>
        <p>No jobs found</p>
        <button mat-raised-button color="primary" (click)="openCreateDialog()" *ngIf="auth.hasRole('Admin','Sales')">Create First Job</button>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .status-filter { width: 160px; }
    .full-width { width: 100%; }
    .table-row:hover { background: #F5F5F5; cursor: pointer; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #9E9E9E; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .status-active { background-color: #E8F5E9; color: #2E7D32; }
    .status-completed { background-color: #E3F2FD; color: #1565C0; }
    .status-cancelled { background-color: #FFEBEE; color: #C62828; }
    .status-onhold { background-color: #FFF3E0; color: #E65100; }
    .delete-btn { color: #C62828; }
    .delete-btn { color: #C62828; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-type { display: none !important; }
      .mat-column-location { display: none !important; }
      .mat-column-created { display: none !important; }
    }
  `]
})
export class JobListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private dialog = inject(MatDialog);
  jobs = signal<any[]>([]);
  customers = signal<any[]>([]);
  statusFilter = 'Active';
  cols = ['title', 'customer', 'type', 'location', 'status', 'created', 'actions'];

  ngOnInit() {
    this.loadJobs();
    this.api.getCustomers().subscribe(c => this.customers.set(c));
  }

  loadJobs() {
    this.api.getJobs(undefined, this.statusFilter || undefined).subscribe(j => this.jobs.set(j));
  }

  openCreateDialog() {
    const ref = this.dialog.open(JobFormDialogComponent, {
      data: { customers: this.customers() },
      width: '640px'
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.api.createJob(result).subscribe(() => this.loadJobs());
    });
  }

  deleteJob(j: any) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Job', message: `Delete job "${j.title}"? This can be recovered by an admin.` }, width: '400px'
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.api.deleteJob(j.id).subscribe(() => this.loadJobs());
    });
  }
}
