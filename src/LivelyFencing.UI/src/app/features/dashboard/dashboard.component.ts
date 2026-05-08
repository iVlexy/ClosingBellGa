import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back, {{ auth.currentUser?.name }}</p>

      <div class="stats-grid" *ngIf="!loading; else spinner">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon clients"><mat-icon>people</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.clients }}</div>
              <div class="stat-label">Active Clients</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/customers">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon new-leads"><mat-icon>fiber_new</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.newLeads }}</div>
              <div class="stat-label">New Leads</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon total-leads"><mat-icon>record_voice_over</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalLeads }}</div>
              <div class="stat-label">Total Leads</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon converted"><mat-icon>how_to_reg</mat-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.converted }}</div>
              <div class="stat-label">Converted</div>
            </div>
          </mat-card-content>
          <mat-card-actions><a mat-button routerLink="/cq/leads">View All</a></mat-card-actions>
        </mat-card>
      </div>

      <ng-template #spinner>
        <div class="spinner-center"><mat-spinner /></div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-subtitle { color: #666; margin: 4px 0 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .stat-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { color: white; }
    .stat-icon.clients { background: #1A3A2A; }
    .stat-icon.new-leads { background: #E65100; }
    .stat-icon.total-leads { background: #1565C0; }
    .stat-icon.converted { background: #2E7D32; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 12px; color: #666; }
    .spinner-center { display: flex; justify-content: center; padding: 60px; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  loading = true;
  stats = { clients: 0, newLeads: 0, totalLeads: 0, converted: 0 };

  ngOnInit() {
    forkJoin({
      customers: this.api.getCustomers(),
      leads: this.api.getLeads()
    }).subscribe({
      next: (data) => {
        this.stats.clients = data.customers.length;
        this.stats.totalLeads = data.leads.length;
        this.stats.newLeads = data.leads.filter((l: any) => !l.contacted).length;
        this.stats.converted = data.leads.filter((l: any) => l.convertedAt).length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
