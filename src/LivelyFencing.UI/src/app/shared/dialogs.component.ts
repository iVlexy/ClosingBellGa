import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p style="margin:0;line-height:1.5">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ data.confirmLabel ?? 'Delete' }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA) as { title: string; message: string; confirmLabel?: string };
}

@Component({
  selector: 'app-reject-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title ?? 'Decline Quote' }}</h2>
    <mat-dialog-content>
      <p *ngIf="data.message" style="margin:0 0 16px;line-height:1.5">{{ data.message }}</p>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>{{ data.placeholder ?? 'Reason (optional)' }}</mat-label>
        <textarea matInput [(ngModel)]="reason" rows="4"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn"
        [disabled]="!!data.required && !reason.trim()"
        (click)="submit()">{{ data.confirmLabel ?? 'Submit' }}</button>
    </mat-dialog-actions>
  `
})
export class RejectDialogComponent {
  data = inject(MAT_DIALOG_DATA) as {
    title?: string;
    message?: string;
    placeholder?: string;
    required?: boolean;
    confirmLabel?: string;
  };
  dialogRef = inject(MatDialogRef<RejectDialogComponent>);
  reason = '';
  submit() { this.dialogRef.close(this.reason.trim() || null); }
}
