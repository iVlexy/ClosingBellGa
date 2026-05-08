import { Component, OnInit, inject, signal, computed, ViewChild, TemplateRef } from '@angular/core';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../core/services/api.service';

const PIPELINE = [
  { key: 'Prospecting',    label: 'Prospecting',      color: '#607d8b' },
  { key: 'OfferSubmitted', label: 'Offer Submitted',  color: '#1565C0' },
  { key: 'UnderContract',  label: 'Under Contract',   color: '#6A1B9A' },
  { key: 'Inspection',     label: 'Inspection',       color: '#E65100' },
  { key: 'Appraisal',      label: 'Appraisal',        color: '#BF360C' },
  { key: 'ClearToClose',   label: 'Clear to Close',   color: '#558B2F' },
  { key: 'Closed',         label: 'Closed',           color: '#2E7D32' },
  { key: 'FallThrough',    label: 'Fall Through',     color: '#c62828' },
];

const DOC_STATUSES = ['Pending','Sent','Signed','Received','NotRequired'];
const TX_TYPES = [
  { key: 'BuyerRepresentation',  label: 'Buyer Representation' },
  { key: 'SellerRepresentation', label: 'Seller Representation' },
  { key: 'Dual',                 label: 'Dual Agency' },
];

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatChipsModule, MatTooltipModule, MatProgressBarModule,
    MatCheckboxModule, MatDividerModule, DragDropModule],
  template: `
<div class="page-container">
  <div class="page-header">
    <div>
      <h1 class="page-title">Deal Pipeline</h1>
      <p class="page-sub">Track transactions from offer to close</p>
    </div>
    <button mat-raised-button color="primary" (click)="openForm(null)">
      <mat-icon>add</mat-icon> New Transaction
    </button>
  </div>

  <!-- Summary bar -->
  <div class="summary-row" *ngIf="transactions().length > 0">
    <div class="sum-chip" *ngFor="let s of pipeline">
      <span class="sum-dot" [style.background]="s.color"></span>
      <span class="sum-label">{{s.label}}</span>
      <span class="sum-count">{{countByStatus(s.key)}}</span>
    </div>
  </div>

  <!-- Kanban board -->
  <div class="board" cdkDropListGroup>
    <div class="board-col" *ngFor="let stage of pipeline">
      <div class="col-header" [style.border-color]="stage.color">
        <span class="col-title">{{stage.label}}</span>
        <span class="col-badge" [style.background]="stage.color">{{countByStatus(stage.key)}}</span>
      </div>
      <div class="col-cards">
        <div class="tx-card" *ngFor="let tx of byStatus(stage.key)"
          cdkDrag [cdkDragData]="tx"
          (cdkDragStarted)="onDragStarted()"
          (click)="openDetail(tx)">
          <div class="tx-client">{{tx.clientName}}</div>
          <div class="tx-addr" *ngIf="tx.address">{{tx.address}}</div>
          <div class="tx-meta">
            <span class="tx-type">{{typeLabel(tx.type)}}</span>
            <span class="tx-comm" *ngIf="tx.commissionExpected">
              {{tx.commissionExpected | currency:'USD':'symbol':'1.0-0'}}
            </span>
          </div>
          <div class="tx-date" *ngIf="tx.closingDate">
            Close: {{tx.closingDate | date:'MMM d'}}
          </div>
          <div class="tx-docs" *ngIf="tx.documents?.length">
            <mat-progress-bar mode="determinate"
              [value]="docProgress(tx)" style="height:4px;border-radius:2px">
            </mat-progress-bar>
            <span class="doc-label">{{doneDocCount(tx)}}/{{tx.documents.length}} docs</span>
          </div>
        </div>
        <div class="col-empty" *ngIf="byStatus(stage.key).length === 0">—</div>
      </div>
    </div>
  </div>

  <div class="empty-state" *ngIf="transactions().length === 0">
    <mat-icon>home_work</mat-icon>
    <p>No transactions yet — add your first deal above.</p>
  </div>
</div>

<!-- Transaction Form Dialog -->
<ng-template #formDialog let-data>
  <h2 mat-dialog-title>{{data.tx ? 'Edit Transaction' : 'New Transaction'}}</h2>
  <mat-dialog-content [formGroup]="form">
    <div class="form-row-2">
      <mat-form-field appearance="outline" style="flex:2">
        <mat-label>Client</mat-label>
        <mat-select formControlName="clientId">
          <mat-option *ngFor="let c of clients()" [value]="c.id">{{c.name}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" style="flex:1">
        <mat-label>Type</mat-label>
        <mat-select formControlName="type">
          <mat-option *ngFor="let t of txTypes" [value]="t.key">{{t.label}}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Property Address</mat-label>
      <input matInput formControlName="address">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>MLS / Listing Key (optional)</mat-label>
      <input matInput formControlName="listingKey">
    </mat-form-field>
    <div class="form-row-2">
      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option *ngFor="let s of pipeline" [value]="s.key">{{s.label}}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Sale Price</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" formControlName="salePrice">
      </mat-form-field>
    </div>
    <div class="form-row-2">
      <mat-form-field appearance="outline">
        <mat-label>Commission Rate</mat-label>
        <span matTextSuffix>%</span>
        <input matInput type="number" formControlName="commissionRate" step="0.1">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Commission Expected</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" formControlName="commissionExpected">
      </mat-form-field>
    </div>
    <div class="form-row-2">
      <mat-form-field appearance="outline">
        <mat-label>Commission Received</mat-label>
        <span matTextPrefix>$&nbsp;</span>
        <input matInput type="number" formControlName="commissionReceived">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Closing Date</mat-label>
        <input matInput type="date" formControlName="closingDate">
      </mat-form-field>
    </div>
    <div class="form-row-4">
      <mat-form-field appearance="outline">
        <mat-label>Offer Date</mat-label>
        <input matInput type="date" formControlName="offerDate">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Contract Date</mat-label>
        <input matInput type="date" formControlName="contractDate">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Inspection</mat-label>
        <input matInput type="date" formControlName="inspectionDate">
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Appraisal</mat-label>
        <input matInput type="date" formControlName="appraisalDate">
      </mat-form-field>
    </div>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Notes</mat-label>
      <textarea matInput formControlName="notes" rows="3"></textarea>
    </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-raised-button color="primary" (click)="saveTransaction(data.tx)" [disabled]="form.invalid">
      {{data.tx ? 'Update' : 'Create'}}
    </button>
  </mat-dialog-actions>
</ng-template>

<!-- Transaction Detail Dialog -->
<ng-template #detailDialog let-data>
  <h2 mat-dialog-title style="display:flex;justify-content:space-between;align-items:center">
    <span>{{data.tx.clientName}} — {{data.tx.address || 'No address'}}</span>
    <span class="status-badge-detail" [style.background]="stageColor(data.tx.status)">{{statusLabel(data.tx.status)}}</span>
  </h2>
  <mat-dialog-content>
    <!-- Pipeline progress -->
    <div class="pipeline-steps">
      <div class="pipe-step" *ngFor="let s of pipeline"
        [class.done]="isStepDone(data.tx.status, s.key)"
        [class.current]="data.tx.status === s.key"
        [style.--col]="s.color">
        <div class="pipe-dot"></div>
        <div class="pipe-label">{{s.label}}</div>
      </div>
    </div>

    <!-- Key dates row -->
    <div class="detail-dates" *ngIf="data.tx.offerDate || data.tx.closingDate">
      <div *ngIf="data.tx.offerDate"><strong>Offer:</strong> {{data.tx.offerDate | date:'MMM d, y'}}</div>
      <div *ngIf="data.tx.contractDate"><strong>Contract:</strong> {{data.tx.contractDate | date:'MMM d, y'}}</div>
      <div *ngIf="data.tx.inspectionDate"><strong>Inspection:</strong> {{data.tx.inspectionDate | date:'MMM d, y'}}</div>
      <div *ngIf="data.tx.appraisalDate"><strong>Appraisal:</strong> {{data.tx.appraisalDate | date:'MMM d, y'}}</div>
      <div *ngIf="data.tx.closingDate"><strong>Closing:</strong> {{data.tx.closingDate | date:'MMM d, y'}}</div>
    </div>

    <!-- Commission -->
    <div class="commission-row" *ngIf="data.tx.salePrice || data.tx.commissionExpected">
      <div *ngIf="data.tx.salePrice"><strong>Sale Price:</strong> {{data.tx.salePrice | currency:'USD':'symbol':'1.0-0'}}</div>
      <div *ngIf="data.tx.commissionRate"><strong>Rate:</strong> {{data.tx.commissionRate}}%</div>
      <div *ngIf="data.tx.commissionExpected"><strong>Expected:</strong> {{data.tx.commissionExpected | currency:'USD':'symbol':'1.0-0'}}</div>
      <div *ngIf="data.tx.commissionReceived"><strong>Received:</strong> {{data.tx.commissionReceived | currency:'USD':'symbol':'1.0-0'}}</div>
    </div>

    <p *ngIf="data.tx.notes" class="detail-notes">{{data.tx.notes}}</p>

    <mat-divider style="margin:16px 0"></mat-divider>

    <!-- Move stage buttons -->
    <div class="stage-actions">
      <span class="stage-label">Move stage:</span>
      <button *ngFor="let s of pipeline" mat-stroked-button
        [style.border-color]="s.color" [style.color]="s.color"
        [class.active-stage]="data.tx.status === s.key"
        (click)="moveStage(data.tx, s.key)">
        {{s.label}}
      </button>
    </div>

    <mat-divider style="margin:16px 0"></mat-divider>

    <!-- Document checklist -->
    <div class="doc-section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <strong>Document Checklist</strong>
        <button mat-stroked-button (click)="openAddDoc(data.tx)">
          <mat-icon>add</mat-icon> Add Doc
        </button>
      </div>
      <div class="doc-list" *ngIf="data.tx.documents?.length > 0">
        <div class="doc-item" *ngFor="let doc of data.tx.documents">
          <span class="doc-status-badge" [class]="'ds-' + doc.status.toLowerCase()">
            {{doc.status}}
          </span>
          <span class="doc-name">{{doc.name}}</span>
          <span class="doc-due" *ngIf="doc.dueDate">{{doc.dueDate | date:'MMM d'}}</span>
          <div class="doc-actions">
            <button mat-icon-button *ngFor="let ds of docStatuses"
              [matTooltip]="ds"
              [class.active-ds]="doc.status === ds"
              (click)="setDocStatus(data.tx, doc, ds)">
              <mat-icon>{{docStatusIcon(ds)}}</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="deleteDoc(data.tx, doc)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
      </div>
      <div *ngIf="!data.tx.documents?.length" class="no-docs">No documents added yet</div>
    </div>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button color="warn" (click)="deleteTransaction(data.tx)">Delete</button>
    <button mat-button mat-dialog-close>Close</button>
    <button mat-raised-button color="primary" (click)="openForm(data.tx)">Edit</button>
  </mat-dialog-actions>
</ng-template>

<!-- Add Doc Dialog -->
<ng-template #addDocDialog let-data>
  <h2 mat-dialog-title>Add Document</h2>
  <mat-dialog-content [formGroup]="docForm">
    <mat-form-field appearance="outline" class="full">
      <mat-label>Document Name</mat-label>
      <input matInput formControlName="name" placeholder="e.g. Purchase Agreement">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Status</mat-label>
      <mat-select formControlName="status">
        <mat-option *ngFor="let s of docStatuses" [value]="s">{{s}}</mat-option>
      </mat-select>
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Due Date</mat-label>
      <input matInput type="date" formControlName="dueDate">
    </mat-form-field>
    <mat-form-field appearance="outline" class="full">
      <mat-label>Notes</mat-label>
      <input matInput formControlName="notes">
    </mat-form-field>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-raised-button color="primary" (click)="saveDoc(data.tx)" [disabled]="docForm.invalid">Add</button>
  </mat-dialog-actions>
</ng-template>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 0; }
    .page-sub { color: #666; margin: 2px 0 0; }
    .summary-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .sum-chip { display: flex; align-items: center; gap: 4px; background: #f5f5f5; border-radius: 20px; padding: 4px 10px; font-size: 12px; }
    .sum-dot { width: 8px; height: 8px; border-radius: 50%; }
    .sum-label { color: #555; }
    .sum-count { font-weight: 700; color: #222; }
    .board { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; min-height: 400px; }
    .board-col { min-width: 200px; max-width: 220px; flex-shrink: 0; }
    .col-header { background: #fff; border-radius: 8px 8px 0 0; border-top: 4px solid; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
    .col-title { font-size: 12px; font-weight: 600; color: #333; }
    .col-badge { color: #fff; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
    .col-cards { background: #f3f4f6; border-radius: 0 0 8px 8px; padding: 8px; display: flex; flex-direction: column; gap: 8px; min-height: 200px; }
    .tx-card { background: #fff; border-radius: 8px; padding: 10px 12px; cursor: pointer; border: 1px solid #e5e7eb; transition: box-shadow .15s; }
    .tx-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
    .tx-client { font-weight: 600; font-size: 13px; color: #1A3A2A; }
    .tx-addr { font-size: 11px; color: #666; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-meta { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; }
    .tx-type { color: #888; }
    .tx-comm { color: #2E7D32; font-weight: 600; }
    .tx-date { font-size: 11px; color: #1565C0; margin-top: 4px; }
    .tx-docs { margin-top: 6px; }
    .doc-label { font-size: 10px; color: #999; }
    .col-empty { text-align: center; color: #bbb; font-size: 12px; padding: 20px 0; }
    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    .form-row-2 { display: flex; gap: 12px; }
    .form-row-2 mat-form-field { flex: 1; }
    .form-row-4 { display: flex; gap: 8px; }
    .form-row-4 mat-form-field { flex: 1; }
    .full { width: 100%; }
    mat-dialog-content { max-height: 65vh; overflow-y: auto; }
    .pipeline-steps { display: flex; gap: 0; margin-bottom: 16px; overflow-x: auto; }
    .pipe-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 70px; }
    .pipe-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ddd; background: #fff; transition: background .2s; }
    .pipe-step.done .pipe-dot { background: var(--col); border-color: var(--col); }
    .pipe-step.current .pipe-dot { background: var(--col); border-color: var(--col); box-shadow: 0 0 0 3px color-mix(in srgb, var(--col) 30%, transparent); }
    .pipe-label { font-size: 9px; color: #888; text-align: center; margin-top: 4px; }
    .pipe-step.done .pipe-label, .pipe-step.current .pipe-label { color: #333; font-weight: 600; }
    .detail-dates { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #444; margin-bottom: 12px; }
    .commission-row { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #444; margin-bottom: 12px; background: #f0f7f0; padding: 10px; border-radius: 8px; }
    .detail-notes { font-size: 13px; color: #555; white-space: pre-wrap; margin: 8px 0; }
    .stage-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .stage-label { font-size: 12px; color: #666; margin-right: 4px; }
    .stage-actions button { font-size: 11px; padding: 0 10px; height: 28px; line-height: 28px; }
    .active-stage { background: rgba(0,0,0,.06) !important; font-weight: 700; }
    .status-badge-detail { padding: 4px 12px; border-radius: 20px; color: #fff; font-size: 13px; font-weight: 600; }
    .doc-section { }
    .doc-list { display: flex; flex-direction: column; gap: 6px; }
    .doc-item { display: flex; align-items: center; gap: 8px; background: #f9f9f7; border-radius: 6px; padding: 6px 10px; }
    .doc-status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
    .ds-pending { background: #fff3e0; color: #E65100; }
    .ds-sent { background: #e3f2fd; color: #1565C0; }
    .ds-signed { background: #e8f5e9; color: #2E7D32; }
    .ds-received { background: #e8f5e9; color: #1B5E20; }
    .ds-notrequired { background: #f5f5f5; color: #9e9e9e; }
    .doc-name { flex: 1; font-size: 13px; }
    .doc-due { font-size: 11px; color: #888; white-space: nowrap; }
    .doc-actions { display: flex; }
    .doc-actions button { width: 28px; height: 28px; }
    .doc-actions mat-icon { font-size: 16px; }
    .active-ds { color: #1A3A2A !important; }
    .no-docs { color: #bbb; font-size: 13px; text-align: center; padding: 12px; }
    /* Drag & drop */
    .cdk-drag-preview { background:#fff; border-radius:8px; padding:10px 12px; border:1px solid #e5e7eb; box-shadow:0 8px 24px rgba(0,0,0,.18); font-size:13px; min-width:180px; }
    .cdk-drag-placeholder { background:#e8f5e9; border:2px dashed #81C784; border-radius:8px; min-height:48px; opacity:.6; }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,0.2,1); }
    .cdk-drop-list-dragging .tx-card:not(.cdk-drag-placeholder) { transition: transform 200ms cubic-bezier(0,0,0.2,1); }
    .cdk-drop-list-receiving { background:#f0f7f0 !important; outline:2px dashed #81C784; outline-offset:-4px; border-radius:0 0 8px 8px; }
    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      .page-header button { align-self: stretch; }
      .board-col { min-width: 160px; max-width: 175px; }
      .form-row-2 { flex-direction: column; gap: 0; }
      .form-row-4 { flex-direction: column; gap: 0; }
      .pipeline-steps { gap: 0; }
      .pipe-step { min-width: 48px; }
      .pipe-label { font-size: 8px; }
      .stage-actions button { font-size: 10px; padding: 0 6px; height: 26px; line-height: 26px; }
      .detail-dates, .commission-row { gap: 8px; }
      .doc-item { flex-wrap: wrap; }
      .doc-actions { margin-left: auto; }
      mat-dialog-content { max-height: 55vh; }
    }
  `]
})
export class TransactionsComponent implements OnInit {
  api = inject(ApiService);
  dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  fb = inject(FormBuilder);

