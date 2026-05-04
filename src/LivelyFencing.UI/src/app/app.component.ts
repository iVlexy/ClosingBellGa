import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { TenantService } from './core/services/tenant.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule,
    MatDialogModule, MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatTooltipModule],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav
        [mode]="isMobile ? 'over' : 'side'"
        [opened]="isMobile ? false : true"
        class="sidenav"
        *ngIf="auth.currentUser && (auth.isInternal() || auth.realIsAdmin)">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">{{ tenant.config.icon }}</mat-icon>
          <span class="logo-text">{{ tenant.config.businessName }}</span>
          <button mat-icon-button class="theme-toggle" (click)="theme.toggle()" [matTooltip]="theme.dark ? 'Light mode' : 'Dark mode'">
            <mat-icon>{{ theme.dark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </div>
        <mat-nav-list (click)="isMobile && sidenav.close()">
          <a mat-list-item routerLink="/cq/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/cq/customers" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales','Accountant') && tenant.hasFeature('customers')">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Customers</span>
          </a>
          <a mat-list-item routerLink="/cq/leads" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('leads')">
            <mat-icon matListItemIcon>contact_page</mat-icon>
            <span matListItemTitle>Leads</span>
          </a>
          <a mat-list-item routerLink="/cq/jobs" routerLinkActive="active-link" *ngIf="tenant.hasFeature('jobs')">
            <mat-icon matListItemIcon>build</mat-icon>
            <span matListItemTitle>Jobs</span>
          </a>
          <a mat-list-item routerLink="/cq/quotes" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales','Accountant')">
            <mat-icon matListItemIcon>request_quote</mat-icon>
            <span matListItemTitle>Quotes</span>
          </a>
          <a mat-list-item routerLink="/cq/contractors" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant')">
            <mat-icon matListItemIcon>engineering</mat-icon>
            <span matListItemTitle>Contractors</span>
          </a>
          <a mat-list-item routerLink="/cq/budgets" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant')">
            <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
            <span matListItemTitle>Budgets</span>
          </a>
          <a mat-list-item routerLink="/cq/reports" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant')">
            <mat-icon matListItemIcon>bar_chart</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
          <a mat-list-item routerLink="/cq/expenses" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant')">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Expenses</span>
          </a>
          <a mat-list-item routerLink="/cq/income" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant')">
            <mat-icon matListItemIcon>attach_money</mat-icon>
            <span matListItemTitle>Income</span>
          </a>
          <a mat-list-item routerLink="/cq/help" routerLinkActive="active-link">
            <mat-icon matListItemIcon>menu_book</mat-icon>
            <span matListItemTitle>Help</span>
          </a>
          <a mat-list-item routerLink="/cq/admin/users" routerLinkActive="active-link" *ngIf="auth.realIsAdmin && !auth.isImpersonating">
            <mat-icon matListItemIcon>manage_accounts</mat-icon>
            <span matListItemTitle>Users</span>
          </a>
          <a mat-list-item routerLink="/cq/admin/carousel" routerLinkActive="active-link" *ngIf="auth.realIsAdmin && !auth.isImpersonating">
            <mat-icon matListItemIcon>collections</mat-icon>
            <span matListItemTitle>Carousel</span>
          </a>
          <a mat-list-item routerLink="/cq/admin/reviews" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && !auth.isImpersonating">
            <mat-icon matListItemIcon>reviews</mat-icon>
            <span matListItemTitle>Reviews</span>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer" *ngIf="auth.currentUser">
          <div class="user-row">
            <mat-icon>account_circle</mat-icon>
            <span class="user-info">{{ auth.currentUser.name }}<br/>
              <small *ngIf="!auth.isImpersonating">{{ auth.currentUser.role }}</small>
              <small *ngIf="auth.isImpersonating" class="impersonating-label">Viewing as {{ auth.impersonatedRole }}</small>
            </span>
          </div>
          <div class="impersonate-row" *ngIf="auth.realIsAdmin">
            <mat-form-field appearance="outline" class="role-select">
              <mat-label>View as</mat-label>
              <mat-select [(ngModel)]="selectedRole" (ngModelChange)="onImpersonate($event)">
                <mat-option value="">— My view —</mat-option>
                <mat-option *ngFor="let r of auth.allRoles" [value]="r">{{ r }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </mat-sidenav>

      <mat-sidenav-content>
        <!-- Mobile toolbar -->
        <mat-toolbar class="mobile-toolbar" *ngIf="isMobile && auth.currentUser && (auth.isInternal() || auth.realIsAdmin)">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <mat-icon class="mobile-logo-icon">{{ tenant.config.icon }}</mat-icon>
          <span class="mobile-logo-text">{{ tenant.config.businessName }}</span>
          <span class="toolbar-spacer"></span>
          <button mat-icon-button (click)="theme.toggle()">
            <mat-icon>{{ theme.dark ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
        </mat-toolbar>

        <div class="impersonation-banner" *ngIf="auth.isImpersonating">
          <mat-icon>visibility</mat-icon>
          <span>Viewing app as <strong>{{ auth.impersonatedRole }}</strong> &mdash; some features may be hidden</span>
          <button mat-icon-button (click)="stopImpersonation()" matTooltip="Return to Admin view">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .sidenav { width: 230px; background: var(--tenant-primary-dark, #1B5E20); color: white; display: flex; flex-direction: column; }
    .sidenav-header { display: flex; align-items: center; gap: 8px; padding: 20px 16px; background: var(--tenant-primary, #2E7D32); }
    .logo-icon { color: #A5D6A7; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .logo-text { font-size: 16px; font-weight: bold; color: white; flex: 1; }
    .theme-toggle { color: rgba(255,255,255,0.8) !important; margin-left: auto; }
    .theme-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgba(255,255,255,0.8); }
    ::ng-deep .theme-toggle .mat-mdc-button-touch-target { display: flex; align-items: center; justify-content: center; }
    ::ng-deep .theme-toggle .mdc-icon-button__icon { display: flex; align-items: center; justify-content: center; line-height: 1; }
    mat-nav-list a { color: white !important; }
    mat-nav-list a span { color: white !important; }
    mat-nav-list a mat-icon { color: rgba(255,255,255,0.85) !important; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1) !important; }
    .active-link { background: rgba(255,255,255,0.18) !important; border-left: 3px solid #A5D6A7; }
    .active-link mat-icon { color: #A5D6A7 !important; }
    .active-link span { color: white !important; font-weight: 500; }
    ::ng-deep .sidenav .mdc-list-item__primary-text { color: white !important; }
    ::ng-deep .sidenav .mat-mdc-list-item .mat-icon { color: rgba(255,255,255,0.85) !important; }
    ::ng-deep .sidenav .mat-mdc-list-item:hover .mat-icon { color: white !important; }
    .sidenav-footer { margin-top: auto; padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.1); }
    .user-row { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 10px; }
    .user-row mat-icon { color: rgba(255,255,255,0.7); }
    .user-info { line-height: 1.4; color: rgba(255,255,255,0.85); }
    .impersonating-label { color: #FFD54F; font-weight: bold; }
    .impersonate-row .role-select { width: 100%; }
    .impersonate-row ::ng-deep .mat-mdc-form-field-flex { background: rgba(255,255,255,0.1); }
    .impersonate-row ::ng-deep .mat-mdc-text-field-wrapper { padding: 0 8px; }
    .impersonate-row ::ng-deep label, .impersonate-row ::ng-deep .mat-mdc-select-value { color: rgba(255,255,255,0.8) !important; font-size: 13px; }
    .impersonate-row ::ng-deep .mat-mdc-select-arrow { color: rgba(255,255,255,0.6); }
    .impersonation-banner { display: flex; align-items: center; gap: 8px; background: #F57F17; color: white; padding: 8px 16px; font-size: 14px; }
    .impersonation-banner mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .impersonation-banner span { flex: 1; }
    .impersonation-banner button { color: white; }
    /* Mobile toolbar */
    .mobile-toolbar { background: var(--tenant-primary-dark, #1B5E20) !important; color: white; position: sticky; top: 0; z-index: 100; }
    .mobile-logo-icon { color: #A5D6A7; font-size: 22px; width: 22px; height: 22px; margin-left: 4px; }
    .mobile-logo-text { font-size: 15px; font-weight: 700; color: white; margin-left: 6px; }
    .toolbar-spacer { flex: 1; }
    .mobile-toolbar button { color: white !important; }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  auth = inject(AuthService);
  tenant = inject(TenantService);
  theme = inject(ThemeService);
  private router = inject(Router);
  private bp = inject(BreakpointObserver);
  private bpSub?: Subscription;

  selectedRole = '';
  isMobile = false;

  ngOnInit() {
    this.theme.apply();
    // Apply tenant colors as CSS variables
    document.documentElement.style.setProperty('--tenant-primary', this.tenant.config.primaryColor);
    document.documentElement.style.setProperty('--tenant-primary-dark', this.tenant.config.primaryColorDark || this.darkenColor(this.tenant.config.primaryColor));
    this.auth.getMe().subscribe();
    this.auth.impersonatedRole$.subscribe(role => {
      this.selectedRole = role ?? '';
    });
    this.bpSub = this.bp.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .subscribe(result => { this.isMobile = result.matches; });
  }

  ngOnDestroy() { this.bpSub?.unsubscribe(); }

  onImpersonate(role: string) {
    if (role) {
      this.auth.startImpersonation(role);
    } else {
      this.auth.stopImpersonation();
    }
    this.router.navigate(role === 'Customer' ? ['/'] : ['/cq/dashboard']);
  }

  stopImpersonation() {
    this.auth.stopImpersonation();
    this.router.navigate(['/cq/dashboard']);
  }
  darkenColor(hex: string): string {
    const n = parseInt(hex.replace('#',''), 16);
    const r = Math.max(0, (n >> 16) - 40);
    const g = Math.max(0, ((n >> 8) & 0xff) - 40);
    const b = Math.max(0, (n & 0xff) - 40);
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  }
}
