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
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
    MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatTooltipModule,
    MatInputModule, MatSnackBarModule, ReactiveFormsModule],
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
          <a mat-list-item routerLink="/cq/leads" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('leads')">
            <mat-icon matListItemIcon>contact_page</mat-icon>
            <span matListItemTitle>Leads</span>
          </a>
          <a mat-list-item routerLink="/cq/customers" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales','Accountant') && tenant.hasFeature('customers')">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Clients</span>
          </a>
          <a mat-list-item routerLink="/cq/transactions" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>swap_horiz</mat-icon>
            <span matListItemTitle>Pipeline</span>
          </a>
          <a mat-list-item routerLink="/cq/showings" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>home_search</mat-icon>
            <span matListItemTitle>Showings</span>
          </a>
          <a mat-list-item routerLink="/cq/open-houses" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>meeting_room</mat-icon>
            <span matListItemTitle>Open Houses</span>
          </a>
          <a mat-list-item routerLink="/portal/listings" routerLinkActive="active-link" *ngIf="tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>home_work</mat-icon>
            <span matListItemTitle>Listings</span>
          </a>
          <a mat-list-item routerLink="/cq/email-templates" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales') && tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>mail_outline</mat-icon>
            <span matListItemTitle>Email Templates</span>
          </a>
          <a mat-list-item routerLink="/cq/analytics" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Sales','Accountant') && tenant.hasFeature('listings')">
            <mat-icon matListItemIcon>analytics</mat-icon>
            <span matListItemTitle>Analytics</span>
          </a>
          <a mat-list-item routerLink="/cq/expenses" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant') && tenant.hasFeature('expenses')">
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Expenses</span>
          </a>
          <a mat-list-item routerLink="/cq/income" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant') && tenant.hasFeature('income')">
            <mat-icon matListItemIcon>attach_money</mat-icon>
            <span matListItemTitle>Income</span>
          </a>
          <a mat-list-item routerLink="/cq/budgets" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant') && tenant.hasFeature('budgets')">
            <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
            <span matListItemTitle>Budgets</span>
          </a>
          <a mat-list-item routerLink="/cq/reports" routerLinkActive="active-link" *ngIf="auth.hasRole('Admin','Accountant') && tenant.hasFeature('reports')">
            <mat-icon matListItemIcon>bar_chart</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
          <a mat-list-item routerLink="/cq/jobs" routerLinkActive="active-link" *ngIf="tenant.hasFeature('jobs')">
            <mat-icon matListItemIcon>build</mat-icon>
            <span matListItemTitle>Jobs</span>
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
          <a mat-list-item routerLink="/cq/help" routerLinkActive="active-link">
            <mat-icon matListItemIcon>menu_book</mat-icon>
            <span matListItemTitle>Help</span>
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

        <div class="bug-report-row">
          <button mat-button class="bug-report-btn" (click)="openBugReport()" matTooltip="Report a problem">
            <mat-icon>bug_report</mat-icon>
            <span>Report a Bug</span>
          </button>
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
    .sidenav { width: 230px; background: color-mix(in srgb, var(--mat-sys-primary) 45%, black); color: white; display: flex; flex-direction: column; }
    .sidenav-header { display: flex; align-items: center; gap: 8px; padding: 20px 16px; background: var(--mat-sys-primary); }
    .logo-icon { color: var(--mat-sys-on-primary); font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .logo-text { font-size: 16px; font-weight: bold; color: white; flex: 1; }
    .theme-toggle { color: rgba(255,255,255,0.8) !important; margin-left: auto; }
    .theme-toggle mat-icon { font-size: 20px; width: 20px; height: 20px; color: rgba(255,255,255,0.8); }
    ::ng-deep .theme-toggle .mat-mdc-button-touch-target { display: flex; align-items: center; justify-content: center; }
    ::ng-deep .theme-toggle .mdc-icon-button__icon { display: flex; align-items: center; justify-content: center; line-height: 1; }
    mat-nav-list a { color: white !important; }
    mat-nav-list a span { color: white !important; }
    mat-nav-list a mat-icon { color: rgba(255,255,255,0.85) !important; }
    mat-nav-list a:hover { background: rgba(255,255,255,0.1) !important; }
    .active-link { background: rgba(255,255,255,0.18) !important; border-left: 3px solid var(--mat-sys-on-primary); }
    .active-link mat-icon { color: var(--mat-sys-on-primary) !important; }
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
    .mobile-toolbar { background: color-mix(in srgb, var(--mat-sys-primary) 45%, black) !important; color: white; position: sticky; top: 0; z-index: 100; }
    .mobile-logo-icon { color: var(--mat-sys-on-primary); font-size: 22px; width: 22px; height: 22px; margin-left: 4px; }
    .mobile-logo-text { font-size: 15px; font-weight: 700; color: white; margin-left: 6px; }
    .toolbar-spacer { flex: 1; }
    .mobile-toolbar button { color: white !important; }
    .bug-report-row { padding: 8px 12px 12px; }
    .bug-report-btn { width: 100%; color: rgba(255,255,255,0.55) !important; font-size: 12px; border: 1px solid rgba(255,255,255,0.15) !important; border-radius: 6px; }
    .bug-report-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .bug-report-btn:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.85) !important; }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  auth = inject(AuthService);
  tenant = inject(TenantService);
  theme = inject(ThemeService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private bp = inject(BreakpointObserver);
  private bpSub?: Subscription;

  selectedRole = '';
  isMobile = false;

  ngOnInit() {
    this.theme.apply();
    // Apply the tenant's Material theme class to <html>
    document.documentElement.classList.add(this.tenant.themeClass);
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

  openBugReport() {
    this.dialog.open(BugReportDialogComponent, {
      width: '500px',
      data: { user: this.auth.currentUser }
    });
  }
}

// ── Inline Bug Report Dialog ─────────────────────────────────────────────────
import { Component as NgComponent, Inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgComponent({
  selector: 'app-bug-report-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title style="display:flex;align-items:center;gap:8px;">
      <mat-icon style="color:#c62828;">bug_report</mat-icon> Report a Bug
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:14px;padding-top:4px;">
        <mat-form-field appearance="outline">
          <mat-label>Title *</mat-label>
          <input matInput formControlName="title" placeholder="Short summary of the issue" maxlength="200" />
          <mat-hint align="end">{{form.get('title')?.value?.length || 0}}/200</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description *</mat-label>
          <textarea matInput formControlName="description" rows="5"
            placeholder="Steps to reproduce, what you expected vs. what happened..."></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="low">Low — minor annoyance</mat-option>
            <mat-option value="medium">Medium — affects workflow</mat-option>
            <mat-option value="high">High — blocking issue</mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <div *ngIf="success" style="margin-top:12px;padding:10px 14px;background:#e8f5e9;border-radius:6px;color:#2e7d32;display:flex;align-items:center;gap:8px;">
        <mat-icon>check_circle</mat-icon> Bug reported — thanks!
      </div>
      <div *ngIf="error" style="margin-top:12px;padding:10px 14px;background:#ffebee;border-radius:6px;color:#c62828;display:flex;align-items:center;gap:8px;">
        <mat-icon>error</mat-icon> {{error}}
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="submitting">Cancel</button>
      <button mat-flat-button color="warn"
        [disabled]="form.invalid || submitting || success"
        (click)="submit()">
        <mat-spinner *ngIf="submitting" diameter="18" style="display:inline-block;margin-right:6px;"></mat-spinner>
        {{ submitting ? 'Sending…' : 'Submit Bug Report' }}
      </button>
    </mat-dialog-actions>
  `
})
export class BugReportDialogComponent {
  form: FormGroup;
  submitting = false;
  success = false;
  error = '';

  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<BugReportDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { user: any }) {
    const fb = inject(FormBuilder);
    this.form = fb.group({
      title:       ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      priority:    ['medium'],
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.submitting = true;
    this.error = '';

    const payload = {
      title:          this.form.value.title,
      description:    this.form.value.description,
      priority:       this.form.value.priority,
      submitterName:  this.data?.user?.name  ?? 'CRM User',
      submitterEmail: this.data?.user?.email ?? 'crm@closingbellga.com',
    };

    this.http.post('https://bcs-api.browningethan23.workers.dev/api/bugs/report', payload)
      .subscribe({
        next: () => {
          this.submitting = false;
          this.success = true;
          setTimeout(() => this.ref.close(), 1800);
        },
        error: (err) => {
          this.submitting = false;
          this.error = 'Failed to submit — please try again. (' + (err.status ?? 'network error') + ')';
        }
      });
  }
}