  transactions = signal<any[]>([]);
  clients = signal<any[]>([]);
  pipeline = PIPELINE;
  txTypes = TX_TYPES;
  docStatuses = DOC_STATUSES;

  form = this.fb.group({
    clientId: ['', Validators.required],
    type: ['BuyerRepresentation', Validators.required],
    address: [''],
    listingKey: [''],
    status: ['Prospecting'],
    salePrice: [null as number | null],
    commissionRate: [null as number | null],
    commissionExpected: [null as number | null],
    commissionReceived: [null as number | null],
    closingDate: [''],
    offerDate: [''],
    contractDate: [''],
    inspectionDate: [''],
    appraisalDate: [''],
    notes: [''],
  });

  docForm = this.fb.group({
    name: ['', Validators.required],
    status: ['Pending'],
    dueDate: [''],
    notes: [''],
  });

  ngOnInit() {
    this.load();
    this.api.getCustomers().subscribe(c => this.clients.set(c));
  }

  load() {
    this.api.getTransactions().subscribe(t => this.transactions.set(t));
  }

  byStatus(status: string) { return this.transactions().filter(t => t.status === status); }
  countByStatus(s: string) { return this.byStatus(s).length; }
  typeLabel(key: string) { return TX_TYPES.find(t => t.key === key)?.label ?? key; }
  stageColor(s: string) { return PIPELINE.find(p => p.key === s)?.color ?? '#607d8b'; }
  statusLabel(s: string) { return PIPELINE.find(p => p.key === s)?.label ?? s; }
  docProgress(tx: any) {
    if (!tx.documents?.length) return 0;
    const done = tx.documents.filter((d: any) => ['Signed','Received','NotRequired'].includes(d.status)).length;
    return Math.round((done / tx.documents.length) * 100);
  }
  doneDocCount(tx: any) {
    return (tx.documents ?? []).filter((d: any) => ['Signed','Received','NotRequired'].includes(d.status)).length;
  }
  docStatusIcon(s: string) {
    return { Pending: 'hourglass_empty', Sent: 'send', Signed: 'draw', Received: 'inbox', NotRequired: 'block' }[s] ?? 'circle';
  }

