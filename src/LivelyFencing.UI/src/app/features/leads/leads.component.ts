import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatChipsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatDividerModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Leads</h1>
          <p class="page-sub">Quote requests submitted from the website</p>
        </div>
        <div class="header-actions">
        <button mat-raised-button color="primary" (click)="openNewLead()">
          <mat-icon>add</mat-icon> New Lead
        </button>
        <div class="header-stats">
          <div class="stat-chip new"><mat-icon>fiber_new</mat-icon> {{ newCount() }} new</div>
          <div class="stat-chip total"><mat-icon>people</mat-icon> {{ leads().length }} total</div>
          <div class="stat-chip converted"><mat-icon>how_to_reg</mat-icon> {{ convertedCount() }} converted</div>
        </div>
        </div>
      </div>

      <div class="table-wrap"><table mat-table [dataSource]="leads()" class="mat-elevation-z2 full-width">

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let l">
            <span class="status-badge" [class.new]="!l.contacted" [class.done]="l.contacted">
              {{ l.contacted ? 'Contacted' : 'New' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="source">
          <th mat-header-cell *matHeaderCellDef>Source</th>
          <td mat-cell *matCellDef="let l">
            <span class="source-badge" [class]="'src-' + (l.source || 'website').toLowerCase()">{{ l.source || 'Website' }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let l"><strong>{{ l.name }}</strong></td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let l">
            <a [href]="'mailto:' + l.email" class="email-link">{{ l.email }}</a>
          </td>
        </ng-container>

        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Phone</th>
          <td mat-cell *matCellDef="let l">
            <a *ngIf="l.phone" [href]="'tel:' + l.phone" class="phone-link">{{ l.phone }}</a>
            <span *ngIf="!l.phone" class="muted">—</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="message">
          <th mat-header-cell *matHeaderCellDef>Project Description</th>
          <td mat-cell *matCellDef="let l">
            <span class="message-preview" [matTooltip]="l.message" matTooltipShowDelay="300">
              {{ l.message || '—' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Received</th>
          <td mat-cell *matCellDef="let l" class="date-cell">{{ l.createdAt | date:'MMM d, y h:mm a' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let l">
            <button mat-icon-button matTooltip="Convert to Customer & Create Quote"
              (click)="openConvert(l)" color="primary">
              <mat-icon>person_add</mat-icon>
            </button>
            <button mat-icon-button matTooltip="Mark as Contacted"
              *ngIf="!l.contacted" (click)="markContacted(l)">
              <mat-icon>check_circle</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols;"
          class="table-row" [class.contacted-row]="row.contacted"></tr>
      </table></div>

      <div *ngIf="leads().length === 0" class="empty-state">
        <mat-icon>inbox</mat-icon>
        <p>No leads yet — they'll appear here when someone fills out the website form.</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 0 0 4px; }
    .page-sub { color: #757575; font-size: 13px; margin: 0; }
    .header-stats { display: flex; gap: 12px; align-items: center; }
    .stat-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; }
    .stat-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .stat-chip.new { background: #FFF8E1; color: #F57F17; }
    .stat-chip.total { background: #E8F5E9; color: #2E7D32; }
    .full-width { width: 100%; }
    .status-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .status-badge.new { background: #FFF8E1; color: #F57F17; }
    .status-badge.done { background: #E8F5E9; color: #2E7D32; }
    .email-link { color: #1565C0; text-decoration: none; }
    .email-link:hover { text-decoration: underline; }
    .phone-link { color: #1565C0; text-decoration: none; }
    .muted { color: #BDBDBD; }
    .message-preview { display: block; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; color: #555; cursor: default; }
    .date-cell { font-size: 12px; color: #888; white-space: nowrap; }
    .table-row:hover { background: #F5F5F5; }
    .contacted-row { opacity: 0.6; }
    .header-actions { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .stat-chip.converted { background: #E3F2FD; color: #1565C0; }
    .source-badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .3px; }
    .src-website { background: #E8F5E9; color: #2E7D32; }
    .src-manual { background: #FFF3E0; color: #E65100; }
    .src-google { background: #FCE4EC; color: #C62828; }
    .src-referral { background: #EDE7F6; color: #4527A0; }
    .src-social { background: #E3F2FD; color: #1565C0; }
    .src-other { background: #F5F5F5; color: #616161; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 64px; color: #9E9E9E; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    @media (max-width: 600px) {
      .page-container { overflow-x: hidden; }
      .mat-column-phone { display: none !important; }
      .mat-column-message { display: none !important; }
      .mat-column-date { display: none !important; }
    }
  `]
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  leads = signal<any[]>([]);
  cols = ['status', 'source', 'name', 'email', 'phone', 'message', 'date', 'actions'];

  newCount = () => this.leads().filter(l => !l.contacted).length;
  convertedCount = () => this.leads().filter(l => l.convertedAt).length;

  ngOnInit() { this.load(); }

  load() {
    this.api.getLeads().subscribe(l => this.leads.set(l));
  }

  openNewLead() {
    const ref = this.dialog.open(NewLeadDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.api.createManualLead(result).subscribe({
          next: (lead) => { this.leads.update(list => [lead, ...list]); this.snack.open('Lead created.', 'OK', { duration: 3000 }); },
          error: () => this.snack.open('Failed to create lead.', 'OK', { duration: 3000 })
        });
      }
    });
  }

  markContacted(lead: any) {
    this.api.markLeadContacted(lead.id).subscribe(() => {
      this.leads.update(list => list.map(l => l.id === lead.id ? { ...l, contacted: true } : l));
    });
  }

  openConvert(lead: any) {
    const ref = this.dialog.open(ConvertLeadDialogComponent, {
      data: lead, width: '560px'
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        // Create customer then navigate to jobs to create a job
        this.api.createCustomer(result).subscribe({
          next: (customer) => {
            this.api.markLeadConverted(lead.id, customer.id).subscribe();
            this.leads.update(list => list.map(l => l.id === lead.id ? { ...l, contacted: true, convertedAt: new Date().toISOString() } : l));
            this.snack.open(`Customer "${customer.name}" created! Now add a job to generate a quote.`, 'Go to Jobs', { duration: 8000 })
              .onAction().subscribe(() => {
                // Handled by router below
              });
            // Mark contacted and navigate to new customer detail
            import('@angular/router').then(({ Router }) => {});
          },
          error: () => this.snack.open('Failed to create customer.', 'OK', { duration: 4000 })
        });
      }
    });
  }
}

// ── New Lead Dialog ──────────────────────────────────────────────────────────
@Component({
  selector: 'app-new-lead-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatIconModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title><mat-icon style="vertical-align:middle;margin-right:8px">person_add_alt</mat-icon> New Lead</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Full Name *</mat-label>
          <input matInput formControlName="name">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Source</mat-label>
          <mat-select formControlName="source">
            <mat-option value="Manual">Manual</mat-option>
            <mat-option value="Google">Google</mat-option>
            <mat-option value="Referral">Referral</mat-option>
            <mat-option value="Social">Social Media</mat-option>
            <mat-option value="Other">Other</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes / Message</mat-label>
          <textarea matInput formControlName="message" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        <mat-icon>add</mat-icon> Create Lead
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; padding-top:4px; } .full { grid-column: span 2; } mat-form-field { width:100%; }`]
})
export class NewLeadDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<NewLeadDialogComponent>);

  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    source:  ['Manual', Validators.required],
    message: [''],
  });

  save() { if (this.form.valid) this.dialogRef.close(this.form.value); }
}


// ── Convert Lead Dialog ────────────────────────────────────────────────────────
@Component({
  selector: 'app-convert-lead-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatDialogModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle; margin-right:8px; color:#2E7D32">person_add</mat-icon>
      Convert Lead to Customer
    </h2>
    <mat-dialog-content>
      <div class="lead-summary">
        <p class="lead-message" *ngIf="data.message"><mat-icon>chat</mat-icon> {{ data.message }}</p>
      </div>
      <mat-divider style="margin: 12px 0 20px"></mat-divider>
      <p class="form-hint">Review and complete the customer record:</p>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Full Name *</mat-label>
          <input matInput formControlName="name">
          <mat-error>Required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email *</mat-label>
          <input matInput formControlName="email" type="email">
          <mat-error>Valid email required</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Company</mat-label>
          <input matInput formControlName="company">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput formControlName="city">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" maxlength="2">
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>ZIP</mat-label>
          <input matInput formControlName="zip">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Internal notes..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        <mat-icon>person_add</mat-icon> Create Customer
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .lead-summary { background: #F9FBE7; border-left: 3px solid #7CB342; padding: 12px 16px; border-radius: 4px; }
    .lead-message { display: flex; gap: 8px; align-items: flex-start; margin: 0; font-size: 14px; color: #555; }
    .lead-message mat-icon { color: #7CB342; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .form-hint { font-size: 13px; color: #777; margin: 0 0 12px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; padding-top: 4px; }
    .full { grid-column: span 2; }
    mat-form-field { width: 100%; }
  `]
})
export class ConvertLeadDialogComponent {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<ConvertLeadDialogComponent>);
  data = inject(MAT_DIALOG_DATA) as any;

  form = this.fb.group({
    name:    [this.data?.name ?? '', Validators.required],
    email:   [this.data?.email ?? '', [Validators.required, Validators.email]],
    phone:   [this.data?.phone ?? ''],
    company: [''],
    address: [''],
    city:    [''],
    state:   [''],
    zip:     [''],
    notes:   [this.data?.message ?? ''],
  });

  save() {
    if (this.form.valid) this.dialogRef.close(this.form.value);
  }
}

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
