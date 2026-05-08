import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTableModule,
    MatCardModule, MatSelectModule, MatFormFieldModule, MatProgressBarModule, MatDividerModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Analytics</h1>
      <p class="page-sub">Pipeline funnel, lead source attribution, and GCI tracking</p>
    </div>
    <mat-form-field appearance="outline" style="width:100px">
      <mat-label>Year</mat-label>
      <mat-select [(ngModel)]="year" (ngModelChange)="loadAll()">
        <mat-option *ngFor="let y of years" [value]="y">{{y}}</mat-option>
      </mat-select>
    </mat-form-field>
  </div>

  <!-- GCI Summary Cards -->
  <div class="metric-cards" *ngIf="gci()">
    <mat-card class="metric-card">
      <div class="metric-value">{{gci().totalClosings}}</div>
      <div class="metric-label">Closings {{year}}</div>
    </mat-card>
    <mat-card class="metric-card">
      <div class="metric-value">{{gci().totalVolume | currency:'USD':'symbol':'1.0-0'}}</div>
      <div class="metric-label">Total Volume</div>
    </mat-card>
    <mat-card class="metric-card highlight">
      <div class="metric-value">{{gci().totalGCI | currency:'USD':'symbol':'1.0-0'}}</div>
      <div class="metric-label">Gross Commission Income</div>
    </mat-card>
  </div>

  <!-- GCI by Month -->
  <div *ngIf="gci()?.byMonth?.length > 0" style="margin-bottom: 32px">
    <h2 class="section-heading">Commission by Month</h2>
    <div class="month-bars">
      <div class="month-bar-wrap" *ngFor="let m of gci().byMonth">
        <div class="month-bar-outer">
          <div class="month-bar-fill" [style.height.%]="barPct(m.totalCommission)"></div>
        </div>
        <div class="month-label">{{monthName(m.month)}}</div>
        <div class="month-value">{{m.totalCommission | currency:'USD':'symbol':'1.0-0'}}</div>
        <div class="month-count">{{m.closedCount}} closed</div>
      </div>
    </div>
  </div>

  <mat-divider style="margin-bottom:32px"></mat-divider>

  <!-- Pipeline Funnel -->
  <h2 class="section-heading">Lead Source → Pipeline Funnel</h2>
  <p class="section-sub">See how far leads from each source progress through the buying/selling process.</p>

  <div class="funnel-wrap" *ngIf="funnel().length > 0">
    <table class="funnel-table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Leads</th>
          <th>→ Clients</th>
          <th>→ Showings</th>
          <th>→ Offer</th>
          <th>→ Closed</th>
          <th>Close Rate</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of funnel()">
          <td><span class="source-pill">{{row.source}}</span></td>
          <td class="num">{{row.totalLeads}}</td>
          <td>
            <div class="funnel-cell">
              <span class="num">{{row.convertedToClient}}</span>
              <div class="funnel-bar"><div [style.width.%]="pct(row.convertedToClient, row.totalLeads)" class="bar-fill c1"></div></div>
              <span class="pct-label">{{pct(row.convertedToClient, row.totalLeads)}}%</span>
            </div>
          </td>
          <td>
            <div class="funnel-cell">
              <span class="num">{{row.hadShowing}}</span>
              <div class="funnel-bar"><div [style.width.%]="pct(row.hadShowing, row.totalLeads)" class="bar-fill c2"></div></div>
              <span class="pct-label">{{pct(row.hadShowing, row.totalLeads)}}%</span>
            </div>
          </td>
          <td>
            <div class="funnel-cell">
              <span class="num">{{row.submittedOffer}}</span>
              <div class="funnel-bar"><div [style.width.%]="pct(row.submittedOffer, row.totalLeads)" class="bar-fill c3"></div></div>
              <span class="pct-label">{{pct(row.submittedOffer, row.totalLeads)}}%</span>
            </div>
          </td>
          <td>
            <div class="funnel-cell">
              <span class="num">{{row.closed}}</span>
              <div class="funnel-bar"><div [style.width.%]="pct(row.closed, row.totalLeads)" class="bar-fill c4"></div></div>
              <span class="pct-label">{{pct(row.closed, row.totalLeads)}}%</span>
            </div>
          </td>
          <td class="num close-rate">
            {{pct(row.closed, row.totalLeads)}}%
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="empty-state" *ngIf="funnel().length === 0 && !loading()">
    <mat-icon>analytics</mat-icon>
    <p>No lead data yet to analyze. Data populates as leads come in and convert.</p>
  </div>