  PIPELINE_ORDER = PIPELINE.map(p => p.key);
  isStepDone(current: string, step: string) {
    const ci = this.PIPELINE_ORDER.indexOf(current);
    const si = this.PIPELINE_ORDER.indexOf(step);
    return si <= ci && current !== 'FallThrough';
  }

  openForm(tx: any) {
    if (tx) {
      this.form.patchValue({
        clientId: tx.clientId, type: tx.type, address: tx.address, listingKey: tx.listingKey,
        status: tx.status, salePrice: tx.salePrice, commissionRate: tx.commissionRate,
        commissionExpected: tx.commissionExpected, commissionReceived: tx.commissionReceived,
        closingDate: tx.closingDate ? tx.closingDate.substring(0,10) : '',
        offerDate: tx.offerDate ? tx.offerDate.substring(0,10) : '',
        contractDate: tx.contractDate ? tx.contractDate.substring(0,10) : '',
        inspectionDate: tx.inspectionDate ? tx.inspectionDate.substring(0,10) : '',
        appraisalDate: tx.appraisalDate ? tx.appraisalDate.substring(0,10) : '',
        notes: tx.notes ?? '',
      });
    } else {
      this.form.reset({ type: 'BuyerRepresentation', status: 'Prospecting' });
    }
    import('@angular/material/dialog').then(({ MatDialogRef }) => {});
    const ref = this.dialog.open(this._formDialogRef!, { data: { tx }, disableClose: false, width: '95vw', maxWidth: '640px', maxHeight: '95dvh' });
  }

