import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

const STAGES = ['New Inquiry','Post-Showing','Pre-Offer','Post-Offer','Under Contract','Clear to Close','Closing Follow-Up','General'];

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatChipsModule, MatTooltipModule, MatSlideToggleModule,
    MatCardModule, MatProgressSpinnerModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Email Templates</h1>
      <p class="page-sub">Select a template, pick a client, and send directly from here</p>
    </div>
    <button mat-raised-button color="primary" (click)="openForm(null)">
      <mat-icon>add</mat-icon> New Template
    </button>
  </div>

  <div *ngFor="let stage of stagesWithTemplates()">
    <h2 class="stage-heading">{{stage.name}}</h2>
    <div class="card-grid">
      <mat-card *ngFor="let t of stage.templates" class="tmpl-card" [class.inactive]="!t.isActive">
        <mat-card-header>
          <mat-card-title>{{t.name}}</mat-card-title>
          <mat-card-subtitle class="subject-line">{{t.subject}}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p class="body-preview">{{t.body}}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="openSend(t)" [disabled]="!t.isActive" matTooltip="Send to a client">
            <mat-icon>send</mat-icon> Send
          </button>
          <button mat-icon-button (click)="openForm(t)" matTooltip="Edit template"><mat-icon>edit</mat-icon></button>
          <button mat-icon-button color="warn" (click)="delete(t)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
          <span class="inactive-badge" *ngIf="!t.isActive">Inactive</span>
        </mat-card-actions>
      </mat-card>
    </div>
  </div>

  <div class="empty-state" *ngIf="templates().length === 0">
    <mat-icon>mail_outline</mat-icon>
    <p>No templates yet — create your first one above.</p>
  </div>
</div>

