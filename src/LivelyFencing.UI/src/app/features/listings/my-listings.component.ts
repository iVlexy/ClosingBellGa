import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatChipsModule],
  template: `
    <div class="my-listings-nav">
      <a routerLink="/portal/listings" class="nav-back">
        <mat-icon>arrow_back</mat-icon> Back to Search
      </a>
    </div>

    <!-- Guest wall -->
    <div class="guest-wall" *ngIf="!isLoggedIn()">
      <mat-icon>favorite_border</mat-icon>
      <h2>Sign in to view saved listings</h2>
      <p>Create a free account to save your favorites and track properties you love.</p>
      <a mat-flat-button class="sign-in-btn" href="/">Sign In</a>
    </div>

    <div class="page-wrap" *ngIf="isLoggedIn()">
      <div class="page-header">
        <h1><mat-icon>favorite</mat-icon> My Saved Listings</h1>
        <p class="page-sub">Properties you\'ve liked or passed on</p>
      </div>

      <div class="spinner-wrap" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="!loading()">
        <!-- Liked -->
        <section *ngIf="liked().length > 0">
          <h2 class="section-head"><mat-icon class="like-icon">favorite</mat-icon> Liked ({{ liked().length }})</h2>
          <div class="listing-grid">
            <div class="listing-card" *ngFor="let p of liked()"
                 [routerLink]="[\'/portal/listings\', p.listingKey]">
              <div class="card-photo">
                <img [src]="api.getListingPhotoUrl(p.listingPhotoUrl)" [alt]="p.listingAddress" (error)="onImgError($event)" loading="lazy">
                <span class="like-badge"><mat-icon>favorite</mat-icon></span>
              </div>
              <div class="card-body">
                <div class="card-price">{{ p.listingPrice | currency:\'USD\':\'symbol\':\'1.0-0\' }}</div>
                <div class="card-addr">{{ p.listingAddress }}</div>
                <div class="card-city">{{ p.listingCity }}</div>
                <div class="card-notes" *ngIf="p.notes">
                  <mat-icon>notes</mat-icon> {{ p.notes }}
                </div>
                <button mat-stroked-button class="remove-btn" (click)="remove($event, p)">
                  <mat-icon>close</mat-icon> Remove
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Disliked -->
        <section *ngIf="disliked().length > 0" style="margin-top: 40px">
          <h2 class="section-head"><mat-icon class="pass-icon">thumb_down</mat-icon> Passed On ({{ disliked().length }})</h2>
          <div class="listing-grid">
            <div class="listing-card passed" *ngFor="let p of disliked()"
                 [routerLink]="[\'/portal/listings\', p.listingKey]">
              <div class="card-photo">
                <img [src]="api.getListingPhotoUrl(p.listingPhotoUrl)" [alt]="p.listingAddress" (error)="onImgError($event)" loading="lazy">
                <span class="pass-badge"><mat-icon>thumb_down</mat-icon></span>
              </div>
              <div class="card-body">
                <div class="card-price">{{ p.listingPrice | currency:\'USD\':\'symbol\':\'1.0-0\' }}</div>
                <div class="card-addr">{{ p.listingAddress }}</div>
                <div class="card-city">{{ p.listingCity }}</div>
                <button mat-stroked-button class="remove-btn" (click)="remove($event, p)">
                  <mat-icon>close</mat-icon> Remove
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="empty" *ngIf="liked().length === 0 && disliked().length === 0">
          <mat-icon>home_work</mat-icon>
          <p>You haven\'t saved any listings yet.</p>
          <a mat-flat-button class="browse-btn" routerLink="/portal/listings">Browse Listings</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .my-listings-nav {
      background: color-mix(in srgb, #1A3A2A 45%, black);
      padding: 10px 20px; display: flex; align-items: center;
    }
    .nav-back {
      display: flex; align-items: center; gap: 4px;
      color: rgba(255,255,255,.8); text-decoration: none;
      font-size: 14px; font-weight: 500;
    }
    .nav-back:hover { color: #C9A96E; }
    .nav-back mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .guest-wall {
      min-height: 80vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; text-align: center;
      padding: 40px 24px;
    }
    .guest-wall mat-icon { font-size: 56px; width: 56px; height: 56px; color: #C9A96E; margin-bottom: 16px; }
    .guest-wall h2 { font-size: 24px; color: #1A3A2A; margin: 0 0 10px; }
    .guest-wall p { color: #666; max-width: 360px; line-height: 1.6; margin: 0 0 24px; }
    .sign-in-btn { background: #1A3A2A !important; color: #fff !important; padding: 0 28px; height: 44px; border-radius: 8px; }

    .page-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 20px 64px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { display: flex; align-items: center; gap: 10px; font-size: 28px; font-weight: 700; color: #1A3A2A; margin: 0 0 4px; }
    .page-header h1 mat-icon { color: #E53935; font-size: 30px; width: 30px; height: 30px; }
    .page-sub { color: #888; margin: 0; }

    .spinner-wrap { display: flex; justify-content: center; padding: 64px 0; }

    .section-head { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #333; margin: 0 0 16px; }
    .like-icon { color: #E53935; }
    .pass-icon { color: #777; }

    .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

    .listing-card {
      border-radius: 12px; overflow: hidden; background: #fff; cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
      transition: transform .2s, box-shadow .2s;
    }
    .listing-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.13); }
    .listing-card.passed { opacity: .75; }
    .listing-card.passed:hover { opacity: 1; }

    .card-photo { position: relative; height: 190px; overflow: hidden; }
    .card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }

    .like-badge, .pass-badge {
      position: absolute; top: 10px; right: 10px;
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
    .like-badge { background: #E53935; }
    .like-badge mat-icon { color: #fff; font-size: 18px; width: 18px; height: 18px; }
    .pass-badge { background: #555; }
    .pass-badge mat-icon { color: #fff; font-size: 18px; width: 18px; height: 18px; }

    .card-body { padding: 14px 16px; }
    .card-price { font-size: 20px; font-weight: 700; color: #1A3A2A; margin-bottom: 3px; }
    .card-addr { font-size: 13px; font-weight: 500; color: #111; }
    .card-city { font-size: 12px; color: #777; margin-bottom: 10px; }
    .card-notes { display: flex; align-items: flex-start; gap: 4px; font-size: 12px; color: #555; margin-bottom: 10px; font-style: italic; }
    .card-notes mat-icon { font-size: 15px; width: 15px; height: 15px; color: #aaa; flex-shrink: 0; margin-top: 1px; }
    .remove-btn { font-size: 12px; color: #aaa !important; border-color: #ddd !important; height: 32px; line-height: 32px; }
    .remove-btn mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .empty { text-align: center; padding: 80px 0; color: #999; }
    .empty mat-icon { font-size: 60px; width: 60px; height: 60px; display: block; margin: 0 auto 12px; }
    .empty p { margin-bottom: 20px; }
    .browse-btn { background: #1A3A2A !important; color: #fff !important; border-radius: 8px; padding: 0 24px; height: 42px; }

    @media (max-width: 599px) {
      .listing-grid { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 22px; }
    }
  `]
})
export class MyListingsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);

  allPrefs = signal<any[]>([]);
  loading = signal(true);

  liked = () => this.allPrefs().filter(p => p.reaction === 'Like');
  disliked = () => this.allPrefs().filter(p => p.reaction === 'Dislike');

  ngOnInit() {
    if (!this.isLoggedIn()) { this.loading.set(false); return; }
    this.api.getMyListingPreferences().subscribe({
      next: (prefs: any[]) => { this.allPrefs.set(prefs); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  isLoggedIn() { return !!this.auth.currentUser; }

  remove(event: Event, pref: any) {
    event.stopPropagation();
    // Optimistically remove from view by re-saving with null reaction via same endpoint
    this.api.reactToListing({
      listingKey: pref.listingKey,
      listingAddress: pref.listingAddress,
      listingCity: pref.listingCity,
      listingPrice: pref.listingPrice,
      listingPhotoUrl: pref.listingPhotoUrl,
      reaction: 'Removed',
      notes: null,
      customerId: null
    }).subscribe(() => {
      this.allPrefs.set(this.allPrefs().filter(p => p.listingKey !== pref.listingKey));
    });
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmMGYwZWIiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDAsMjcwKSIgZmlsbD0iI2QwZDBjOCI+PHJlY3QgeD0iLTU1IiB5PSIwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9Ijc1IiByeD0iMyIvPjxyZWN0IHg9Ii0xOCIgeT0iMzUiIHdpZHRoPSIzNiIgaGVpZ2h0PSI0MCIgZmlsbD0iI2YwZjBlYiIvPjxwb2x5Z29uIHBvaW50cz0iMCwtNzAgLTgwLDAgODAsMCIvPjxyZWN0IHg9IjI1IiB5PSItODAiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzOCIgZmlsbD0iI2QwZDBjOCIvPjwvZz48dGV4dCB4PSI0MDAiIHk9IjM5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LFNlZ29lIFVJLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTciIGZpbGw9IiNhYWEiIGxldHRlci1zcGFjaW5nPSIwLjUiPlBob3RvIHVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
  }
}