  saveTransaction(existing: any) {
    const v = this.form.value;
    const payload = {
      clientId: v.clientId!, type: v.type!, address: v.address || null,
      listingKey: v.listingKey || null, status: v.status!,
      salePrice: v.salePrice || null, commissionRate: v.commissionRate || null,
      commissionExpected: v.commissionExpected || null, commissionReceived: v.commissionReceived || null,
      closingDate: v.closingDate || null, offerDate: v.offerDate || null,
      contractDate: v.contractDate || null, inspectionDate: v.inspectionDate || null,
      appraisalDate: v.appraisalDate || null, notes: v.notes || null,
    };
    const obs = existing ? this.api.updateTransaction(existing.id, payload) : this.api.createTransaction(payload);
    obs.subscribe({
      next: () => { this.load(); this.dialog.closeAll(); this.snack.open(existing ? 'Updated' : 'Transaction created', 'OK', { duration: 3000 }); },
      error: () => this.snack.open('Error saving transaction', 'OK', { duration: 3000 })
    });
  }

  openDetail(tx: any) {
    if (this._wasDragged) { this._wasDragged = false; return; }
    this.api.getTransaction(tx.id).subscribe(full => {
      this.dialog.open(this._detailDialogRef!, { data: { tx: full }, width: '95vw', maxWidth: '720px', maxHeight: '95dvh' });
    });
  }