<!-- ── Edit / Create template dialog ── -->
<ng-template #formDialog>
  <h2 mat-dialog-title>{{editing ? 'Edit Template' : 'New Template'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <div class="form-row-2">
      <mat-form-field appearance="outline" style="flex:2">
        <mat-label>Template Name</mat-label>
        <input matInput formControlName="name">
      </mat-form-field>
      <mat-form-field appearance="outline" style="flex:1">
        <mat-label>Stage</mat-label>
        <mat-select formControlName="stage">
          <mat-option *ngFor="let s of stages" [value]="s">{{s}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Subject Line</mat-label>
      <input matInput formControlName="subject">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Email Body</mat-label>
      <textarea matInput formControlName="body" rows="10" style="font-family:monospace;font-size:13px"></textarea>
      <mat-hint>Placeholders: [ClientName], [Address], [Date]</mat-hint>
    </mat-form-field>
    <mat-slide-toggle formControlName="isActive" style="margin-top:8px">Active</mat-slide-toggle>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid">Save</button>
  </mat-dialog-actions>
</ng-template>

<!-- ── Send to client dialog ── -->
<ng-template #sendDialog>
  <h2 mat-dialog-title><mat-icon style="vertical-align:middle;margin-right:6px;color:#1B5E20">send</mat-icon>Send Email</h2>
  <mat-dialog-content [formGroup]="sendForm">
    <p class="send-tmpl-name">Template: <strong>{{sendingTemplate()?.name}}</strong></p>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Client</mat-label>
      <mat-select formControlName="clientId">
        <mat-option *ngFor="let c of clients()" [value]="c.id">
          {{c.name}}<span class="client-email"> — {{c.email}}</span>
        </mat-option>
      </mat-select>
      <mat-hint>The email will be sent to the client's address on file</mat-hint>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full">
      <mat-label>Property Address</mat-label>
      <input matInput formControlName="address" placeholder="e.g. 123 Peachtree St NE, Atlanta, GA 30308">
      <mat-hint>Replaces [Address] in the template</mat-hint>
    </mat-form-field>

    <div class="preview-box" *ngIf="sendForm.value.clientId">
      <div class="preview-label">
        <mat-icon>preview</mat-icon> Email Preview
      </div>
      <div class="preview-subject"><strong>Subject:</strong> {{sendPreview().subject}}</div>
      <div class="preview-divider"></div>
      <pre class="preview-body">{{sendPreview().body}}</pre>
    </div>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-raised-button color="primary" (click)="sendEmail()" [disabled]="sendForm.invalid || sending()">
      <mat-spinner *ngIf="sending()" diameter="18" style="display:inline-block;margin-right:6px"></mat-spinner>
      <mat-icon *ngIf="!sending()">send</mat-icon>
      {{sending() ? 'Sending…' : 'Send Email'}}
    </button>
  </mat-dialog-actions>
</ng-template>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-sub { color: #666; margin: 2px 0 0; }
    .stage-heading { font-size: 16px; font-weight: 600; color: #1A3A2A; margin: 24px 0 12px; border-bottom: 2px solid #e0e0e0; padding-bottom: 6px; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .tmpl-card { cursor: default; }
    .tmpl-card.inactive { opacity: .6; }
    .subject-line { font-style: italic; color: #777 !important; font-size: 12px !important; }
    .body-preview { font-size: 13px; color: #555; white-space: pre-wrap; max-height: 80px; overflow: hidden; position: relative; }
    .body-preview::after { content:''; position:absolute; bottom:0; left:0; right:0; height:24px; background: linear-gradient(transparent, white); }
    .inactive-badge { margin-left: auto; font-size: 11px; color: #f44336; font-weight: 600; }
    mat-card-actions { gap: 4px; }

    /* Send dialog */
    .send-tmpl-name { color: #555; margin: 0 0 16px; font-size: 14px; }
    .client-email { color: #888; font-size: 12px; }
    .preview-box {
      margin-top: 20px; border: 1px solid #C5E1A5; border-radius: 6px;
      background: #F9FBE7; overflow: hidden;
    }
    .preview-label {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; background: #E8F5E9; color: #2E7D32;
      font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .preview-label mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .preview-subject { padding: 10px 14px 6px; font-size: 14px; color: #333; }
    .preview-divider { border-top: 1px solid #C5E1A5; margin: 4px 0; }
    .preview-body { padding: 8px 14px 12px; font-size: 13px; color: #555; white-space: pre-wrap; font-family: inherit; margin: 0; max-height: 200px; overflow-y: auto; }

    /* Form dialog */
    .form-row-2 { display: flex; gap: 12px; }
    .full { width: 100%; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }

    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-header button { align-self: stretch; }
      .card-grid { grid-template-columns: 1fr; }
      .form-row-2 { flex-direction: column; gap: 0; }
      .preview-body { max-height: 140px; }
    }
  `]
})
export class EmailTemplatesComponent implements OnInit, OnDestroy {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  fb = inject(FormBuilder);

  templates = signal<any[]>([]);
  clients   = signal<any[]>([]);
  stages    = STAGES;
  editing: any = null;

  sendingTemplate = signal<any>(null);
  sendPreview     = signal({ subject: '', body: '' });
  sending         = signal(false);

  private sendSub?: Subscription;

  @ViewChild('formDialog') _dlgRef!: TemplateRef<any>;
  @ViewChild('sendDialog') _sendDlgRef!: TemplateRef<any>;

  stagesWithTemplates = computed(() => {
    const tmpl = this.templates();
    return STAGES
      .map(s => ({ name: s, templates: tmpl.filter(t => t.stage === s) }))
      .filter(s => s.templates.length > 0);
  });

  form = this.fb.group({
    name:     ['', Validators.required],
    stage:    ['General', Validators.required],
    subject:  ['', Validators.required],
    body:     ['', Validators.required],
    isActive: [true],
  });

  sendForm = this.fb.group({
    clientId: ['', Validators.required],
    address:  [''],
  });

  ngOnInit() {
    this.load();
    this.api.getCustomers().subscribe(c => this.clients.set(c));
  }

  ngOnDestroy() { this.sendSub?.unsubscribe(); }

  load() { this.api.getEmailTemplates().subscribe(t => this.templates.set(t)); }

  openForm(t: any) {
    this.editing = t;
    if (t) this.form.patchValue({ name: t.name, stage: t.stage, subject: t.subject, body: t.body, isActive: t.isActive });
    else   this.form.reset({ stage: 'General', isActive: true });
    this.dialog.open(this._dlgRef!, { width: '95vw', maxWidth: '600px', maxHeight: '95dvh' });
  }

  openSend(t: any) {
    this.sendingTemplate.set(t);
    this.sending.set(false);
    this.sendForm.reset({ clientId: '', address: '' });
    this.sendPreview.set({ subject: t.subject, body: t.body });

    this.sendSub?.unsubscribe();
    this.sendSub = this.sendForm.valueChanges.subscribe(() => this.updatePreview());

    this.dialog.open(this._sendDlgRef!, { width: '95vw', maxWidth: '560px', maxHeight: '95dvh' });
  }

  updatePreview() {
    const t = this.sendingTemplate();
    if (!t) return;
    this.sendPreview.set({
      subject: this.substitute(t.subject),
      body:    this.substitute(t.body),
    });
  }

  substitute(text: string): string {
    const clientId = this.sendForm.value.clientId;
    const client   = this.clients().find(c => c.id === clientId);
    const address  = this.sendForm.value.address || '';
    const today    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return text
      .replace(/\[ClientName\]/g, client?.name || '[ClientName]')
      .replace(/\[Address\]/g,    address       || '[Address]')
      .replace(/\[Date\]/g,       today);
  }

  save() {
    const v = this.form.value;
    const obs = this.editing
      ? this.api.updateEmailTemplate(this.editing.id, v)
      : this.api.createEmailTemplate(v);
    obs.subscribe({
      next:  () => { this.load(); this.dialog.closeAll(); this.snack.open('Saved', 'OK', { duration: 2000 }); },
      error: () => this.snack.open('Error saving template', 'OK', { duration: 2000 })
    });
  }

  sendEmail() {
    if (this.sendForm.invalid) return;
    const t = this.sendingTemplate();
    this.sending.set(true);
    this.api.sendEmailTemplate(t.id, this.sendForm.value as { clientId: string; address: string }).subscribe({
      next: () => {
        this.sending.set(false);
        this.dialog.closeAll();
        this.snack.open('Email sent successfully!', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.sending.set(false);
        const msg = err?.error?.message || err?.error || 'Failed to send email';
        this.snack.open(msg, 'OK', { duration: 4000 });
      }
    });
  }

  delete(t: any) {
    if (!confirm(`Delete "${t.name}"?`)) return;
    this.api.deleteEmailTemplate(t.id).subscribe(() => this.load());
  }
}
