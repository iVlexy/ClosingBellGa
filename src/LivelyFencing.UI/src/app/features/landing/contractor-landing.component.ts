import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { TenantService } from '../../core/services/tenant.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contractor-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="landing-page">

      <!-- NAV -->
      <nav class="top-nav">
        <div class="nav-brand">
          <mat-icon class="brand-icon">{{ tenant.config.icon }}</mat-icon>
          <span class="brand-name">{{ tenant.config.businessName }}</span>
        </div>
        <div class="nav-actions">
          <a href="#quote-form" class="nav-link" *ngIf="!isCustomer">Request a Quote</a>
          <a href="#services" class="nav-link" *ngIf="!isCustomer">Services</a>
          <a href="#leave-review" class="nav-link" *ngIf="!isCustomer">Leave a Review</a>
          <a href="#my-quotes" class="nav-link quotes-link" *ngIf="isCustomer">
            <mat-icon class="nav-icon">description</mat-icon> My Quotes
            <span class="quote-badge" *ngIf="pendingQuoteCount > 0">{{ pendingQuoteCount }}</span>
          </a>
          <span class="nav-greeting" *ngIf="isCustomer">Hi, {{ currentUser?.name?.split(' ')[0] }}</span>
          <button mat-stroked-button class="logout-btn" (click)="logout()" *ngIf="isCustomer">
            <mat-icon>logout</mat-icon> Logout
          </button>
          <button mat-stroked-button class="login-btn" (click)="login()" *ngIf="!isCustomer">
            <mat-icon>login</mat-icon> Login
          </button>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge">Exterior Contracting &amp; Property Services</div>
          <h1 class="hero-title">Lookin' Lively &mdash;<br>Built to Last.</h1>
          <p class="hero-sub">From fencing and landscaping to full exterior transformations — we design, install, and maintain beautiful outdoor spaces for residential and commercial properties.</p>
          <div class="hero-actions">
            <a href="#quote-form" mat-raised-button class="cta-btn">
              <mat-icon>request_quote</mat-icon>
              Get a Free Quote
            </a>
            <a href="#services" mat-stroked-button class="outline-btn">Our Services</a>
          </div>
          <div class="hero-stats">
            <div class="stat"><span class="stat-num">500+</span><span class="stat-label">Projects Completed</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-num">25+</span><span class="stat-label">Years Experience</span></div>
            <div class="stat-divider"></div>
            <div class="stat"><span class="stat-num">100%</span><span class="stat-label">Satisfaction Guaranteed</span></div>
          </div>
        </div>
        <div class="hero-carousel">
          <div class="carousel-track" [style.transform]="carouselTransform">
            <img *ngFor="let img of carouselImages" [src]="img" alt="Lookin' Lively work" class="carousel-img" loading="lazy">
          </div>
          <button class="carousel-arrow carousel-prev" (click)="carouselPrev()" aria-label="Previous">&#8249;</button>
          <button class="carousel-arrow carousel-next" (click)="carouselNext()" aria-label="Next">&#8250;</button>
          <div class="carousel-dots">
            <span *ngFor="let img of carouselImages; let i = index"
              class="carousel-dot" [class.active]="i === carouselIndex"
              (click)="carouselIndex = i"></span>
          </div>
        </div>
        <div class="hero-visual">
          <div class="fence-graphic">
            <div class="fence-post" *ngFor="let p of posts"></div>
          </div>
          <mat-icon class="hero-icon">fence</mat-icon>
        </div>
      </section>

      <!-- SERVICES -->
      <section class="services" id="services">
        <div class="section-header">
          <h2>What We Do</h2>
          <p>Quality fencing solutions for every need and budget</p>
        </div>
        <div class="services-grid">
          <div class="service-card" *ngFor="let s of services">
            <div class="service-icon-wrap">
              <mat-icon>{{ s.icon }}</mat-icon>
            </div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.description }}</p>
          </div>
        </div>
      </section>

      <!-- WHY US -->
      <section class="why-us">
        <div class="section-header light">
          <h2>Why Choose Lookin' Lively Exterior Solutions?</h2>
        </div>
        <div class="why-grid">
          <div class="why-item" *ngFor="let w of whyUs">
            <mat-icon class="why-icon">{{ w.icon }}</mat-icon>
            <div>
              <h4>{{ w.title }}</h4>
              <p>{{ w.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- REVIEWS -->
      <section class="reviews-section" id="reviews">
        <div class="section-header">
          <h2>What Our Customers Say</h2>
          <p>Real reviews from real customers</p>
        </div>

        <!-- Star summary -->
        <div class="reviews-summary" *ngIf="reviews.length > 0">
          <div class="avg-rating">{{ avgRating | number:'1.1-1' }}</div>
          <div class="avg-stars">
            <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= roundedAvg">★</span>
          </div>
          <div class="avg-label">Based on {{ reviews.length }} review{{ reviews.length === 1 ? '' : 's' }}</div>
        </div>

        <!-- Review cards -->
        <div class="reviews-grid" *ngIf="reviews.length > 0">
          <div class="review-card" *ngFor="let r of reviews">
            <div class="review-stars">
              <span *ngFor="let s of [1,2,3,4,5]" class="star" [class.filled]="s <= r.rating">★</span>
            </div>
            <p class="review-comment">"{{ r.comment }}"</p>
            <div class="review-author">— {{ r.reviewerName }}</div>
          </div>
        </div>

      </section>

      <!-- QUOTE FORM -->
      <section class="quote-section" id="quote-form">
        <div class="quote-inner">
          <div class="quote-copy">
            <h2>Ready to Get Started?</h2>
            <p>Fill out the form and we'll reach out within one business day with a free estimate.</p>
            <ul class="quote-perks">
              <li><mat-icon>check_circle</mat-icon> Free, no-obligation estimate</li>
              <li><mat-icon>check_circle</mat-icon> On-site measurement & consultation</li>
              <li><mat-icon>check_circle</mat-icon> Detailed written quote</li>
              <li><mat-icon>check_circle</mat-icon> Flexible scheduling</li>
            </ul>
          </div>
          <div class="quote-form-card" *ngIf="!submitted">
            <h3>Request a Quote</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name *</mat-label>
                <input matInput formControlName="name" placeholder="Jane Smith">
                <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address *</mat-label>
                <input matInput formControlName="email" type="email" placeholder="jane@example.com">
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone" placeholder="(555) 555-5555">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tell us about your project</mat-label>
                <textarea matInput formControlName="message" rows="4"
                  placeholder="Type of fence, approximate length, property address, timeline..."></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit"
                class="submit-btn" [disabled]="form.invalid || submitting">
                <mat-spinner diameter="18" *ngIf="submitting" class="btn-spinner"></mat-spinner>
                <mat-icon *ngIf="!submitting">send</mat-icon>
                {{ submitting ? 'Sending...' : 'Send My Request' }}
              </button>
            </form>
          </div>
          <div class="quote-success" *ngIf="submitted">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h3>We got your request!</h3>
            <p>Thanks, <strong>{{ form.get('name')?.value }}</strong>! We'll reach out to <strong>{{ form.get('email')?.value }}</strong> within one business day.</p>
            <button mat-stroked-button (click)="submitted = false">Submit Another Request</button>
          </div>
        </div>
      </section>

      <!-- MY QUOTES (Customer) -->
      <section class="my-quotes-section" id="my-quotes" *ngIf="isCustomer">
        <div class="section-header">
          <h2>My Quotes</h2>
          <p>Your quotes from Lookin' Lively Exterior Solutions</p>
        </div>
        <div class="quotes-loading" *ngIf="quotesLoading">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <div class="quotes-empty" *ngIf="!quotesLoading && myQuotes.length === 0">
          <mat-icon class="empty-icon">description</mat-icon>
          <p>No quotes yet. We'll notify you when your quote is ready!</p>
        </div>
        <div class="quotes-list" *ngIf="!quotesLoading && myQuotes.length > 0">
          <div class="quote-card" *ngFor="let q of myQuotes" (click)="openQuote(q)">
            <div class="quote-card-header">
              <div class="quote-id">#{{ q.id?.toString()?.slice(0,8)?.toUpperCase() }}</div>
              <span class="status-chip" [ngClass]="'status-' + q.status?.toLowerCase()">{{ q.status }}</span>
            </div>
            <div class="quote-card-body">
              <div class="quote-detail-row">
                <mat-icon>work</mat-icon>
                <span>{{ q.job?.description || 'Fencing Project' }}</span>
              </div>
              <div class="quote-detail-row" *ngIf="q.totalAmount">
                <mat-icon>attach_money</mat-icon>
                <span>{{ q.totalAmount | currency }}</span>
              </div>
              <div class="quote-detail-row" *ngIf="q.createdAt">
                <mat-icon>calendar_today</mat-icon>
                <span>{{ q.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="quote-detail-row" *ngIf="q.validUntil && q.status === 'Sent'">
                <mat-icon>schedule</mat-icon>
                <span>Valid until {{ q.validUntil | date:'mediumDate' }}</span>
              </div>
            </div>
            <div class="quote-card-footer">
              <button mat-stroked-button color="primary" class="view-btn">
                <mat-icon>open_in_new</mat-icon> View Details
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-review-wrap" id="leave-review">
            <h3 class="footer-rv-title">Leave a Review</h3>
            <p class="footer-rv-sub">Had work done by us? We’d love to hear from you.</p>
          <div class="leave-review-card" *ngIf="!reviewSubmitted">
            <div class="star-picker">
              <span *ngFor="let s of [1,2,3,4,5]"
                class="star pick-star"
                [class.filled]="s <= reviewForm.rating"
                (click)="reviewForm.rating = s"
                (mouseenter)="reviewHover = s"
                (mouseleave)="reviewHover = 0"
                [class.hovered]="s <= reviewHover">★</span>
            </div>
            <div class="review-fields">
              <input class="rv-input" placeholder="Your name *" [(ngModel)]="reviewForm.reviewerName">
              <input class="rv-input" placeholder="Email (optional)" [(ngModel)]="reviewForm.reviewerEmail">
              <textarea class="rv-input rv-textarea" placeholder="Tell us about your experience *" [(ngModel)]="reviewForm.comment" rows="4"></textarea>
            </div>
            <button mat-raised-button class="rv-submit-btn" (click)="submitReview()" [disabled]="reviewSubmitting || !reviewForm.reviewerName || !reviewForm.comment || reviewForm.rating === 0">
              <mat-spinner diameter="16" *ngIf="reviewSubmitting" class="btn-spinner"></mat-spinner>
              {{ reviewSubmitting ? 'Submitting...' : 'Submit Review' }}
            </button>
          </div>
          <div class="review-success" *ngIf="reviewSubmitted">
            <mat-icon class="success-icon">thumb_up</mat-icon>
            <h3>Thank you!</h3>
            <p>Your review has been submitted and will appear after approval.</p>
          </div>
          </div>
          <hr class="footer-divider">
          <div class="footer-brand">
            <mat-icon>fence</mat-icon>
            <span>{{ tenant.config.businessName }}</span>
          </div>
          <p class="footer-tagline">Quality fencing. Honest pricing. Built to last.</p>
          <p class="footer-copy">&copy; {{ year }} Lookin' Lively Exterior Solutions. All rights reserved.</p>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    /* Reset for full-page */
    :host { display: block; }
    .landing-page { font-family: 'Roboto', sans-serif; color: #212121; background: #fff; }
    * { box-sizing: border-box; }

    /* NAV */
    .top-nav {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 48px; background: #fff; border-bottom: 1px solid #E8F5E9;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { color: #2E7D32; font-size: 28px; width: 28px; height: 28px; }
    .brand-name { font-size: 20px; font-weight: 700; color: #1B5E20; letter-spacing: -.3px; }
    .nav-actions { display: flex; gap: 24px; align-items: center; }
    .nav-greeting { font-size: 14px; color: #555; font-weight: 500; }
    .nav-icon { font-size: 18px; width: 18px; height: 18px; vertical-align: middle; margin-right: 2px; }
    .quotes-link { display: flex; align-items: center; gap: 4px; position: relative; }
    .quote-badge { background: #2E7D32; color: #fff; border-radius: 10px; font-size: 11px; font-weight: 700; padding: 1px 6px; }
    .logout-btn { color: #c62828 !important; border-color: #c62828 !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; }
    .nav-link { color: #2E7D32; text-decoration: none; font-weight: 500; font-size: 14px; transition: color .2s; }
    .nav-link:hover { color: #1B5E20; }
    .login-btn { color: #2E7D32 !important; border-color: #2E7D32 !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; }

    /* HERO */
    .hero {
      display: flex; align-items: center; justify-content: space-between;
      padding: 80px 48px; background: linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 60%, #C8E6C9 100%);
      min-height: 620px; gap: 40px;
    }
    .hero-content { max-width: 560px; }
    .hero-badge {
      display: inline-block; background: #2E7D32; color: #fff;
      font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
      padding: 4px 14px; border-radius: 20px; margin-bottom: 20px;
    }
    .hero-title { font-size: 52px; font-weight: 800; line-height: 1.1; color: #1B5E20; margin: 0 0 20px; }
    .hero-sub { font-size: 17px; color: #555; line-height: 1.7; margin: 0 0 32px; }
    .hero-actions { display: flex; gap: 16px; align-items: center; margin-bottom: 40px; flex-wrap: wrap; }
    .cta-btn {
      background: #2E7D32 !important; color: #fff !important;
      padding: 12px 28px !important; font-size: 15px !important; font-weight: 600 !important;
      border-radius: 6px !important; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 14px rgba(46,125,50,.35) !important;
    }
    .cta-btn:hover { background: #1B5E20 !important; }
    .outline-btn {
      color: #2E7D32 !important; border: 2px solid #2E7D32 !important;
      padding: 10px 24px !important; font-size: 15px !important; font-weight: 600 !important;
      border-radius: 6px !important; text-decoration: none; display: inline-block;
    }
    .hero-stats { display: flex; align-items: center; gap: 24px; }
    .stat { display: flex; flex-direction: column; }
    .stat-num { font-size: 24px; font-weight: 800; color: #2E7D32; }
    .stat-label { font-size: 12px; color: #777; }
    .stat-divider { width: 1px; height: 36px; background: #A5D6A7; }
    .hero-carousel {
      position: relative; flex-shrink: 0; width: 640px; height: 460px;
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
    }
    .carousel-track {
      display: flex; width: 100%; height: 100%;
      transition: transform .4s ease;
    }
    .carousel-img {
      min-width: 100%; height: 100%; object-fit: cover; flex-shrink: 0;
    }
    .carousel-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(0,0,0,.45); color: #fff; border: none; cursor: pointer;
      font-size: 28px; line-height: 1; padding: 6px 12px; border-radius: 6px;
      opacity: 0; transition: opacity .2s;
    }
    .hero-carousel:hover .carousel-arrow { opacity: 1; }
    .carousel-prev { left: 10px; }
    .carousel-next { right: 10px; }
    .carousel-dots {
      position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 6px;
    }
    .carousel-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: rgba(255,255,255,.5); cursor: pointer; transition: background .2s;
    }
    .carousel-dot.active { background: #fff; }
    .hero-visual { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 24px; }
    .hero-icon { font-size: 120px; width: 120px; height: 120px; color: #2E7D32; opacity: .15; }
    .fence-graphic { display: flex; gap: 12px; align-items: flex-end; }
    .fence-post { width: 12px; border-radius: 3px; background: #2E7D32; opacity: .5; }
    .fence-post:nth-child(1) { height: 80px; }
    .fence-post:nth-child(2) { height: 100px; }
    .fence-post:nth-child(3) { height: 90px; }
    .fence-post:nth-child(4) { height: 105px; }
    .fence-post:nth-child(5) { height: 85px; }
    .fence-post:nth-child(6) { height: 95px; }

    /* SECTIONS */
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header h2 { font-size: 34px; font-weight: 700; color: #1B5E20; margin: 0 0 12px; }
    .section-header p { color: #666; font-size: 16px; margin: 0; }
    .section-header.light h2 { color: #fff; }

    /* SERVICES */
    .services { padding: 80px 48px; background: #fff; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
    .service-card {
      background: #F9FBE7; border: 1px solid #E8F5E9; border-radius: 12px;
      padding: 28px 24px; text-align: center; transition: box-shadow .2s, transform .2s;
    }
    .service-card:hover { box-shadow: 0 8px 24px rgba(46,125,50,.12); transform: translateY(-3px); }
    .service-icon-wrap {
      width: 56px; height: 56px; border-radius: 50%; background: #E8F5E9;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .service-icon-wrap mat-icon { color: #2E7D32; font-size: 26px; width: 26px; height: 26px; }
    .service-card h3 { font-size: 17px; font-weight: 600; margin: 0 0 8px; color: #1B5E20; }
    .service-card p { font-size: 14px; color: #666; margin: 0; line-height: 1.6; }

    /* WHY US */
    .why-us { padding: 80px 48px; background: #2E7D32; }
    .why-us .section-header h2 { color: #fff; }
    .why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; max-width: 1100px; margin: 0 auto; }
    .why-item { display: flex; gap: 16px; align-items: flex-start; }
    .why-icon { color: #A5D6A7; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin-top: 2px; }
    .why-item h4 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 6px; }
    .why-item p { font-size: 14px; color: #C8E6C9; margin: 0; line-height: 1.6; }

    /* QUOTE FORM */
    .quote-section { padding: 80px 48px; background: #F9FBE7; }
    .quote-inner { display: flex; gap: 60px; align-items: flex-start; max-width: 1000px; margin: 0 auto; flex-wrap: wrap; }
    .quote-copy { flex: 1; min-width: 280px; }
    .quote-copy h2 { font-size: 32px; font-weight: 700; color: #1B5E20; margin: 0 0 16px; }
    .quote-copy p { font-size: 16px; color: #555; margin: 0 0 24px; line-height: 1.7; }
    .quote-perks { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .quote-perks li { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #444; }
    .quote-perks mat-icon { color: #2E7D32; font-size: 20px; width: 20px; height: 20px; }
    .quote-form-card {
      flex: 1; min-width: 300px; background: #fff; border-radius: 12px;
      padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,.08);
    }
    .quote-form-card h3 { font-size: 20px; font-weight: 600; color: #1B5E20; margin: 0 0 20px; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .submit-btn {
      width: 100% !important; padding: 12px !important;
      font-size: 15px !important; font-weight: 600 !important;
      background: #2E7D32 !important; color: #fff !important;
      display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important;
    }
    .submit-btn:disabled { background: #ccc !important; }
    .btn-spinner { display: inline-block; }
    .quote-success { flex: 1; min-width: 300px; background: #fff; border-radius: 12px; padding: 48px 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #2E7D32; margin-bottom: 16px; }
    .quote-success h3 { font-size: 22px; font-weight: 600; color: #1B5E20; margin: 0 0 12px; }
    .quote-success p { color: #555; line-height: 1.6; margin: 0 0 24px; }

    /* FOOTER */
    .site-footer { background: #1B5E20; padding: 40px 48px; text-align: center; }
    .footer-brand { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 8px; }
    .footer-brand mat-icon { color: #A5D6A7; }
    .footer-brand span { color: #fff; font-size: 18px; font-weight: 700; }
    .footer-tagline { color: #A5D6A7; font-size: 14px; margin: 0 0 8px; }
    .footer-copy { color: #81C784; font-size: 12px; margin: 0; }

    /* MY QUOTES */
    .my-quotes-section { padding: 80px 48px; background: #fff; }
    .quotes-loading { display: flex; justify-content: center; padding: 40px; }
    .quotes-empty { text-align: center; padding: 60px 20px; color: #999; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #C8E6C9; display: block; margin: 0 auto 16px; }
    .quotes-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
    .quote-card { background: #fff; border: 1px solid #E8F5E9; border-radius: 12px; padding: 24px; cursor: pointer; transition: box-shadow .2s, transform .2s; display: flex; flex-direction: column; gap: 16px; }
    .quote-card:hover { box-shadow: 0 8px 24px rgba(46,125,50,.12); transform: translateY(-2px); }
    .quote-card-header { display: flex; justify-content: space-between; align-items: center; }
    .quote-id { font-size: 13px; font-weight: 700; color: #999; font-family: monospace; }
    .status-chip { font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px; text-transform: uppercase; letter-spacing: .5px; }
    .status-sent { background: #E3F2FD; color: #1565C0; }
    .status-accepted { background: #E8F5E9; color: #2E7D32; }
    .status-rejected { background: #FFEBEE; color: #c62828; }
    .status-draft { background: #F5F5F5; color: #757575; }
    .status-approved { background: #FFF8E1; color: #F57F17; }
    .quote-card-body { display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .quote-detail-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #555; }
    .quote-detail-row mat-icon { font-size: 18px; width: 18px; height: 18px; color: #2E7D32; flex-shrink: 0; }
    .quote-card-footer { padding-top: 8px; border-top: 1px solid #F1F8E9; }
    .view-btn { font-size: 13px !important; color: #2E7D32 !important; border-color: #2E7D32 !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; }

    /* REVIEWS */
    .reviews-section { padding: 80px 48px; background: #F9FBE7; }
    .reviews-summary { display: flex; align-items: center; gap: 16px; justify-content: center; margin-bottom: 48px; }
    .avg-rating { font-size: 48px; font-weight: 800; color: #2E7D32; line-height: 1; }
    .avg-stars { display: flex; gap: 2px; }
    .avg-label { font-size: 14px; color: #777; }
    .reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto 48px; }
    .review-card { background: #fff; border: 1px solid #E8F5E9; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .review-stars { display: flex; gap: 2px; }
    .star { font-size: 20px; color: #ddd; transition: color .1s; }
    .star.filled { color: #F9A825; }
    .pick-star { cursor: pointer; font-size: 28px; }
    .pick-star.hovered { color: #FBC02D; }
    .review-comment { font-size: 14px; color: #555; line-height: 1.7; margin: 0; font-style: italic; flex: 1; }
    .review-author { font-size: 13px; font-weight: 600; color: #2E7D32; }
    .footer-review-wrap { max-width: 560px; margin: 0 auto 40px; }
    .footer-rv-title { color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 6px; }
    .footer-rv-sub { color: #A5D6A7; font-size: 14px; margin: 0 0 24px; }
    .footer-divider { border: none; border-top: 1px solid rgba(255,255,255,.15); margin: 0 0 32px; }
    .leave-review-card { background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .leave-review-card h3 { font-size: 20px; font-weight: 600; color: #1B5E20; margin: 0 0 6px; }
    .leave-sub { font-size: 14px; color: #777; margin: 0 0 20px; }
    .star-picker { display: flex; gap: 4px; margin-bottom: 20px; }
    .review-fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .rv-input { width: 100%; padding: 10px 14px; border: 1px solid #C8E6C9; border-radius: 8px; font-size: 14px; font-family: Roboto, sans-serif; outline: none; transition: border-color .2s; box-sizing: border-box; }
    .rv-input:focus { border-color: #2E7D32; }
    .rv-textarea { resize: vertical; }
    .rv-submit-btn { width: 100% !important; background: #2E7D32 !important; color: #fff !important; font-size: 15px !important; font-weight: 600 !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; padding: 12px !important; }
    .rv-submit-btn:disabled { background: #ccc !important; }
    .review-success { text-align: center; padding: 48px 32px; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .review-success .success-icon { font-size: 64px; width: 64px; height: 64px; color: #2E7D32; display: block; margin: 0 auto 16px; }
    .review-success h3 { font-size: 22px; font-weight: 600; color: #1B5E20; margin: 0 0 8px; }
    .review-success p { color: #666; margin: 0; }

    @media (max-width: 768px) {
      /* prevent any element from causing horizontal overflow */
      .landing-page { overflow-x: hidden; max-width: 100vw; }
      .hero { flex-direction: column; padding: 40px 16px; gap: 24px; min-height: unset; }
      .hero-content { max-width: 100%; }
      .hero-title { font-size: 34px; }
      .hero-sub { font-size: 15px; }
      .hero-visual { display: none; }
      .hero-carousel { width: 100% !important; height: 260px !important; flex-shrink: 1 !important; }
      /* nav */
      .top-nav { padding: 12px 16px; gap: 8px; box-sizing: border-box; width: 100%; }
      .nav-actions { gap: 10px; }
      .nav-actions .nav-link { display: none; }
      .brand-name { font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
      .brand-icon { font-size: 22px; width: 22px; height: 22px; }
      /* sections */
      .services, .why-us, .quote-section, .reviews-section, .my-quotes-section { padding: 48px 16px; }
      .quote-inner { flex-direction: column; gap: 32px; }
      .section-header h2 { font-size: 26px; }
      .site-footer { padding: 32px 16px; }
    }
  `]
})
export class ContractorLandingComponent implements OnInit, OnDestroy {
  tenant = inject(TenantService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  submitted = false;
  submitting = false;
  year = new Date().getFullYear();
  posts = [1,2,3,4,5,6];
  carouselImages = [
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/39260088-6dec-4790-01d1-7626b9f5cc00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/bc01ff20-5c99-4f82-b04a-c98c873b7800/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/4a0f25a9-69d3-4754-d897-829443407e00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/6728574d-7c82-4f72-08f1-6dcbec894400/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/5e3250f5-e86d-4f1a-befd-bd4003bde200/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/29168135-0c6e-478a-65be-87b200c45f00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/c60de1d7-56bc-4ab2-7b54-fcb804e90b00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/2f41953a-1d74-44ac-92da-1eb932cf6200/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/47898e7f-d18b-488f-1466-8cff4a20b900/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/fdd98813-435e-41f3-cc81-dab5d7cd5b00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/ed1e2189-1278-4140-3208-fb301d924100/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/babd924e-2b6b-4bb0-a35e-b90456225a00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/ddebd0b4-16f4-4a32-09eb-fbd929fb3e00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/4e74bced-9042-4468-8ca1-2f2553a84a00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/cf5ce7ce-0cdb-4c49-dd35-6cfd8392dd00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/80a04287-e6c8-4f17-3003-b562006f1400/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/6ac34b5e-3e42-426c-879c-dd61771f9000/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/fca03eeb-aeff-4c1f-0d58-2c1fd360e400/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/1523afef-ddf8-4255-34af-510724e99d00/public',
    'https://imagedelivery.net/7SJFqNxbKSsrglTrI1f7bw/8644ac0e-744c-4f42-9ff3-10528e14e300/public',
  ];
  carouselIndex = 0;
  carouselNext() { this.carouselIndex = (this.carouselIndex + 1) % this.carouselImages.length; }
  carouselPrev() { this.carouselIndex = (this.carouselIndex - 1 + this.carouselImages.length) % this.carouselImages.length; }
  private _carouselTimer: any;
  get carouselTransform() { return `translateX(-${this.carouselIndex * 100}%)`; }
  ngOnDestroy() { clearInterval(this._carouselTimer); }

  currentUser: any = null;
  isCustomer = false;
  myQuotes: any[] = [];
  quotesLoading = false;
  pendingQuoteCount = 0;
  reviews: any[] = [];
  avgRating = 0;
  roundedAvg = 0;
  reviewSubmitted = false;
  reviewSubmitting = false;
  reviewHover = 0;
  reviewForm = { reviewerName: '', reviewerEmail: '', rating: 0, comment: '' };

  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    message: ['']
  });

  services = [
    { icon: 'park', title: 'Wood & Vinyl Fencing', description: 'Privacy, picket, and split-rail fencing in cedar, pine, and low-maintenance vinyl — installed and ready to last.' },
    { icon: 'link', title: 'Chain Link & Ornamental Iron', description: 'Galvanized chain link, welded wire, and custom wrought iron or aluminum for security and style.' },
    { icon: 'deck', title: 'Decks & Patios', description: 'Custom wood and composite decks, concrete patios, and outdoor living spaces designed around how you use your yard.' },
    { icon: 'yard', title: 'Landscaping & Grading', description: 'Lawn care, mulching, grading, drainage solutions, and seasonal cleanups to keep your property looking sharp.' },
    { icon: 'home_repair_service', title: 'Gates & Automation', description: 'Swing, slide, and bi-fold gate installations with optional keypad, remote, or app-based access control.' },
    { icon: 'foundation', title: 'Retaining Walls', description: 'Block, timber, and boulder retaining walls for erosion control, slope stabilization, and curb appeal.' },
    { icon: 'agriculture', title: 'Farm & Ranch Fencing', description: 'High-tensile wire, board fencing, and livestock panels for agricultural and rural properties.' },
    { icon: 'build', title: 'Repairs & Restoration', description: 'Post replacement, panel repairs, gate rehang, staining, and full fence restoration on any material.' }
  ];

  whyUs = [
    { icon: 'workspace_premium', title: '25+ Years of Experience', text: 'Over two decades serving the community. We have seen every job, every yard, and every challenge.' },
    { icon: 'handshake', title: 'Free Estimates', text: 'We come to you. No-obligation on-site consultations and detailed written quotes — no surprises.' },
    { icon: 'speed', title: 'Fast Turnaround', text: 'Most residential projects completed within a week of approval. We respect your schedule.' },
    { icon: 'star', title: 'Quality Guaranteed', text: 'Premium, treated materials and skilled crews on every job. We stand behind our work.' }
  ];

  ngOnInit() {
    this.loadCarouselImages();
    this.loadReviews();
    this.auth.getMe().subscribe({
      next: user => {
        if (!user) return;
        if (user.role === 'Admin' || user.role === 'Sales' || user.role === 'Accountant' || user.role === 'FieldWorker') {
          this.router.navigate(['/cq/dashboard']);
        } else if (user.role === 'Customer') {
          this.currentUser = user;
          this.isCustomer = true;
          this.loadMyQuotes();
        }
      },
      error: () => {}
    });
    this._carouselTimer = setInterval(() => this.carouselNext(), 8000);
  }

  loadCarouselImages() {
    this.api.getCarouselImages().subscribe({
      next: imgs => { if (imgs && imgs.length > 0) this.carouselImages = imgs; },
      error: () => {}
    });
  }

  loadMyQuotes() {
    this.quotesLoading = true;
    this.api.getMyPortalQuotes().subscribe({
      next: quotes => {
        this.myQuotes = quotes;
        this.pendingQuoteCount = quotes.filter((q: any) => q.status === 'Sent').length;
        this.quotesLoading = false;
      },
      error: () => { this.quotesLoading = false; }
    });
  }

  openQuote(quote: any) {
    if (quote.portalToken) {
      this.router.navigate(['/portal/quotes', quote.portalToken]);
    }
  }

  logout() {
    window.location.href = '/cdn-cgi/access/logout?returnTo=' + window.location.origin + '/';
  }

  loadReviews() {
    this.api.getReviews().subscribe({
      next: reviews => {
        this.reviews = reviews;
        if (reviews.length > 0) {
          this.avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
          this.roundedAvg = Math.round(this.avgRating);
        }
      },
      error: () => {}
    });
  }

  submitReview() {
    if (!this.reviewForm.reviewerName || !this.reviewForm.comment || this.reviewForm.rating === 0) return;
    this.reviewSubmitting = true;
    this.api.submitReview(this.reviewForm).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewSubmitted = true;
      },
      error: () => {
        this.reviewSubmitting = false;
        this.snack.open('Could not submit review. Please try again.', 'OK', { duration: 4000 });
      }
    });
  }

  login() {
    window.location.href = '/cq/dashboard';
  }

  submit() {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const { name, email, phone, message } = this.form.value;
    this.api.submitContactRequest({ name: name!, email: email!, phone: phone || '', message: message || '' }).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: () => {
        this.submitting = false;
        this.snack.open('Something went wrong. Please try again or call us directly.', 'OK', { duration: 5000 });
      }
    });
  }
}
