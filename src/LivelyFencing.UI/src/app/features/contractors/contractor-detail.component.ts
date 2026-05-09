import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contractor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, MatTableModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container" *ngIf="contractor()">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ contractor().name }}</h1>
          <p class="subtitle">Contractor</p>
        </div>
        <div class="header-actions">
        </div>
      </div>
      <mat-tab-group>
        <mat-tab label="Details">
          <div class="tab-content"><mat-card><mat-card-content>
            <div class="detail-grid">
              <div><label>Tax ID</label><p>{{ contractor().maskedTaxId }}</p></div>
              <div><label>Tax ID Type</label><p>{{ contractor().taxIdType }}</p></div>
              <div><label>Phone</label><p>{{ contractor().phone || '—' }}</p></div>
              <div><label>Email</label><p>{{ contractor().email || '—' }}</p></div>
              <div><label>Address</label><p>{{ contractor().address || '—' }}</p></div>
              <div><label>Active</label><p>{{ contractor().isActive ? 'Yes' : 'No' }}</p></div>
            </div>
            <div *ngIf="contractor().notes" style="margin-top:16px"><label>Notes</label><p>{{ contractor().notes }}</p></div>
          </mat-card-content></mat-card></div>
        </mat-tab>
        <mat-tab label="Payments ({{ payments().length }})">
          <div class="tab-content">
            <div class="add-payment" *ngIf="auth.isAdmin()">
              <mat-form-field appearance="outline"><mat-label>Job ID</mat-label><input matInput [(ngModel)]="newPayment.jobId" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Amount ($)</mat-label><input matInput type="number" [(ngModel)]="newPayment.amount" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="newPayment.description" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Paid Date</mat-label><input matInput type="date" [(ngModel)]="newPayment.paymentDate" /></mat-form-field>
              <button mat-flat-button color="primary" (click)="addPayment()"><mat-icon>add</mat-icon> Add Payment</button>
            </div>
            <table mat-table [dataSource]="payments()" class="mat-elevation-z1 full-width">
              <ng-container matColumnDef="paymentDate"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let p">{{ p.paymentDate | date }}</td></ng-container>
              <ng-container matColumnDef="amount"><th mat-header-cell *matHeaderCellDef>Amount</th><td mat-cell *matCellDef="let p">{{ p.amount | currency }}</td></ng-container>
              <ng-container matColumnDef="description"><th mat-header-cell *matHeaderCellDef>Description</th><td mat-cell *matCellDef="let p">{{ p.description }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="paymentCols"></tr>
              <tr mat-row *matRowDef="let row; columns: paymentCols;"></tr>
            </table>
            <p *ngIf="payments().length === 0" class="empty-state">No payments recorded.</p>
            <div class="total-row" *ngIf="payments().length > 0">
              <strong>YTD Total: {{ ytdTotal() | currency }}</strong>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`.page-container{padding:24px} .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px} .page-title{font-size:24px;font-weight:500;color:#1B5E20;margin:0 0 4px} .subtitle{color:#666;margin:0} .header-actions{display:flex;gap:8px;align-items:center} .tab-content{padding:16px 0} .detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px} label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px} p{margin:4px 0 0;font-size:14px} .full-width{width:100%} .add-payment{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap} .empty-state{color:#888;font-style:italic;padding:16px 0} .total-row{text-align:right;padding:12px 0;border-top:1px solid #e0e0e0;margin-top:8px}`]
})
export class ContractorDetailComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  contractor = signal<any>(null);
  payments = signal<any[]>([]);
  currentYear = new Date().getFullYear();
  paymentCols = ['paymentDate', 'amount', 'description'];
  newPayment: any = { jobId: null, amount: 0, description: '', paymentDate: '' };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getContractor(id).subscribe(c => this.contractor.set(c));
    this.api.getContractorPayments(id).subscribe(p => this.payments.set(p));
  }

  ytdTotal() {
    const yr = this.currentYear;
    return this.payments().filter(p => new Date(p.paymentDate).getFullYear() === yr).reduce((s, p) => s + p.amount, 0);
  }

  addPayment() {
    const id = this.contractor().id;
    this.api.addPayment(id, this.newPayment).subscribe((p: any) => {
      this.payments.update(list => [...list, p]);
      this.newPayment = { jobId: null, amount: 0, description: '', paymentDate: '' };
    });
  }
}
