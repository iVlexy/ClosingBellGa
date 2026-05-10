import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatButtonModule, MatIconModule,
    MatCardModule, MatTooltipModule, MatTabsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatSnackBarModule, MatChipsModule, MatDialogModule],
  template: `
    <div class="page-container" *ngIf="customer()">
      <div class="page-header">
        <div>
          <a mat-button routerLink="/cq/customers"><mat-icon>arrow_back</mat-icon> Clients</a>
          <h1 class="page-title">{{ customer().name }}</h1>
          <p class="page-subtitle" *ngIf="customer().company">{{ customer().company }}</p>
        </div>
      </div>

      <!-- Contact Info cards row -->
      <div class="info-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Contact Info</mat-card-title></mat-card-header>
          <mat-card-content>
            <p><mat-icon class="inline-icon">email</mat-icon>
              <a [href]="'mailto:' + customer().email">{{ customer().email }}</a>
            </p>
            <p *ngIf="customer().phone"><mat-icon class="inline-icon">phone</mat-icon>
              <a [href]="'tel:' + customer().phone">{{ customer().phone }}</a>
            </p>
            <p *ngIf="customer().billingAddress"><mat-icon class="inline-icon">location_on</mat-icon>
              {{ customer().billingAddress }}
            </p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Tabs -->
      <mat-tab-group animationDuration="150ms" style="margin-top:24px">

        <!-- Activity Notes -->
        <mat-tab label="Activity Notes">
          <div class="tab-content">
            <div class="note-add" [formGroup]="noteForm">
              <mat-form-field appearance="outline" class="note-type-field">
                <mat-label>Type</mat-label>
                <mat-select formControlName="noteType">
                  <mat-option value="General">General</mat-option>
                  <mat-option value="Call">Call</mat-option>
                  <mat-option value="Email">Email</mat-option>
                  <mat-option value="Meeting">Meeting</mat-option>
                  <mat-option value="Showing">Showing</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="note-text-field">
                <mat-label>Add note...</mat-label>
                <textarea matInput formControlName="note" rows="2"></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="addNote()" [disabled]="noteForm.invalid">
                <mat-icon>add</mat-icon> Add
              </button>
            </div>

            <div class="notes-list" *ngIf="notes().length > 0">
              <div class="note-item" *ngFor="let n of notes()">
                <div class="note-header">
                  <span class="note-type-badge" [class]="'nt-' + n.noteType.toLowerCase()">{{n.noteType}}</span>
                  <span class="note-by">{{n.createdByEmail}}</span>
                  <span class="note-date">{{n.createdAt | date:'MMM d, y h:mm a'}}</span>
                  <button mat-icon-button color="warn" (click)="deleteNote(n)" matTooltip="Delete note"
                    style="width:28px;height:28px;line-height:28px">
                    <mat-icon style="font-size:16px">delete</mat-icon>
                  </button>
                </div>
                <div class="note-body">{{n.note}}</div>
              </div>
            </div>
            <div *ngIf="notes().length === 0" class="empty-tab">No notes yet.</div>
          </div>
        </mat-tab>

        <!-- Buyer Search Criteria -->
        <mat-tab label="Buyer Criteria">
          <div class="tab-content" [formGroup]="prefsForm">
            <div class="prefs-grid">
              <div class="prefs-col">
                <h3 class="prefs-group-title">Price Range</h3>
                <div class="form-row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Min Price</mat-label>
                    <span matTextPrefix>$&nbsp;</span>
                    <input matInput type="number" formControlName="minPrice">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Max Price</mat-label>
                    <span matTextPrefix>$&nbsp;</span>
                    <input matInput type="number" formControlName="maxPrice">
                  </mat-form-field>
                </div>
                <h3 class="prefs-group-title">Beds / Baths</h3>
                <div class="form-row-4">
                  <mat-form-field appearance="outline">
                    <mat-label>Min Beds</mat-label>
                    <input matInput type="number" formControlName="minBeds">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Max Beds</mat-label>
                    <input matInput type="number" formControlName="maxBeds">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Min Baths</mat-label>
                    <input matInput type="number" step="0.5" formControlName="minBaths">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Max Baths</mat-label>
                    <input matInput type="number" step="0.5" formControlName="maxBaths">
                  </mat-form-field>
                </div>
              </div>
              <div class="prefs-col">
                <h3 class="prefs-group-title">Location & Type</h3>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Preferred Areas / Zip Codes</mat-label>
                  <textarea matInput formControlName="preferredAreas" rows="2"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Property Types</mat-label>
                  <textarea matInput formControlName="propertyTypes" rows="2"
                    placeholder="e.g. Single Family, Condo, Townhouse"></textarea>
                </mat-form-field>
              </div>
              <div class="prefs-col full-col">
                <h3 class="prefs-group-title">Must-Haves & Deal Breakers</h3>
                <div class="form-row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Must-Haves</mat-label>
                    <textarea matInput formControlName="mustHaves" rows="3"
                      placeholder="e.g. Garage, fenced yard, school district..."></textarea>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Deal Breakers</mat-label>
                    <textarea matInput formControlName="dealBreakers" rows="3"
                      placeholder="e.g. HOA, busy street, more than 30 min to work..."></textarea>
                  </mat-form-field>
                </div>
              </div>
            </div>
            <div class="prefs-actions">
              <span class="prefs-updated" *ngIf="buyerPrefs()">Last updated: {{buyerPrefs().updatedAt | date:'MMM d, y'}}</span>
              <button mat-raised-button color="primary" (click)="savePrefs()">
                <mat-icon>save</mat-icon> Save Criteria
              </button>
            </div>
          </div>
        </mat-tab>

        <!-- Transactions -->
        <mat-tab label="Transactions">
          <div class="tab-content">
            <div *ngIf="clientTransactions().length > 0">
              <div class="tx-item" *ngFor="let tx of clientTransactions()">
                <div class="tx-status-dot" [style.background]="txColor(tx.status)"></div>
                <div class="tx-info">
                  <div class="tx-addr">{{tx.address || 'No address'}}</div>
                  <div class="tx-meta">{{txTypeLabel(tx.type)}} &bull; {{tx.status}}</div>
                </div>
                <div class="tx-comm" *ngIf="tx.commissionExpected">
                  {{tx.commissionExpected | currency:'USD':'symbol':'1.0-0'}}
                </div>
                <div class="tx-close" *ngIf="tx.closingDate">Close: {{tx.closingDate | date:'MMM d, y'}}</div>
              </div>
            </div>
            <div *ngIf="clientTransactions().length === 0" class="empty-tab">No transactions for this client.</div>
            <div style="margin-top:16px">
              <a mat-stroked-button routerLink="/cq/transactions">View All Transactions</a>
            </div>
          </div>
        </mat-tab>

        <!-- Liked / Passed Listings -->
        <mat-tab label="Listings">
          <div class="tab-content">
            <div class="prefs-columns" *ngIf="preferences().length > 0">
              <div class="prefs-col" *ngIf="liked().length > 0">
                <h3 class="prefs-col-title liked-title"><mat-icon>favorite</mat-icon> Liked ({{ liked().length }})</h3>
                <div class="pref-grid">
                  <div class="pref-card" *ngFor="let p of liked()">
                    <img [src]="p.listingPhotoUrl || 'https://picsum.photos/seed/ph/80/60'" [alt]="p.listingAddress" loading="lazy">
                    <div class="pref-info">
                      <div class="pref-addr">{{ p.listingAddress }}</div>
                      <div class="pref-city">{{ p.listingCity }}</div>
                      <div class="pref-price">{{ p.listingPrice | currency:'USD':'symbol':'1.0-0' }}</div>
                    </div>
                    <a mat-icon-button [routerLink]="['/portal/listings', p.listingKey]" matTooltip="View listing">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </div>
                </div>
              </div>
              <div class="prefs-col" *ngIf="disliked().length > 0">
                <h3 class="prefs-col-title passed-title"><mat-icon>thumb_down</mat-icon> Passed ({{ disliked().length }})</h3>
                <div class="pref-grid">
                  <div class="pref-card" *ngFor="let p of disliked()">
                    <img [src]="p.listingPhotoUrl || 'https://picsum.photos/seed/ph/80/60'" [alt]="p.listingAddress" loading="lazy">
                    <div class="pref-info">
                      <div class="pref-addr">{{ p.listingAddress }}</div>
                      <div class="pref-city">{{ p.listingCity }}</div>
                      <div class="pref-price">{{ p.listingPrice | currency:'USD':'symbol':'1.0-0' }}</div>
                    </div>
                    <a mat-icon-button [routerLink]="['/portal/listings', p.listingKey]" matTooltip="View listing">
                      <mat-icon>open_in_new</mat-icon>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="preferences().length === 0" class="empty-tab">Client hasn't reacted to any listings yet.</div>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; padding-top: 28px; }
    .page-title { font-size: 24px; font-weight: 500; color: #1A3A2A; margin: 4px 0 0; }
    .page-subtitle { color: #666; margin: 2px 0 0; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .inline-icon { font-size: 16px; width: 16px; height: 16px; vertical-align: middle; margin-right: 6px; color: #555; }
    a { color: #1A3A2A; }
    .tab-content { padding: 20px 0; }
    /* Notes */
    .note-add { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 20px; }
    .note-type-field { width: 130px; flex-shrink: 0; }
    .note-text-field { flex: 1; }
    .notes-list { display: flex; flex-direction: column; gap: 10px; }
    .note-item { background: #f9f9f7; border-radius: 8px; padding: 12px 14px; }
    .note-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .note-type-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
    .nt-general { background: #e3f2fd; color: #1565C0; }
    .nt-call { background: #e8f5e9; color: #2E7D32; }
    .nt-email { background: #f3e5f5; color: #6A1B9A; }
    .nt-meeting { background: #fff3e0; color: #E65100; }
    .nt-showing { background: #fce4ec; color: #880E4F; }
    .note-by { font-size: 12px; color: #888; flex: 1; }
    .note-date { font-size: 11px; color: #aaa; }
    .note-body { font-size: 13px; color: #444; white-space: pre-wrap; line-height: 1.5; }
    /* Buyer Prefs */
    .prefs-grid { display: flex; flex-wrap: wrap; gap: 20px; }
    .prefs-col { flex: 1; min-width: 260px; }
    .full-col { flex-basis: 100%; }
    .prefs-group-title { font-size: 13px; font-weight: 600; color: #1A3A2A; margin: 0 0 8px; text-transform: uppercase; letter-spacing: .5px; }
    .form-row-2 { display: flex; gap: 10px; }
    .form-row-2 mat-form-field { flex: 1; }
    .form-row-4 { display: flex; gap: 8px; }
    .form-row-4 mat-form-field { flex: 1; }
    .full { width: 100%; }
    .prefs-actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; margin-top: 12px; }
    .prefs-updated { font-size: 12px; color: #888; }
    /* Transactions */
    .tx-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9f9f7; border-radius: 8px; margin-bottom: 8px; }
    .tx-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .tx-info { flex: 1; }
    .tx-addr { font-weight: 600; font-size: 13px; }
    .tx-meta { font-size: 12px; color: #888; }
    .tx-comm { font-size: 13px; font-weight: 600; color: #2E7D32; }
    .tx-close { font-size: 12px; color: #1565C0; white-space: nowrap; }
    .empty-tab { color: #bbb; text-align: center; padding: 32px; font-size: 14px; }
    /* Listings */
    .prefs-columns { display: flex; gap: 24px; flex-wrap: wrap; }
    .prefs-col-title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 6px; margin: 0 0 10px; }
    .liked-title { color: #E53935; }
    .liked-title mat-icon, .passed-title mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .passed-title { color: #666; }
    .pref-grid { display: flex; flex-direction: column; gap: 10px; }
    .pref-card { display: flex; align-items: center; gap: 10px; background: #f9f9f7; border-radius: 8px; padding: 8px 12px; }
    .pref-card img { width: 72px; height: 52px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
    .pref-info { flex: 1; min-width: 0; }
    .pref-addr { font-size: 13px; font-weight: 500; color: #222; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pref-city { font-size: 11px; color: #888; }
    .pref-price { font-size: 13px; font-weight: 600; color: #1A3A2A; }
    @media (max-width: 600px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .info-grid { grid-template-columns: 1fr; }
      .note-add { flex-direction: column; }
      .note-type-field { width: 100%; }
      .form-row-2 { flex-direction: column; gap: 0; }
      .form-row-4 { flex-direction: column; gap: 0; }
      .prefs-grid { flex-direction: column; }
      .prefs-actions { flex-direction: column; align-items: stretch; }
      .prefs-actions button { width: 100%; }
      .tx-item { flex-wrap: wrap; gap: 8px; }
    }
  `]
})
export class CustomerDetailComponent implements OnInit {
  api = inject(ApiService);
  private dialog = inject(MatDialog);
  snack = inject(MatSnackBar);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);

  customer = signal<any>(null);
  preferences = signal<any[]>([]);
  notes = signal<any[]>([]);
  leadCreated = signal(false);
  buyerPrefs = signal<any>(null);
  clientTransactions = signal<any[]>([]);

  liked = computed(() => this.preferences().filter(p => p.reaction === 'Like'));
  disliked = computed(() => this.preferences().filter(p => p.reaction === 'Dislike'));

  noteForm = this.fb.group({ note: ['', Validators.required], noteType: ['General'] });
  prefsForm = this.fb.group({
    minPrice: [null as number | null], maxPrice: [null as number | null],
    minBeds: [null as number | null], maxBeds: [null as number | null],
    minBaths: [null as number | null], maxBaths: [null as number | null],
    preferredAreas: [''], propertyTypes: [''],
    mustHaves: [''], dealBreakers: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.api.getCustomer(id).subscribe(c => this.customer.set(c));
    this.api.getListingPreferences(id).subscribe(p => this.preferences.set(p));
    this.api.getClientNotes(id).subscribe(n => this.notes.set(n));
    this.api.getTransactions(id).subscribe(t => this.clientTransactions.set(t));
    this.api.getBuyerPreferences(id).subscribe(p => {
      if (p) {
        this.buyerPrefs.set(p);
        this.prefsForm.patchValue(p);
      }
    });
  }

  addNote() {
    const v = this.noteForm.value;
    const id = this.route.snapshot.params['id'];
    this.api.createClientNote({ clientId: id, note: v.note!, noteType: v.noteType! }).subscribe(n => {
      this.notes.update(arr => [n, ...arr]);
      this.noteForm.patchValue({ note: '' });
    });
  }

  deleteNote(n: any) {
    this.api.deleteClientNote(n.id).subscribe(() => {
      this.notes.update(arr => arr.filter(x => x.id !== n.id));
    });
  }

  savePrefs() {
    const id = this.route.snapshot.params['id'];
    this.api.saveBuyerPreferences(id, this.prefsForm.value).subscribe(p => {
      this.buyerPrefs.set(p);
      this.snack.open('Buyer criteria saved', 'OK', { duration: 2000 });
    });
  }

  txColor(status: string) {
    const map: any = { Prospecting: '#607d8b', OfferSubmitted: '#1565C0', UnderContract: '#6A1B9A',
      Inspection: '#E65100', Appraisal: '#BF360C', ClearToClose: '#558B2F', Closed: '#2E7D32', FallThrough: '#c62828' };
    return map[status] ?? '#607d8b';
  }

  txTypeLabel(t: string) {
    return { BuyerRepresentation: 'Buyer', SellerRepresentation: 'Seller', Dual: 'Dual' }[t] ?? t;
  }
  createLead() {
    const c = this.customer();
    if (!c) return;
    this.api.createManualLead({
      name:    c.name,
      email:   c.email,
      phone:   c.phone ?? '',
      message: 'Lead created from existing client record.',
      source:  'CRM'
    }).subscribe({
      next: (lead: any) => {
        // Link the lead to this customer so it shows as converted
        this.api.markLeadConverted(lead.id, c.id).subscribe();
        this.leadCreated.set(true);
        this.snack.open('Lead created and linked to this client', 'OK', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to create lead', 'Dismiss', { duration: 3000 })
    });
  }

}