  moveStage(tx: any, status: string) {
    this.api.updateTransactionStatus(tx.id, status).subscribe(() => {
      tx.status = status;
      this.load();
    });
  }

  deleteTransaction(tx: any) {
    if (!confirm(`Delete transaction for ${tx.clientName}?`)) return;
    this.api.deleteTransaction(tx.id).subscribe(() => { this.load(); this.dialog.closeAll(); });
  }

  openAddDoc(tx: any) {
    this.docForm.reset({ status: 'Pending' });
    this.dialog.open(this._addDocDialogRef!, { data: { tx }, width: '95vw', maxWidth: '380px', maxHeight: '95dvh' });
  }

  saveDoc(tx: any) {
    const v = this.docForm.value;
    this.api.addTransactionDoc(tx.id, { name: v.name!, status: v.status!, dueDate: v.dueDate || null, notes: v.notes || null })
      .subscribe(() => {
        this.dialog.closeAll();
        this.openDetail(tx);
        this.load();
      });
  }

  setDocStatus(tx: any, doc: any, status: string) {
    this.api.updateTransactionDoc(tx.id, doc.id, { name: doc.name, status, dueDate: doc.dueDate, notes: doc.notes })
      .subscribe(() => { doc.status = status; });
  }

  deleteDoc(tx: any, doc: any) {
    this.api.deleteTransactionDoc(tx.id, doc.id).subscribe(() => {
      tx.documents = tx.documents.filter((d: any) => d.id !== doc.id);
    });
  }

  private _wasDragged = false;

  onDragStarted() { this._wasDragged = true; }

  onDrop(event: CdkDragDrop<any[]>, targetStage: string) {
    if (event.previousContainer === event.container) { this._wasDragged = false; return; }
    this.moveStage(event.item.data, targetStage);
    this._wasDragged = false;
  }

  // Template refs — set via ViewChild in a real component; here we use dialog.open with inline refs
  @ViewChild('formDialog') _formDialogRef!: TemplateRef<any>;
  @ViewChild('detailDialog') _detailDialogRef!: TemplateRef<any>;
  @ViewChild('addDocDialog') _addDocDialogRef!: TemplateRef<any>;
}
