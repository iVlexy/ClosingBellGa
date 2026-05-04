import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, MatChipsModule, MatTableModule, MatSelectModule, MatFormFieldModule],
  template: `
    <div class="page-container" *ngIf="job()">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ job().title }}</h1>
          <p class="subtitle">{{ job().customer?.name }}</p>
        </div>
        <div class="header-actions">
          <mat-form-field appearance="outline" style="width:160px" *ngIf="auth.isAdmin()">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="newStatus" (ngModelChange)="updateStatus($event)">
              <mat-option value="Active">Active</mat-option>
              <mat-option value="Completed">Completed</mat-option>
              <mat-option value="Cancelled">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>
          <a mat-flat-button color="primary" [routerLink]="['/cq/quotes']" [queryParams]="{generateJobId: job().id}">
            <mat-icon>auto_awesome</mat-icon> Generate AI Quote
          </a>
        </div>
      </div>
      <mat-tab-group>
        <mat-tab label="Details">
          <div class="tab-content">
            <mat-card><mat-card-content>
              <div class="detail-grid">
                <div><label>Fencing Type</label><p>{{ job().fencingType }}</p></div>
                <div><label>Linear Feet</label><p>{{ job().linearFeet ?? '—' }}</p></div>
                <div><label>Gate Count</label><p>{{ job().gateCount ?? '—' }}</p></div>
                <div><label>Status</label><p><mat-chip>{{ job().status }}</mat-chip></p></div>
                <div><label>Created</label><p>{{ job().createdAt | date }}</p></div>
                <div><label>Completed</label><p>{{ job().completedAt ? (job().completedAt | date) : '—' }}</p></div>
              </div>
              <div *ngIf="job().notes" style="margin-top:16px"><label>Notes</label><p>{{ job().notes }}</p></div>
              <div *ngIf="job().siteAddress" style="margin-top:8px"><label>Site Address</label><p>{{ job().siteAddress }}</p></div>
            </mat-card-content></mat-card>
          </div>
        </mat-tab>
        <mat-tab label="Quotes ({{ job().quotes?.length || 0 }})">
          <div class="tab-content">
            <table mat-table [dataSource]="job().quotes || []" class="mat-elevation-z1 full-width">
              <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let q"><mat-chip>{{ q.status }}</mat-chip></td></ng-container>
              <ng-container matColumnDef="total"><th mat-header-cell *matHeaderCellDef>Total</th><td mat-cell *matCellDef="let q">{{ q.totalAmount | currency }}</td></ng-container>
              <ng-container matColumnDef="created"><th mat-header-cell *matHeaderCellDef>Created</th><td mat-cell *matCellDef="let q">{{ q.createdAt | date }}</td></ng-container>
              <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let q"><a mat-icon-button [routerLink]="['/cq/quotes', q.id]"><mat-icon>open_in_new</mat-icon></a></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="quoteCols"></tr>
              <tr mat-row *matRowDef="let row; columns: quoteCols;"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`.page-container{padding:24px} .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px} .page-title{font-size:24px;font-weight:500;color:#1B5E20;margin:0 0 4px} .subtitle{color:#666;margin:0} .header-actions{display:flex;gap:12px;align-items:center} .tab-content{padding:16px 0} .detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px} label{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px} p{margin:4px 0 0;font-size:14px} .full-width{width:100%}`]
})
export class JobDetailComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  job = signal<any>(null);
  newStatus = '';
  quoteCols = ['status', 'total', 'created', 'actions'];
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.api.getJob(id!).subscribe(j => { this.job.set(j); this.newStatus = j.status; });
  }
  updateStatus(status: string) {
    this.api.updateJobStatus(this.job().id, status).subscribe(j => this.job.set(j));
  }
}
