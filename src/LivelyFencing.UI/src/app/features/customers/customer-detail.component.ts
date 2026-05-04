import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTabsModule, MatButtonModule, MatIconModule, MatCardModule, MatTableModule, MatChipsModule],
  template: `
    <div class="page-container" *ngIf="customer()">
      <div class="page-header">
        <div>
          <a mat-button routerLink="/cq/customers"><mat-icon>arrow_back</mat-icon> Customers</a>
          <h1 class="page-title">{{ customer().name }}</h1>
          <p class="page-subtitle" *ngIf="customer().company">{{ customer().company }}</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/cq/jobs" [queryParams]="{customerId: customer().id}">
          <mat-icon>add</mat-icon> New Job
        </a>
      </div>

      <div class="info-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Contact Info</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><mat-icon class="inline-icon">email</mat-icon> {{ customer().email }}</p>
            <p *ngIf="customer().phone"><mat-icon class="inline-icon">phone</mat-icon> {{ customer().phone }}</p>
            <p *ngIf="customer().billingAddress"><mat-icon class="inline-icon">location_on</mat-icon> {{ customer().billingAddress }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <mat-tab label="Jobs ({{ customer().jobs?.length || 0 }})">
          <table mat-table [dataSource]="customer().jobs || []" class="full-width">
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Job</th>
              <td mat-cell *matCellDef="let j">{{ j.title }}</td>
            </ng-container>
            <ng-container matColumnDef="fencingType">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let j">{{ j.fencingType }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let j"><mat-chip>{{ j.status }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let j"><a mat-icon-button [routerLink]="['/cq/jobs', j.id]"><mat-icon>open_in_new</mat-icon></a></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="jobColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: jobColumns;"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Quotes ({{ customer().quotes?.length || 0 }})">
          <table mat-table [dataSource]="customer().quotes || []" class="full-width">
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let q"><mat-chip>{{ q.status }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let q">{{ q.totalAmount | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let q">{{ q.createdAt | date }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let q"><a mat-icon-button [routerLink]="['/cq/quotes', q.id]"><mat-icon>open_in_new</mat-icon></a></td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="quoteColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: quoteColumns;"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1B5E20; margin: 4px 0 0; }
    .page-subtitle { color: #666; margin: 2px 0 0; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .inline-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; color: #555; }
    .full-width { width: 100%; }
  `]
})
export class CustomerDetailComponent implements OnInit {
  api = inject(ApiService);
  route = inject(ActivatedRoute);
  customer = signal<any>(null);
  jobColumns = ['title', 'fencingType', 'status', 'actions'];
  quoteColumns = ['status', 'total', 'created', 'actions'];

  ngOnInit() {
    this.api.getCustomer(this.route.snapshot.params['id']).subscribe(c => this.customer.set(c));
  }
}
