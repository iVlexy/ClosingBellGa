import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatCardModule, MatChipsModule, MatSnackBarModule, MatTooltipModule,
    MatSlideToggleModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>User Management</h1>
        <span class="subtitle">{{ users().length }} users</span>
      </div>

      <mat-card>
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [(ngModel)]="search" placeholder="Name or email...">
          </mat-form-field>
        </div>
        <table mat-table [dataSource]="filtered()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <mat-icon class="user-icon">account_circle</mat-icon>
                <div>
                  <div class="user-name">{{ u.name }}</div>
                  <div class="user-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <mat-select [(ngModel)]="u.role" (ngModelChange)="updateRole(u, $event)"
                [disabled]="u.email === auth.currentUser?.email"
                class="role-select" [class]="'role-' + u.role.toLowerCase()">
                <mat-option *ngFor="let r of roles" [value]="r">{{ r }}</mat-option>
              </mat-select>
            </td>
          </ng-container>
          <ng-container matColumnDef="lastLogin">
            <th mat-header-cell *matHeaderCellDef>Last Login</th>
            <td mat-cell *matCellDef="let u">{{ u.lastLoginAt ? (u.lastLoginAt | date:'medium') : 'Never' }}</td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Active</th>
            <td mat-cell *matCellDef="let u">
              <mat-slide-toggle
                [checked]="u.isActive"
                (change)="toggleActive(u, $event.checked)"
                [disabled]="u.email === auth.currentUser?.email"
                color="primary">
              </mat-slide-toggle>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" [class.inactive-row]="!row.isActive"></tr>
          <tr class="mat-row" *matNoDataRow><td [attr.colspan]="cols.length" class="no-data">No users found.</td></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 24px; }
    .subtitle { color: #888; font-size: 14px; }
    .search-bar { padding: 8px 0 0 0; }
    .search-field { width: 320px; }
    .full-width { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .user-icon { color: #9E9E9E; }
    .user-name { font-weight: 500; font-size: 14px; }
    .user-email { font-size: 12px; color: #888; }
    .role-select { min-width: 140px; }
    .inactive-row td { opacity: 0.5; }
    .no-data { padding: 24px; text-align: center; color: #888; }
  `]
})
export class UserManagementComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  snack = inject(MatSnackBar);

  users = signal<any[]>([]);
  search = '';
  roles = ['Admin', 'Sales', 'Accountant', 'FieldWorker', 'Customer', 'FMLSApprover'];
  cols = ['name', 'role', 'lastLogin', 'created', 'active'];

  filtered = () => {
    const s = this.search.toLowerCase();
    return s ? this.users().filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)) : this.users();
  };

  ngOnInit() { this.api.getUsers().subscribe(u => this.users.set(u)); }

  updateRole(user: any, role: string) {
    this.api.updateUserRole(user.id, role).subscribe({
      next: () => this.snack.open(`${user.name} → ${role}`, 'OK', { duration: 3000 }),
      error: () => this.snack.open('Failed to update role', 'OK', { duration: 3000 })
    });
  }

  toggleActive(user: any, isActive: boolean) {
    this.api.setUserActive(user.id, isActive).subscribe({
      next: () => {
        user.isActive = isActive;
        this.snack.open(`${user.name} ${isActive ? 'activated' : 'deactivated'}`, 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update status', 'OK', { duration: 3000 })
    });
  }
}
