import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-listings-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule, MatCheckboxModule],
  template: `
    <div class="listings-nav">
      <a routerLink="/" class="listings-nav-home">
        <mat-icon>arrow_back</mat-icon> Home
      </a>
      <a *ngIf="isLoggedIn()" routerLink="/portal/my-listings" class="listings-nav-saved">
        <mat-icon>favorite</mat-icon> My Saved Listings
      </a>
    </div>
    <div class="search-hero">
      <div class="hero-inner">
        <h1 class="hero-title">Find Your Next Home</h1>
        <p class="hero-sub">Browse Atlanta metro area properties</p>
        <div class="filter-bar">
          <mat-form-field appearance="outline" class="f-city">
            <mat-label>City, ZIP, or Address</mat-label>
            <input matInput [(ngModel)]="city" (keydown.enter)="doSearch()" placeholder="Atlanta, 30305, 742 Peachtree…">
            <mat-icon matSuffix>location_on</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="f-sm">
            <mat-label>Min Price</mat-label>
            <mat-select [(ngModel)]="minPrice">
              <mat-option [value]="null">Any</mat-option>
              <mat-option [value]="200000">$200k</mat-option>
              <mat-option [value]="300000">$300k</mat-option>
              <mat-option [value]="400000">$400k</mat-option>
              <mat-option [value]="500000">$500k</mat-option>
              <mat-option [value]="600000">$600k</mat-option>
              <mat-option [value]="750000">$750k</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="f-sm">
            <mat-label>Max Price</mat-label>
            <mat-select [(ngModel)]="maxPrice">
              <mat-option [value]="null">Any</mat-option>
              <mat-option [value]="300000">$300k</mat-option>
              <mat-option [value]="400000">$400k</mat-option>
              <mat-option [value]="500000">$500k</mat-option>
              <mat-option [value]="600000">$600k</mat-option>
              <mat-option [value]="750000">$750k</mat-option>
              <mat-option [value]="1000000">$1M+</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="f-xs">
            <mat-label>Min Beds</mat-label>
            <mat-select [(ngModel)]="minBeds">
              <mat-option [value]="null">Any</mat-option>
              <mat-option [value]="1">1+</mat-option>
              <mat-option [value]="2">2+</mat-option>
              <mat-option [value]="3">3+</mat-option>
              <mat-option [value]="4">4+</mat-option>
              <mat-option [value]="5">5+</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="f-xs">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="propType">
              <mat-option value="">Any</mat-option>
              <mat-option value="Single Family Residence">Single Family</mat-option>
              <mat-option value="Condominium">Condo</mat-option>
              <mat-option value="Townhouse">Townhouse</mat-option>
              <mat-option value="Residential Lease">For Rent</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-checkbox [(ngModel)]="hideRentals" (ngModelChange)="doSearch()" class="hide-rentals-cb">Hide rentals</mat-checkbox>
          <button mat-flat-button class="search-btn" (click)="doSearch()">
            <mat-icon>search</mat-icon> Search
          </button>
        </div>
      </div>
    </div>

    <div class="results-wrap">
      <div class="results-row" *ngIf="!loading()">
        <span class="result-count">{{ total() }} {{ total() === 1 ? 'property' : 'properties' }}</span>
        <mat-form-field appearance="outline" class="sort-field">
          <mat-label>Sort by</mat-label>
          <mat-select [(ngModel)]="sortBy" (ngModelChange)="doSearch()">
            <mat-option value="suggested">Suggested</mat-option>
            <mat-option value="agent">Brandon's Listings</mat-option>
            <mat-option value="price-asc">Price: Low → High</mat-option>
            <mat-option value="price-desc">Price: High → Low</mat-option>
            <mat-option value="sqft-desc">Largest First</mat-option>
            <mat-option value="year-desc">Newest Construction</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="spinner-wrap" *ngIf="loading()">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div class="listing-grid" *ngIf="!loading()">
        <div class="listing-card" *ngFor="let l of listings()" [routerLink]="['/listings', l.listingKey]">
          <div class="card-photo">
            <img [src]="api.getListingPhotoUrl(l.photos?.[0])" (error)="onImgError($event)"
                 [alt]="l.unparsedAddress" loading="lazy">
            <span class="status-chip"
              [class.active]="l.standardStatus === 'Active'"
              [class.contract]="l.standardStatus === 'Active Under Contract'"
              [class.soon]="l.standardStatus === 'Coming Soon'">
              {{ l.standardStatus }}
            </span>
            <div class="reaction-btns" (click)="$event.stopPropagation()">
              <button mat-icon-button class="rb like"
                [class.on]="getReaction(l.listingKey) === 'Like'"
                (click)="react(l, 'Like')"
                matTooltip="I like this">
                <mat-icon>{{ getReaction(l.listingKey) === 'Like' ? 'favorite' : 'favorite_border' }}</mat-icon>
              </button>
              <button mat-icon-button class="rb pass"
                [class.on]="getReaction(l.listingKey) === 'Dislike'"
                (click)="react(l, 'Dislike')"
                matTooltip="Not for me">
                <mat-icon>{{ getReaction(l.listingKey) === 'Dislike' ? 'thumb_down' : 'thumb_down_off_alt' }}</mat-icon>
              </button>
            </div>
          </div>
          <div class="card-body">
            <div class="card-price">
              {{ l.listPrice | currency:'USD':'symbol':'1.0-0' }}<span *ngIf="isRental(l)" class="per-mo">/mo</span>
            </div>
            <span *ngIf="isRental(l)" class="rental-badge">For Rent</span>
            <div class="card-addr">{{ l.unparsedAddress }}</div>
            <div class="card-loc">{{ l.city }}, {{ l.stateOrProvince }} {{ l.postalCode }}</div>
            <div class="card-stats">
              <span><mat-icon>bed</mat-icon>{{ l.bedroomsTotal }} bd</span>
              <span><mat-icon>bathtub</mat-icon>{{ l.bathroomsTotalDecimal }} ba</span>
              <span><mat-icon>square_foot</mat-icon>{{ l.livingArea | number }} sqft</span>
            </div>
            <div class="card-subtype">{{ l.propertySubType }}</div>
            <div class="card-office" *ngIf="l.listOfficeName">Listing Courtesy Of {{ l.listOfficeName }}</div>
            <div class="card-mls">MLS# {{ l.listingId }}</div>
          </div>
        </div>
      </div>

      <div class="empty" *ngIf="!loading() && listings().length === 0">
        <mat-icon>home_work</mat-icon>
        <p>No properties match your filters. Try broadening your search.</p>
      </div>

      <div class="pagination" *ngIf="totalPages() > 1 && !loading()">
        <button mat-stroked-button [disabled]="page() === 1" (click)="goTo(page() - 1)">
          <mat-icon>chevron_left</mat-icon> Prev
        </button>
        <span>Page {{ page() }} of {{ totalPages() }}</span>
        <button mat-stroked-button [disabled]="page() === totalPages()" (click)="goTo(page() + 1)">
          Next <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="fmls-disclaimer" *ngIf="!loading()">
        Information Deemed Reliable But Not Guaranteed. If you believe any FMLS Listing contains material that infringes your copyrighted work, please <a href="https://www.fmls.com/dmca" target="_blank" rel="noopener">click here</a> to review our DMCA policy and learn how to submit a takedown request. &copy; FMLS
      </div>
      <div class="broker-disclosure">
        <strong>Willow Bend Properties</strong> &bull; <a href="tel:+16784515205">(678) 451-5205</a> &bull; <a href="mailto:willowbendpropertiesga&#64;gmail.com">willowbendpropertiesga&#64;gmail.com</a><br>
        <span class="tech-entity">Technical contact responsible for this IDX display: Ethan Browning &mdash; <a href="mailto:browningethan23&#64;gmail.com">browningethan23&#64;gmail.com</a></span>
      </div>
    </div>
  `,
  styles: [`
    .listings-nav {
      background: color-mix(in srgb, var(--mat-sys-primary, #1A3A2A) 45%, black);
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .listings-nav-saved {
      display: flex; align-items: center; gap: 4px;
      color: #C9A96E; text-decoration: none;
      font-size: 13px; font-weight: 600;
    }
    .listings-nav-saved mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .listings-nav-home {
      display: flex; align-items: center; gap: 4px;
      color: rgba(255,255,255,.8); text-decoration: none;
      font-size: 14px; font-weight: 500;
    }
    .listings-nav-home:hover { color: #C9A96E; }
    .listings-nav-home mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .search-hero {
      background: linear-gradient(135deg, #1A3A2A 0%, #2D5A3D 65%, #1A3A2A 100%);
      padding: 56px 20px 52px;
    }
    .hero-inner { max-width: 960px; margin: 0 auto; text-align: center; }
    .hero-title { color: #fff; font-size: 38px; font-weight: 700; margin: 0 0 8px; letter-spacing: -.5px; }
    .hero-sub { color: rgba(255,255,255,.7); font-size: 16px; margin: 0 0 36px; }
    .filter-bar { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; align-items: flex-end; }
    .f-city { min-width: 220px; }
    .f-sm { min-width: 140px; }
    .f-xs { min-width: 120px; }
    .filter-bar ::ng-deep .mat-mdc-text-field-wrapper { background: #fff; border-radius: 8px; }
    .filter-bar ::ng-deep label.mdc-floating-label { color: #555 !important; }
    .filter-bar ::ng-deep .mdc-floating-label--float-above { color: rgba(255,255,255,.9) !important; }
    .filter-bar ::ng-deep .mdc-notched-outline__notch { border-color: rgba(255,255,255,.6) !important; }
    .filter-bar ::ng-deep .mdc-notched-outline__leading,
    .filter-bar ::ng-deep .mdc-notched-outline__trailing { border-color: rgba(255,255,255,.3) !important; }
    .filter-bar ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    .filter-bar ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing,
    .filter-bar ::ng-deep .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch { border-color: #C9A96E !important; }
    .filter-bar ::ng-deep .mat-mdc-form-field.mat-focused .mdc-floating-label--float-above { color: #C9A96E !important; }
    .search-btn {
      height: 56px; padding: 0 28px; font-size: 15px;
      background: #C9A96E !important; color: #fff !important;
      border-radius: 8px; margin-bottom: 2px;
    }
    .search-btn mat-icon { margin-right: 6px; }

    .results-wrap { max-width: 1280px; margin: 0 auto; padding: 24px 16px 48px; }
    .results-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .result-count { color: #666; font-size: 14px; }
    .sort-field { min-width: 200px; }
    .spinner-wrap { display: flex; justify-content: center; padding: 64px 0; }

    .listing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 24px; }

    .listing-card {
      border-radius: 12px; overflow: hidden; background: #fff; cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,.08);
      transition: transform .2s, box-shadow .2s;
    }
    .listing-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,.14); }

    .card-photo { position: relative; height: 210px; overflow: hidden; }
    .card-photo img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s; }
    .listing-card:hover .card-photo img { transform: scale(1.04); }

    .status-chip {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
      text-transform: uppercase; letter-spacing: .4px;
      background: rgba(0,0,0,.55); color: #fff;
    }
    .status-chip.active { background: #1A3A2A; }
    .status-chip.contract { background: #C84B00; }
    .status-chip.soon { background: #5C35B0; }

    .reaction-btns {
      position: absolute; bottom: 8px; right: 8px;
      display: flex; gap: 4px;
    }
    .rb { width: 34px; height: 34px; background: rgba(255,255,255,.88) !important; }
    .rb mat-icon { font-size: 19px; width: 19px; height: 19px; color: #aaa; }
    .rb.like.on mat-icon { color: #E53935; }
    .rb.pass.on mat-icon { color: #555; }

    .card-body { padding: 14px 16px; }
    .card-price { font-size: 22px; font-weight: 700; color: #1A3A2A; margin-bottom: 3px; display: flex; align-items: baseline; gap: 2px; }
    .per-mo { font-size: 14px; font-weight: 500; color: #555; }
    .rental-badge { display: inline-block; background: #2a6496; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; padding: 2px 8px; border-radius: 10px; margin-bottom: 4px; }
    .hide-rentals-cb { color: #fff; font-size: 13px; align-self: center; }
    .hide-rentals-cb { font-size: 13px; align-self: center; } .hide-rentals-cb ::ng-deep .mdc-label { color: #fff !important; }
    .card-loc { font-size: 12px; color: #777; margin-bottom: 10px; }
    .card-stats { display: flex; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
    .card-stats span { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #444; }
    .card-stats mat-icon { font-size: 15px; width: 15px; height: 15px; color: #999; }
    .card-subtype { font-size: 11px; color: #C9A96E; font-weight: 500; text-transform: uppercase; letter-spacing: .5px; }

    .empty { text-align: center; padding: 72px 0; color: #999; }
    .empty mat-icon { font-size: 60px; width: 60px; height: 60px; display: block; margin: 0 auto 12px; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 36px; }
    .pagination span { color: #555; }

    .card-office { font-size: 11px; color: #777; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-mls { font-size: 10px; color: #aaa; margin-top: 2px; }
    .fmls-disclaimer { padding: 16px 0 0; margin-top: 24px; font-size: 11px; color: #888; line-height: 1.6; border-top: 1px solid #eee; }
    .fmls-disclaimer a { color: #777; }

    .broker-disclosure { padding: 10px 0 0; margin-top: 8px; font-size: 11px; color: #666; line-height: 1.8; }
    .broker-disclosure a { color: #555; }
    .broker-disclosure strong { color: #444; }
    .tech-entity { color: #999; font-size: 10px; }

    @media (max-width: 599px) {
      .hero-title { font-size: 26px; }
      .filter-bar { flex-direction: column; align-items: stretch; }
      .f-city, .f-sm, .f-xs { min-width: unset; width: 100%; }
      .search-btn { width: 100%; }
      .listing-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ListingsSearchComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  snack = inject(MatSnackBar);

  listings = signal<any[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(false);
  myReactions = signal<Record<string, string>>({});
  sortBy = 'suggested';
  city = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minBeds: number | null = null;
  propType = '';
  hideRentals = true;
  isRental(l: any) { return l.propertyType === 'Residential Lease'; }

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / 12)));

  ngOnInit() {
    this.doSearch();
    if (this.isLoggedIn()) this.loadReactions();
  }

  isLoggedIn() { return !!this.auth.currentUser; }

  doSearch(resetPage = true) {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    const params: any = { page: this.page() };
    if (this.city) params['city'] = this.city;
    if (this.minPrice != null) params['minPrice'] = this.minPrice;
    if (this.maxPrice != null) params['maxPrice'] = this.maxPrice;
    if (this.minBeds != null) params['minBeds'] = this.minBeds;
    if (this.propType) params['propertyType'] = this.propType;
    if (this.sortBy) params['sort'] = this.sortBy;
    this.api.searchListings(params).subscribe({
      next: (res: any) => {
        const all = res.listings ?? [];
        this.listings.set(this.hideRentals ? all.filter((l: any) => l.propertyType !== 'Residential Lease') : all);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => this.loading.set(false)
    });
  }

  goTo(p: number) {
    this.page.set(p);
    this.doSearch(false);
  }

  loadReactions() {
    this.api.getMyListingPreferences().subscribe((prefs: any[]) => {
      const map: Record<string, string> = {};
      prefs.forEach(p => { map[p.listingKey] = p.reaction; });
      this.myReactions.set(map);
    });
  }

  getReaction(key: string) { return this.myReactions()[key]; }


  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmMGYwZWIiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDAsMjcwKSIgZmlsbD0iI2QwZDBjOCI+PHJlY3QgeD0iLTU1IiB5PSIwIiB3aWR0aD0iMTEwIiBoZWlnaHQ9Ijc1IiByeD0iMyIvPjxyZWN0IHg9Ii0xOCIgeT0iMzUiIHdpZHRoPSIzNiIgaGVpZ2h0PSI0MCIgZmlsbD0iI2YwZjBlYiIvPjxwb2x5Z29uIHBvaW50cz0iMCwtNzAgLTgwLDAgODAsMCIvPjxyZWN0IHg9IjI1IiB5PSItODAiIHdpZHRoPSIxOCIgaGVpZ2h0PSIzOCIgZmlsbD0iI2QwZDBjOCIvPjwvZz48dGV4dCB4PSI0MDAiIHk9IjM5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sQmxpbmtNYWNTeXN0ZW1Gb250LFNlZ29lIFVJLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTciIGZpbGw9IiNhYWEiIGxldHRlci1zcGFjaW5nPSIwLjUiPlBob3RvIHVuYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg==';
  }

  react(listing: any, reaction: string) {
    if (!this.isLoggedIn()) {
      const sb = this.snack.open('Sign in to save listings', 'Sign In', { duration: 4000 });
      sb.onAction().subscribe(() => window.location.href = '/cq/dashboard');
      return;
    }
    this.api.reactToListing({
      listingKey: listing.listingKey,
      listingAddress: listing.unparsedAddress,
      listingCity: listing.city,
      listingPrice: listing.listPrice,
      listingPhotoUrl: listing.photos?.[0] ?? null,
      reaction,
      notes: null,
      customerId: null
    }).subscribe(() => this.loadReactions());
  }
}
