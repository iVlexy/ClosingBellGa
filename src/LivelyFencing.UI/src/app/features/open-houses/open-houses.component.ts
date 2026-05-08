import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-open-houses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatTableModule,
    MatChipsModule, MatSnackBarModule, MatTooltipModule, MatExpansionModule, MatCheckboxModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Open Houses</h1>
      <p class="page-sub">Capture attendee info from open house events</p>
    </div>
    <button mat-raised-button color="primary" (click)="openForm(null, null)">
      <mat-icon>add</mat-icon> Add Attendee
    </button>
  </div>

  <mat-accordion multi>
    <mat-expansion-panel *ngFor="let event of events()" [expanded]="true">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon style="margin-right:8px;color:#1A3A2A">home</mat-icon>
          {{event.address}}
        </mat-panel-title>
        <mat-panel-description>
          {{event.date | date:'EEEE, MMM d, y'}} &nbsp;&bull;&nbsp;
          {{event.attendees.length}} attendee{{event.attendees.length !== 1 ? 's' : ''}}
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="attendee-actions">
        <button mat-stroked-button (click)="openForm(event.address, event.date)">
          <mat-icon>person_add</mat-icon> Add Attendee to This Event
        </button>
      </div>

      <table mat-table [dataSource]="event.attendees" class="attendee-table">
        <ng-container matColumnDef="approved">
          <th mat-header-cell *matHeaderCellDef>Pre-Approved</th>
          <td mat-cell *matCellDef="let a">
            <mat-icon [style.color]="a.isPreApproved ? '#2E7D32' : '#bbb'">
              {{a.isPreApproved ? 'verified' : 'remove_circle_outline'}}
            </mat-icon>
          </td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let a"><strong>{{a.name}}</strong></td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Phone</th>
          <td mat-cell *matCellDef="let a">
            <a *ngIf="a.phone" [href]="'tel:' + a.phone">{{a.phone}}</a>
            <span *ngIf="!a.phone" class="muted">—</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let a">
            <a *ngIf="a.email" [href]="'mailto:' + a.email">{{a.email}}</a>
            <span *ngIf="!a.email" class="muted">—</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="notes">
          <th mat-header-cell *matHeaderCellDef>Notes</th>
          <td mat-cell *matCellDef="let a">
            <span [matTooltip]="a.agentNotes" class="note-preview">{{a.agentNotes || '—'}}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let a">
            <button mat-icon-button (click)="openEdit(a)" matTooltip="Edit"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="delete(a)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let r; columns: cols;"></tr>
      </table>
    </mat-expansion-panel>
  </mat-accordion>

  <div class="empty-state" *ngIf="events().length === 0">
    <mat-icon>meeting_room</mat-icon>
    <p>No open house data yet. Add your first attendee above.</p>
  </div>
</div>

<ng-template #formDialog>
  <h2 mat-dialog-title>{{editing ? 'Edit Attendee' : 'Add Attendee'}}</h2>
  <mat-dialog-content [formGroup]="form" style="min-width:440px">
    <mat-form-field appearance="outline" class="full">
      <mat-label>Property Address</mat-label>
      <input matInput formControlName="address">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Event Date</mat-label>
      <input matInput type="date" formControlName="eventDate">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Attendee Name</mat-label>
      <input matInput formControlName="name">
    </mat-form-field>
    <div class="form-row-2">
      <mat-form-field appearance="outline">
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phone">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email">
      </mat-form-field>
    </div>
    <div class="checkbox-row">
      <mat-checkbox formControlName="isPreApproved">Pre-approved buyer</mat-checkbox>
    </div>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Agent Notes</mat-label>
      <textarea matInput formControlName="agentNotes" rows="2"></textarea>
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
    .attendee-table { width: 100%; }
    .attendee-actions { margin-bottom: 12px; }
    .muted { color: #bbb; }
    .note-preview { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; font-size: 13px; }
    .form-row-2 { display: flex; gap: 12px; }
    .form-row-2 mat-form-field { flex: 1; }
    .full { width: 100%; }
    .checkbox-row { margin: 4px 0 12px; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    a { color: #1A3A2A; }
  `]
})
export class OpenHousesComponent implements OnInit {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  fb = inject(FormBuilder);

  attendees = signal<any[]>([]);
  cols = ['approved','name','phone','email','notes','actions'];
  editing: any = null;
  private _dlgRef: any;

  events = computed(() => {
    const map = new Map<string, { address: string; date: string; attendees: any[] }>();
    for (const a of this.attendees()) {
      const key = `${a.address}__${a.eventDate?.substring(0,10)}`;
      if (!map.has(key)) map.set(key, { address: a.address, date: a.eventDate, attendees: [] });
      map.get(key)!.attendees.push(a);
    }
    return Array.from(map.values()).sort((a,b) => b.date.localeCompare(a.date));
  });

  form = this.fb.group({
    address: ['', Validators.required],
    listingKey: [''],
    eventDate: ['', Validators.required],
    name: ['', Validators.required],
    phone: [''],
    email: [''],
    isPreApproved: [false],
    agentNotes: [''],
  });

  ngOnInit() { this.load(); }
  load() { this.api.getOpenHouses().subscribe(a => this.attendees.set(a)); }

  openForm(address: string | null, date: string | null) {
    this.editing = null;
    this.form.reset({ address: address ?? '', eventDate: date ? new Date(date).toISOString().substring(0,10) : '', isPreApproved: false });
    this.dialog.open(this._dlgRef!, { width: '480px' });
  }

  openEdit(a: any) {
    this.editing = a;
    this.form.patchValue({ address: a.address, listingKey: a.listingKey ?? '',
      eventDate: a.eventDate?.substring(0,10) ?? '', name: a.name,
      phone: a.phone ?? '', email: a.email ?? '',
      isPreApproved: a.isPreApproved, agentNotes: a.agentNotes ?? '' });
    this.dialog.open(this._dlgRef!, { width: '480px' });
  }

  save() {
    const v = this.form.value;
    const payload = { address: v.address!, listingKey: v.listingKey || null,
      eventDate: new Date(v.eventDate!).toISOString(), name: v.name!,
      phone: v.phone || null, email: v.email || null,
      isPreApproved: v.isPreApproved ?? false, agentNotes: v.agentNotes || null };
    const obs = this.editing ? this.api.updateOpenHouseAttendee(this.editing.id, payload) : this.api.createOpenHouseAttendee(payload);
    obs.subscribe({ next: () => { this.load(); this.dialog.closeAll(); this.snack.open('Saved', 'OK', { duration: 2000 }); }, error: () => this.snack.open('Error', 'OK', { duration: 2000 }) });
  }

  delete(a: any) {
    if (!confirm(`Remove ${a.name}?`)) return;
    this.api.deleteOpenHouseAttendee(a.id).subscribe(() => this.load());
  }
}