</div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-sub { color: #666; margin: 2px 0 0; }
    .section-heading { font-size: 18px; font-weight: 600; color: #1A3A2A; margin: 0 0 4px; }
    .section-sub { color: #666; font-size: 13px; margin: 0 0 16px; }
    .metric-cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
    .metric-card { flex: 1; min-width: 160px; padding: 20px 24px; text-align: center; }
    .metric-card.highlight { background: linear-gradient(135deg, #1A3A2A, #2E6B50); color: #fff; }
    .metric-value { font-size: 28px; font-weight: 700; color: #1A3A2A; }
    .highlight .metric-value { color: #fff; }
    .metric-label { font-size: 12px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: .5px; }
    .highlight .metric-label { color: rgba(255,255,255,.7); }
    .month-bars { display: flex; align-items: flex-end; gap: 10px; height: 180px; padding-bottom: 0; }
    .month-bar-wrap { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
    .month-bar-outer { width: 100%; background: #e8f5e9; border-radius: 4px 4px 0 0; height: 120px; display: flex; align-items: flex-end; }
    .month-bar-fill { width: 100%; background: linear-gradient(to top, #1A3A2A, #2E6B50); border-radius: 4px 4px 0 0; transition: height .4s; min-height: 4px; }
    .month-label { font-size: 11px; color: #888; margin-top: 4px; }
    .month-value { font-size: 11px; font-weight: 600; color: #1A3A2A; }
    .month-count { font-size: 10px; color: #aaa; }
    .funnel-wrap { overflow-x: auto; }
    .funnel-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .funnel-table th { background: #f5f5f5; padding: 8px 12px; text-align: left; font-size: 12px; color: #555; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
    .funnel-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .funnel-table tr:hover td { background: #fafafa; }
    .source-pill { display: inline-block; padding: 3px 10px; border-radius: 12px; background: #e8f5e9; color: #1A3A2A; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .num { font-weight: 600; color: #222; }
    .funnel-cell { display: flex; align-items: center; gap: 6px; }
    .funnel-bar { width: 60px; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width .4s; }
    .c1 { background: #42a5f5; }
    .c2 { background: #ab47bc; }
    .c3 { background: #ff7043; }
    .c4 { background: #2E7D32; }
    .pct-label { font-size: 11px; color: #888; white-space: nowrap; }
    .close-rate { color: #2E7D32; font-size: 14px; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-header mat-form-field { width: 100% !important; }
      .metric-cards { gap: 10px; }
      .metric-card { min-width: 120px; padding: 14px 16px; }
      .metric-value { font-size: 22px; }
      .month-bars { overflow-x: auto; padding-bottom: 4px; }
      .month-bar-wrap { min-width: 34px; }
      .month-value { font-size: 9px; }
      .month-label { font-size: 9px; }
      .funnel-bar { width: 36px; }
      .pct-label { display: none; }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  api = inject(ApiService);
  year = new Date().getFullYear();
  years = Array.from({ length: 5 }, (_, i) => this.year - i);
  funnel = signal<any[]>([]);
  gci = signal<any>(null);
  loading = signal(false);

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.api.getPipelineFunnel().subscribe(f => { this.funnel.set(f); this.loading.set(false); });
    this.api.getGciSummary(this.year).subscribe(g => this.gci.set(g));
  }

  pct(num: number, denom: number) {
    if (!denom) return 0;
    return Math.round((num / denom) * 100);
  }

  monthName(m: number) { return MONTHS[m - 1] ?? ''; }

  barPct(val: number) {
    const max = Math.max(...(this.gci()?.byMonth ?? []).map((m: any) => m.totalCommission), 1);
    return Math.round((val / max) * 100);
  }
}
