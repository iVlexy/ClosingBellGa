import { Component, OnInit, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-showings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatTooltipModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Showing Log</h1>
      <p class="page-sub">Track properties shown to each client</p>
    </div>
    <button mat-raised-button color="primary" (click)="openForm(null)">
      <mat-icon>add</mat-icon> Log Showing
    </button>
  </div>

  <div class="table-wrap" *ngIf="showings().length > 0">
    <table mat-table [dataSource]="showings()" class="mat-elevation-z2 full-width">
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Date</th>
        <td mat-cell *matCellDef="let s">{{s.showingDate | date:'MMM d, y'}}</td>
      </ng-container>
      <ng-container matColumnDef="client">
        <th mat-header-cell *matHeaderCellDef>Client</th>
        <td mat-cell *matCellDef="let s"><strong>{{s.clientName}}</strong></td>
      </ng-container>
      <ng-container matColumnDef="address">
        <th mat-header-cell *matHeaderCellDef>Property</th>
        <td mat-cell *matCellDef="let s">{{s.address}}</td>
      </ng-container>
      <ng-container matColumnDef="rating">
        <th mat-header-cell *matHeaderCellDef>Rating</th>
        <td mat-cell *matCellDef="let s">
          <span class="stars" *ngIf="s.feedbackRating">
            <span *ngFor="let i of [1,2,3,4,5]" [class.filled]="i <= s.feedbackRating">★</span>
          </span>
          <span *ngIf="!s.feedbackRating" class="muted">—</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="feedback">
        <th mat-header-cell *matHeaderCellDef>Feedback</th>
        <td mat-cell *matCellDef="let s">
          <span [matTooltip]="s.feedbackNotes" class="feedback-preview">{{s.feedbackNotes || '—'}}</span>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef></th>
        <td mat-cell *matCellDef="let s">
          <button mat-icon-button (click)="openForm(s)" matTooltip="Edit"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="delete(s)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="cols"></tr>
      <tr mat-row *matRowDef="let row; columns: cols;" class="table-row"></tr>
    </table>
  </div>
  <div class="empty-state" *ngIf="showings().length === 0">
    <mat-icon>home_search</mat-icon>
    <p>No showings logged yet.</p>
  </div>
</div>

<ng-template #formDialog>
  <h2 mat-dialog-title>{{editing ? 'Edit Showing' : 'Log Showing'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <mat-form-field appearance="outline" class="full">
      <mat-label>Client</mat-label>
      <mat-select formControlName="clientId">
        <mat-option *ngFor="let c of clients()" [value]="c.id">{{c.name}}</mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Property Address</mat-label>
      <input matInput formControlName="address">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>MLS Key (optional)</mat-label>
      <input matInput formControlName="listingKey">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Showing Date</mat-label>
      <input matInput type="date" formControlName="showingDate">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Client Rating (1–5)</mat-label>
      <mat-select formControlName="feedbackRating">
        <mat-option [value]="null">No rating</mat-option>
        <mat-option *ngFor="let r of [1,2,3,4,5]" [value]="r">{{r}} star{{r > 1 ? 's' : ''}}</mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Feedback Notes</mat-label>
      <textarea matInput formControlName="feedbackNotes" rows="3"></textarea>
    </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
  </mat-dialog-actions>
</ng-template>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-sub { color: #666; margin: 2px 0 0; }
    .table-wrap { overflow-x: auto; }
    .full-width { width: 100%; }
    .full { width: 100%; }
    .table-row:hover { background: rgba(0,0,0,.02); }
    .stars { color: #ccc; font-size: 16px; letter-spacing: 1px; }
    .stars .filled { color: #f59e0b; }
    .muted { color: #bbb; }
    .feedback-preview { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; font-size: 13px; color: #555; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-header button { align-self: stretch; }
      .cdk-column-feedback, .cdk-column-rating { display: none; }
      .form-row-2 { flex-direction: column; gap: 0; }
    }
  `]
})
export class ShowingsComponent implements OnInit {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  fb = inject(FormBuilder);

  showings = signal<any[]>([]);
  clients = signal<any[]>([]);
  cols = ['date','client','address','rating','feedback','actions'];
  editing: any = null;
  @ViewChild('formDialog') _dlgRef!: TemplateRef<any>;

  form = this.fb.group({
    clientId: ['', Validators.required],
    address: ['', Validators.required],
    listingKey: [''],
    showingDate: ['', Validators.required],
    feedbackRating: [null as number | null],
    feedbackNotes: [''],
  });

  ngOnInit() {
    this.load();
    this.api.getCustomers().subscribe(c => this.clients.set(c));
  }

  load() { this.api.getShowings().subscribe(s => this.showings.set(s)); }

  openForm(s: any) {
    this.editing = s;
    if (s) {
      this.form.patchValue({
        clientId: s.clientId, address: s.address, listingKey: s.listingKey ?? '',
        showingDate: s.showingDate?.substring(0,10) ?? '',
        feedbackRating: s.feedbackRating ?? null, feedbackNotes: s.feedbackNotes ?? '',
      });
    } else { this.form.reset(); }
    this.dialog.open(this._dlgRef!, { width: '95vw', maxWidth: '460px' });
  }

  save() {
    const v = this.form.value;
    const payload = { clientId: v.clientId!, address: v.address!, listingKey: v.listingKey || null,
      showingDate: new Date(v.showingDate!).toISOString(), feedbackRating: v.feedbackRating ?? null,
      feedbackNotes: v.feedbackNotes || null };
    const obs = this.editing ? this.api.updateShowing(this.editing.id, payload) : this.api.createShowing(payload);
    obs.subscribe({ next: () => { this.load(); this.dialog.closeAll(); this.snack.open('Saved', 'OK', { duration: 2000 }); }, error: () => this.snack.open('Error', 'OK', { duration: 2000 }) });
  }

  delete(s: any) {
    if (!confirm('Delete this showing?')) return;
    this.api.deleteShowing(s.id).subscribe(() => this.load());
  }
}
