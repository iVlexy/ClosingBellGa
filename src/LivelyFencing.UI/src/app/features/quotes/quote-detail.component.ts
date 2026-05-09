import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '../../core/services/api.service';
import { ExpenseDialogComponent } from '../expenses/expense-dialog.component';
import { RejectDialogComponent } from '../../shared/dialogs.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule, MatTableModule, MatChipsModule, MatProgressBarModule, MatSnackBarModule, MatDividerModule, FormsModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatTooltipModule, MatDialogModule],
  template: `
    <div class="page-container" *ngIf="quote()">
      <div class="page-header">
        <div>
          <a mat-button routerLink="/cq/quotes"><mat-icon>arrow_back</mat-icon> Quotes</a>
          <h1 class="page-title">Quote #{{ quote().id.substring(0,8).toUpperCase() }}</h1>
          <mat-chip [class]="'status-chip status-' + quote().status.toLowerCase()">{{ quote().status }}</mat-chip>
          <mat-chip *ngIf="quote().aiGenerated" class="ai-chip"><mat-icon>smart_toy</mat-icon> AI Generated</mat-chip>
        </div>
        <div class="actions">
          <button mat-stroked-button (click)="downloadPdf()"><mat-icon>picture_as_pdf</mat-icon> Download PDF</button>
          <button mat-raised-button color="primary" *ngIf="quote().status === 'PendingApproval' && auth.isAdmin()" (click)="approve()" [disabled]="working">
            <mat-icon>check_circle</mat-icon> Approve
          </button>
          <button mat-raised-button color="warn" *ngIf="quote().status === 'PendingApproval' && auth.isAdmin()" (click)="reject()" [disabled]="working">
            <mat-icon>cancel</mat-icon> Reject
          </button>

          <button mat-stroked-button *ngIf="canEdit() && !editing" (click)="startEdit()" [disabled]="working">
            <mat-icon>edit</mat-icon> Edit Quote
          </button>
          <button mat-raised-button color="primary" *ngIf="editing" (click)="saveQuote()" [disabled]="working">
            <mat-icon>save</mat-icon> Save
          </button>
          <button mat-stroked-button *ngIf="editing" (click)="cancelEdit()" [disabled]="working">
            Cancel
          </button>
          <button mat-raised-button color="accent" *ngIf="quote().status === 'Rejected' && auth.isAdmin() && !editing" (click)="reopenAndEdit()" [disabled]="working">
            <mat-icon>restart_alt</mat-icon> Reopen &amp; Edit
          </button>
        </div>
      </div>

      <mat-progress-bar *ngIf="working" mode="indeterminate"></mat-progress-bar>

      <div class="info-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Customer</mat-card-title></mat-card-header>
          <mat-card-content>
            <p>{{ quote().customer?.name }}</p>
            <p>{{ quote().customer?.email }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Job</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><strong>{{ quote().job?.title }}</strong></p>
            <p>{{ quote().job?.fencingType }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Details</mat-card-title></mat-card-header>
          <mat-card-content>
            <ng-container *ngIf="!editing">
              <p>Valid Until: {{ quote().validUntil | date:'mediumDate' }}</p>
              <p *ngIf="quote().sentAt">Sent: {{ quote().sentAt | date:'medium' }}</p>
              <p *ngIf="quote().acceptedAt">Accepted: {{ quote().acceptedAt | date:'medium' }}</p>
            </ng-container>
            <mat-form-field *ngIf="editing" appearance="outline" style="width:100%;margin-top:8px">
              <mat-label>Valid Until</mat-label>
              <input matInput type="date" [(ngModel)]="editValidUntil">
            </mat-form-field>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="notes-card">
        <mat-card-header><mat-card-title>Notes</mat-card-title></mat-card-header>
        <mat-card-content>
          <ng-container *ngIf="!editing">
            <p *ngIf="quote().adminNotes">{{ quote().adminNotes }}</p>
            <p *ngIf="!quote().adminNotes" class="empty-notes">No notes</p>
          </ng-container>
          <mat-form-field *ngIf="editing" appearance="outline" style="width:100%">
            <mat-label>Admin Notes</mat-label>
            <textarea matInput [(ngModel)]="editAdminNotes" rows="3" placeholder="Internal notes..."></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <mat-card class="line-items-card">
        <mat-card-header><mat-card-title>Line Items</mat-card-title></mat-card-header>
        <mat-card-content>

          <!-- READ-ONLY VIEW -->
          <ng-container *ngIf="!editing">
            <table mat-table [dataSource]="quote().lineItems || []" class="full-width">
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let li">{{ li.category }}</td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let li">{{ li.description }}</td>
              </ng-container>
              <ng-container matColumnDef="qty">
                <th mat-header-cell *matHeaderCellDef class="num-col">Qty</th>
                <td mat-cell *matCellDef="let li" class="num-col">{{ li.quantity }}</td>
              </ng-container>
              <ng-container matColumnDef="unit">
                <th mat-header-cell *matHeaderCellDef class="num-col">Unit Price</th>
                <td mat-cell *matCellDef="let li" class="num-col">{{ li.unitPrice | currency }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef class="num-col">Total</th>
                <td mat-cell *matCellDef="let li" class="num-col"><strong>{{ li.quantity * li.unitPrice | currency }}</strong></td>
              </ng-container>
              <ng-container matColumnDef="expense">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let li">
                  <button mat-icon-button matTooltip="Create Expense" (click)="createExpenseFromLineItem(li)" style="color:#1B5E20">
                    <mat-icon>receipt_long</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineItemColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineItemColumns;"></tr>
            </table>
            <div class="total-row">
              <span>TOTAL</span>
              <span class="total-amount">{{ quote().totalAmount | currency }}</span>
            </div>
          </ng-container>

          <!-- EDIT MODE -->
          <ng-container *ngIf="editing">
            <table class="edit-table full-width">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th class="num-col">Qty</th>
                  <th class="num-col">Unit Price</th>
                  <th class="num-col">Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let li of editItems; let i = index">
                  <td>
                    <mat-form-field appearance="outline" class="edit-field-sm">
                      <mat-select [(ngModel)]="li.category">
                        <mat-option *ngFor="let c of categories" [value]="c">{{ c }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </td>
                  <td>
                    <mat-form-field appearance="outline" class="edit-field-lg">
                      <input matInput [(ngModel)]="li.description" placeholder="Description">
                    </mat-form-field>
                  </td>
                  <td class="num-col">
                    <mat-form-field appearance="outline" class="edit-field-xs">
                      <input matInput type="number" [(ngModel)]="li.quantity" min="0">
                    </mat-form-field>
                  </td>
                  <td class="num-col">
                    <mat-form-field appearance="outline" class="edit-field-sm">
                      <span matTextPrefix>$&nbsp;</span>
                      <input matInput type="number" [(ngModel)]="li.unitPrice" min="0" step="0.01">
                    </mat-form-field>
                  </td>
                  <td class="num-col">{{ (li.quantity || 0) * (li.unitPrice || 0) | currency }}</td>
                  <td>
                    <button mat-icon-button color="warn" (click)="removeItem(i)" type="button">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="edit-actions">
              <button mat-stroked-button (click)="addItem()" type="button">
                <mat-icon>add</mat-icon> Add Line Item
              </button>
              <div class="total-row">
                <span>TOTAL</span>
                <span class="total-amount">{{ editTotal() | currency }}</span>
              </div>
            </div>
          </ng-container>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 4px 0; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .ai-chip { background: #E1BEE7 !important; }
    .line-items-card, .notes-card { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .num-col { text-align: right; }
    .total-row { display: flex; justify-content: flex-end; gap: 32px; padding: 16px 0 8px; font-size: 18px; font-weight: bold; border-top: 1px solid #eee; margin-top: 8px; }
    .total-amount { color: #2E7D32; font-size: 22px; }
    .edit-table { width: 100%; border-collapse: collapse; }
    .edit-table th { text-align: left; padding: 4px 8px; font-size: 12px; color: #616161; font-weight: 500; }
    .edit-table td { padding: 2px 4px; vertical-align: middle; }
    .edit-field-xs { width: 70px; }
    .edit-field-sm { width: 130px; }
    .edit-field-lg { width: 100%; min-width: 180px; }
    .edit-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .empty-notes { color: #9e9e9e; font-style: italic; }
    ::ng-deep .edit-table .mat-mdc-form-field-subscript-wrapper { display: none; }
    ::ng-deep .edit-table .mat-mdc-text-field-wrapper { padding: 0 4px; }
  `]
})
export class QuoteDetailComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  quote = signal<any>(null);
  working = false;
  lineItemColumns = ['category', 'description', 'qty', 'unit', 'total', 'expense'];
  editing = false;
  editItems: any[] = [];
  editValidUntil = '';
  editAdminNotes = '';
  categories = ['Material', 'Labour', 'Equipment', 'Permit', 'Disposal', 'Other'];

  ngOnInit() { this.loadQuote(); }

  loadQuote() {
    this.api.getQuote(this.route.snapshot.params['id']).subscribe(q => this.quote.set(q));
  }

  approve() {
    this.working = true;
    this.api.approveQuote(this.quote().id).subscribe({
      next: () => { this.loadQuote(); this.working = false; this.snackBar.open('Quote approved', 'OK', { duration: 3000 }); },
      error: () => this.working = false
    });
  }

  reject() {
    this.dialog.open(RejectDialogComponent, {
      data: { title: 'Reject Quote', placeholder: 'Reason for rejection', required: true, confirmLabel: 'Reject' },
      width: '420px'
    }).afterClosed().subscribe(reason => {
      if (!reason) return;
      this.working = true;
      this.api.rejectQuote(this.quote().id, reason).subscribe({
        next: () => { this.loadQuote(); this.working = false; this.snackBar.open('Quote rejected', 'OK', { duration: 3000 }); },
        error: () => this.working = false
      });
    });
  }

  canEdit() {
    const s = this.quote()?.status;
    return (s === 'Draft' || s === 'PendingApproval') && this.auth.hasRole('Admin', 'Sales');
  }

  startEdit() {
    const q = this.quote();
    this.editItems = (q.lineItems || []).map((li: any) => ({ ...li }));
    if (this.editItems.length === 0) this.addItem();
    this.editValidUntil = q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : '';
    this.editAdminNotes = q.adminNotes || '';
    this.editing = true;
  }

  addItem() {
    this.editItems.push({ category: 'Material', description: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(i: number) {
    this.editItems.splice(i, 1);
  }

  editTotal(): number {
    return this.editItems.reduce((s: number, li: any) => s + (li.quantity || 0) * (li.unitPrice || 0), 0);
  }

  saveQuote() {
    this.working = true;
    const id = this.quote().id;
    const lineItems = this.editItems.map((li: any) => ({
      category: li.category,
      description: li.description,
      quantity: +li.quantity,
      unitPrice: +li.unitPrice
    }));
    this.api.updateQuote(id, { validUntil: this.editValidUntil || null, adminNotes: this.editAdminNotes || null })
      .pipe(switchMap(() => this.api.updateLineItems(id, lineItems)))
      .subscribe({
      next: () => {
        this.loadQuote();
        this.editing = false;
        this.working = false;
        this.snackBar.open('Quote saved', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.working = false;
        const msg = err?.error?.message || err?.error || `HTTP ${err?.status}`;
        this.snackBar.open(`Save failed: ${msg}`, 'OK', { duration: 6000 });
      }
    });
  }

  cancelEdit() { this.editing = false; }

  reopenAndEdit() {
    this.working = true;
    this.api.reopenQuote(this.quote().id).subscribe({
      next: () => {
        this.loadQuote();
        this.working = false;
        setTimeout(() => this.startEdit(), 400);
        this.snackBar.open('Quote reopened — edit and re-send when ready', 'OK', { duration: 4000 });
      },
      error: () => { this.working = false; this.snackBar.open('Failed to reopen quote', 'OK', { duration: 3000 }); }
    });
  }

  createExpenseFromLineItem(li: any) {
    const catMap: any = { Material: 'Supplies', Labour: 'Other', Equipment: 'Equipment', Permit: 'Other', Disposal: 'Other', Other: 'Other' };
    this.dialog.open(ExpenseDialogComponent, {
      width: '560px',
      data: {
        description: li.description,
        amount: +(li.quantity * li.unitPrice).toFixed(2),
        category: catMap[li.category] || 'Other',
        vendor: '',
        notes: `From quote #${this.quote().id.substring(0, 8).toUpperCase()} — ${li.category}: ${li.description}`,
        date: new Date(),
        jobId: this.quote().job?.id
      }
    }).afterClosed().subscribe(saved => {
      if (saved) this.snackBar.open('Expense created', 'View Expenses', { duration: 4000 });
    });
  }

  downloadPdf() {
    this.api.downloadQuotePdf(this.quote().id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `Quote-${this.quote().id.substring(0,8).toUpperCase()}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    });
  }
}
