import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatTooltipModule, MatSnackBarModule],
  template: `
    <div *ngIf="loading()" class="spinner-wrap"><mat-spinner diameter="48"></mat-spinner></div>

    <div class="detail-page" *ngIf="!loading() && listing()">
      <!-- Nav bar -->
      <div class="detail-nav">
        <a mat-button routerLink="/portal/listings">
          <mat-icon>arrow_back</mat-icon> Back to Search
        </a>
        <span class="status-chip"
          [class.active]="listing().standardStatus === 'Active'"
          [class.contract]="listing().standardStatus === 'Active Under Contract'"
          [class.soon]="listing().standardStatus === 'Coming Soon'">
          {{ listing().standardStatus }}
        </span>
      </div>

      <!-- Photo gallery -->
      <div class="gallery-wrap">
        <div class="gallery-main">
          <img [src]="currentPhoto()" [alt]="listing().unparsedAddress">
          <button mat-icon-button class="gal-btn gal-prev" *ngIf="listing().photos?.length > 1" (click)="prevPhoto()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-icon-button class="gal-btn gal-next" *ngIf="listing().photos?.length > 1" (click)="nextPhoto()">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <div class="photo-counter" *ngIf="listing().photos?.length > 1">
            {{ photoIdx() + 1 }} / {{ listing().photos.length }}
          </div>
        </div>
        <div class="gallery-thumbs" *ngIf="listing().photos?.length > 1">
          <img *ngFor="let p of listing().photos; let i = index"
               [src]="p" [alt]="'Photo ' + (i+1)" loading="lazy"
               [class.active]="i === photoIdx()"
               (click)="photoIdx.set(i)">
        </div>
      </div>

      <!-- Main content -->
      <div class="content-grid">
        <!-- Left: property details -->
        <div class="detail-main">
          <div class="price-row">
            <span class="listing-price">{{ listing().listPrice | currency:'USD':'symbol':'1.0-0' }}</span>
          </div>
          <h1 class="listing-addr">{{ listing().unparsedAddress }}</h1>
          <p class="listing-loc">{{ listing().city }}, {{ listing().stateOrProvince }} {{ listing().postalCode }}</p>

          <div class="stats-grid">
            <div class="stat-box">
              <mat-icon>bed</mat-icon>
              <span class="stat-val">{{ listing().bedroomsTotal }}</span>
              <span class="stat-lbl">Bedrooms</span>
            </div>
            <div class="stat-box">
              <mat-icon>bathtub</mat-icon>
              <span class="stat-val">{{ listing().bathroomsTotalDecimal }}</span>
              <span class="stat-lbl">Bathrooms</span>
            </div>
            <div class="stat-box">
              <mat-icon>square_foot</mat-icon>
              <span class="stat-val">{{ listing().livingArea | number }}</span>
              <span class="stat-lbl">Sq. Ft.</span>
            </div>
            <div class="stat-box">
              <mat-icon>calendar_today</mat-icon>
              <span class="stat-val">{{ listing().yearBuilt }}</span>
              <span class="stat-lbl">Year Built</span>
            </div>
            <div class="stat-box" *ngIf="listing().lotSizeSquareFeet > 0">
              <mat-icon>landscape</mat-icon>
              <span class="stat-val">{{ listing().lotSizeSquareFeet | number }}</span>
              <span class="stat-lbl">Lot Sq. Ft.</span>
            </div>
            <div class="stat-box">
              <mat-icon>home_work</mat-icon>
              <span class="stat-val">{{ listing().propertySubType }}</span>
              <span class="stat-lbl">Type</span>
            </div>
          </div>

          <div class="description-section">
            <h2>About This Property</h2>
            <p class="description-text">{{ listing().publicRemarks }}</p>
          </div>

          <div class="listing-id-row">
            <span class="listing-id">MLS# {{ listing().listingKey }}</span>
            <span class="bridge-note">Data powered by Bridge Data Output / FMLS (demo data)</span>
          </div>
        </div>

        <!-- Right: reaction panel + contact CTA -->
        <div class="detail-sidebar">
          <!-- Reaction panel - authenticated users only -->
          <mat-card class="reaction-card" *ngIf="isLoggedIn()">
            <mat-card-header>
              <mat-card-title>Your Reaction</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="reaction-row">
                <button mat-flat-button class="react-btn like-btn"
                  [class.active]="myReaction() === 'Like'"
                  (click)="setReaction('Like')">
                  <mat-icon>{{ myReaction() === 'Like' ? 'favorite' : 'favorite_border' }}</mat-icon>
                  I Like This
                </button>
                <button mat-flat-button class="react-btn pass-btn"
                  [class.active]="myReaction() === 'Dislike'"
                  (click)="setReaction('Dislike')">
                  <mat-icon>{{ myReaction() === 'Dislike' ? 'thumb_down' : 'thumb_down_off_alt' }}</mat-icon>
                  Not For Me
                </button>
              </div>
              <mat-form-field appearance="outline" style="width:100%; margin-top:12px">
                <mat-label>Notes</mat-label>
                <textarea matInput [(ngModel)]="notes" rows="3"
                  placeholder="What do you love (or not) about this place?"></textarea>
              </mat-form-field>
              <button mat-flat-button color="primary" style="width:100%"
                [disabled]="!pendingReaction"
                (click)="saveReaction()">
                Save Reaction
              </button>
              <p class="saved-msg" *ngIf="saved()">✓ Saved to your preferences</p>
            </mat-card-content>
          </mat-card>

          <!-- Contact CTA -->
          <mat-card class="contact-card">
            <mat-card-header>
              <mat-card-title>Interested?</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="contact-text">
                Ready to tour this property or have questions? Reach out to Brandon today.
              </p>
              <a mat-flat-button color="primary" href="/" style="width:100%; margin-bottom:10px">
                Schedule a Showing
              </a>
              <a mat-stroked-button href="tel:+17705550000" style="width:100%">
                <mat-icon>phone</mat-icon> Call Now
              </a>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <div class="not-found" *ngIf="!loading() && !listing()">
      <mat-icon>home_work</mat-icon>
      <h2>Listing not found</h2>
      <a mat-button routerLink="/portal/listings">← Back to Search</a>
    </div>
  `,
  styles: [`
    .spinner-wrap { display: flex; justify-content: center; padding: 80px 0; }

    .detail-page { max-width: 1200px; margin: 0 auto; padding: 0 0 60px; }

    .detail-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px;
    }
    .detail-nav a { color: #1A3A2A; }

    .status-chip {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      text-transform: uppercase; background: rgba(0,0,0,.55); color: #fff;
    }
    .status-chip.active { background: #1A3A2A; }
    .status-chip.contract { background: #C84B00; }
    .status-chip.soon { background: #5C35B0; }

    .gallery-wrap { padding: 0 20px 20px; }
    .gallery-main {
      position: relative; width: 100%; height: 480px;
      border-radius: 12px; overflow: hidden; background: #111;
    }
    .gallery-main img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gal-btn {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(0,0,0,.5) !important; color: #fff !important;
    }
    .gal-prev { left: 12px; }
    .gal-next { right: 12px; }
    .photo-counter {
      position: absolute; bottom: 12px; right: 14px;
      background: rgba(0,0,0,.55); color: #fff; padding: 3px 10px;
      border-radius: 20px; font-size: 12px;
    }
    .gallery-thumbs {
      display: flex; gap: 8px; margin-top: 10px; overflow-x: auto;
    }
    .gallery-thumbs img {
      width: 80px; height: 56px; object-fit: cover; border-radius: 6px;
      cursor: pointer; opacity: .65; transition: opacity .2s;
    }
    .gallery-thumbs img.active,
    .gallery-thumbs img:hover { opacity: 1; outline: 2px solid #C9A96E; }

    .content-grid {
      display: grid; grid-template-columns: 1fr 340px; gap: 32px;
      padding: 0 20px;
    }

    .price-row { margin-bottom: 4px; }
    .listing-price { font-size: 36px; font-weight: 700; color: #1A3A2A; }
    .listing-addr { font-size: 22px; font-weight: 600; margin: 0 0 4px; }
    .listing-loc { color: #666; margin: 0 0 24px; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px;
    }
    .stat-box {
      background: #f8f8f6; border-radius: 8px; padding: 14px 12px;
      text-align: center;
    }
    .stat-box mat-icon { display: block; margin: 0 auto 4px; color: #C9A96E; }
    .stat-val { display: block; font-size: 17px; font-weight: 600; color: #1A3A2A; }
    .stat-lbl { font-size: 11px; color: #888; text-transform: uppercase; }

    .description-section h2 { font-size: 18px; font-weight: 600; margin: 0 0 10px; color: #1A3A2A; }
    .description-text { color: #444; line-height: 1.7; font-size: 15px; }

    .listing-id-row { margin-top: 20px; display: flex; gap: 16px; flex-wrap: wrap; }
    .listing-id { font-size: 12px; color: #888; }
    .bridge-note { font-size: 11px; color: #bbb; font-style: italic; }

    .reaction-card { margin-bottom: 16px; }
    .reaction-row { display: flex; gap: 10px; }
    .react-btn { flex: 1; }
    .react-btn { display: inline-flex !important; align-items: center !important; gap: 6px !important; font-weight: 600 !important; font-size: 14px !important; border-radius: 8px !important; }
    .like-btn { color: #1A3A2A !important; border: 1.5px solid #1A3A2A !important; background: #fff !important; }
    .like-btn.active { color: #fff !important; background: #E53935 !important; border-color: #E53935 !important; }
    .pass-btn { color: #333 !important; border: 1.5px solid #888 !important; background: #fff !important; }
    .pass-btn.active { color: #fff !important; background: #444 !important; border-color: #444 !important; }
    .saved-msg { color: #1A3A2A; font-size: 13px; margin-top: 8px; }

    .contact-text { color: #555; font-size: 14px; line-height: 1.5; margin-bottom: 16px; }

    .not-found { text-align: center; padding: 80px 20px; }
    .not-found mat-icon { font-size: 60px; width: 60px; height: 60px; color: #ccc; display: block; margin: 0 auto 16px; }
    .not-found h2 { color: #888; margin-bottom: 16px; }

    @media (max-width: 860px) {
      .content-grid { grid-template-columns: 1fr; }
      .gallery-main { height: 280px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .listing-price { font-size: 28px; }
      .listing-addr { font-size: 18px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class ListingDetailComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  snack = inject(MatSnackBar);

  listing = signal<any>(null);
  loading = signal(true);
  photoIdx = signal(0);
  myReaction = signal<string | null>(null);
  notes = '';
  pendingReaction: string | null = null;
  saved = signal(false);

  currentPhoto = computed(() => {
    const l = this.listing();
    if (!l?.photos?.length) return 'https://picsum.photos/seed/default/800/600';
    return l.photos[this.photoIdx()] ?? l.photos[0];
  });

  ngOnInit() {
    const key = this.route.snapshot.params['key'];
    this.api.getListing(key).subscribe({
      next: l => {
        this.listing.set(l);
        this.loading.set(false);
        if (this.isLoggedIn()) this.loadMyReaction(key);
      },
      error: () => this.loading.set(false)
    });
  }

  isLoggedIn() { return !!this.auth.currentUser; }

  prevPhoto() {
    const len = this.listing()?.photos?.length ?? 0;
    if (len > 1) this.photoIdx.set((this.photoIdx() - 1 + len) % len);
  }

  nextPhoto() {
    const len = this.listing()?.photos?.length ?? 0;
    if (len > 1) this.photoIdx.set((this.photoIdx() + 1) % len);
  }

  loadMyReaction(key: string) {
    this.api.getMyListingPreferences().subscribe((prefs: any[]) => {
      const existing = prefs.find(p => p.listingKey === key);
      if (existing) {
        this.myReaction.set(existing.reaction);
        this.notes = existing.notes ?? '';
      }
    });
  }

  setReaction(r: string) {
    this.myReaction.set(r);
    this.pendingReaction = r;
    this.saved.set(false);
  }

  saveReaction() {
    if (!this.pendingReaction) return;
    const l = this.listing();
    this.api.reactToListing({
      listingKey: l.listingKey,
      listingAddress: l.unparsedAddress,
      listingCity: l.city,
      listingPrice: l.listPrice,
      listingPhotoUrl: l.photos?.[0] ?? null,
      reaction: this.pendingReaction,
      notes: this.notes || null,
      customerId: null
    }).subscribe(() => {
      this.saved.set(true);
      this.pendingReaction = null;
    });
  }
}
