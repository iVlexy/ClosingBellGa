import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-realestate-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="re-page">

      <!-- NAV -->
      <nav class="re-nav">
        <div class="re-brand">
          <mat-icon class="re-brand-icon">{{ tenant.config.icon }}</mat-icon>
          <span class="re-brand-name">{{ tenant.config.businessName }}</span>
        </div>
        <div class="re-nav-actions">
          <a href="#services" class="re-nav-link">Services</a>
          <a href="#contact" class="re-nav-link">Contact</a>
          <span class="re-nav-greeting" *ngIf="currentUser">Hi, {{ currentUser?.name?.split(' ')[0] }}</span>
          <button mat-stroked-button class="re-logout-btn" (click)="logout()" *ngIf="currentUser">
            <mat-icon>logout</mat-icon> Logout
          </button>
          <button mat-stroked-button class="re-login-btn" (click)="login()" *ngIf="!currentUser">
            <mat-icon>login</mat-icon> Client Login
          </button>
        </div>
      </nav>

      <!-- HERO -->
      <section class="re-hero">
        <div class="re-hero-content">
          <div class="re-hero-badge">Real Estate Professionals</div>
          <h1 class="re-hero-title">{{ tenant.config.businessName }}</h1>
          <p class="re-hero-sub">{{ tenant.config.tagline || 'Connecting people with properties. Expert guidance for buyers, sellers, and investors in today\'s market.' }}</p>
          <div class="re-hero-actions">
            <a href="#contact" mat-raised-button class="re-cta-btn">
              <mat-icon>calendar_today</mat-icon>
              Schedule Consultation
            </a>
            <a href="#services" mat-stroked-button class="re-outline-btn">Our Services</a>
          </div>
          <div class="re-hero-stats" *ngIf="tenant.config.stats?.length">
            <ng-container *ngFor="let stat of tenant.config.stats; let last = last">
              <div class="re-stat">
                <span class="re-stat-num">{{ stat.value }}</span>
                <span class="re-stat-label">{{ stat.label }}</span>
              </div>
              <div class="re-stat-divider" *ngIf="!last"></div>
            </ng-container>
          </div>
          <div class="re-hero-stats" *ngIf="!tenant.config.stats?.length">
            <div class="re-stat"><span class="re-stat-num">200+</span><span class="re-stat-label">Properties Sold</span></div>
            <div class="re-stat-divider"></div>
            <div class="re-stat"><span class="re-stat-num">15+</span><span class="re-stat-label">Years Experience</span></div>
            <div class="re-stat-divider"></div>
            <div class="re-stat"><span class="re-stat-num">98%</span><span class="re-stat-label">Client Satisfaction</span></div>
          </div>
        </div>
        <div class="re-hero-visual">
          <div class="re-property-cards">
            <div class="re-prop-card re-prop-1">
              <mat-icon>home</mat-icon>
              <div class="re-prop-label">Residential</div>
            </div>
            <div class="re-prop-card re-prop-2">
              <mat-icon>apartment</mat-icon>
              <div class="re-prop-label">Multi-Family</div>
            </div>
            <div class="re-prop-card re-prop-3">
              <mat-icon>business</mat-icon>
              <div class="re-prop-label">Commercial</div>
            </div>
          </div>
        </div>
      </section>

      <!-- SERVICES -->
      <section class="re-services" id="services">
        <div class="re-section-header">
          <h2>Our Services</h2>
          <p>Full-service real estate solutions tailored to your goals</p>
        </div>
        <div class="re-services-grid">
          <div class="re-service-card" *ngFor="let s of services">
            <div class="re-service-icon-wrap">
              <mat-icon>{{ s.icon }}</mat-icon>
            </div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.description }}</p>
          </div>
        </div>
      </section>

      <!-- WHY US -->
      <section class="re-why">
        <div class="re-section-header re-light">
          <h2>Why Choose Us</h2>
          <p style="color:#90caf9">Your trusted partner from first showing to final closing</p>
        </div>
        <div class="re-why-grid">
          <div class="re-why-item" *ngFor="let w of whyUs">
            <mat-icon class="re-why-icon">{{ w.icon }}</mat-icon>
            <div>
              <h4>{{ w.title }}</h4>
              <p>{{ w.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTACT FORM -->
      <section class="re-contact-section" id="contact">
        <div class="re-contact-inner">
          <div class="re-contact-copy">
            <h2>Schedule a Consultation</h2>
            <p>Whether you're buying, selling, or investing — let's start with a conversation. We'll assess your situation and craft a personalized strategy.</p>
            <ul class="re-perks">
              <li><mat-icon>check_circle</mat-icon> No-pressure, no-obligation consultation</li>
              <li><mat-icon>check_circle</mat-icon> Free market analysis for sellers</li>
              <li><mat-icon>check_circle</mat-icon> Personalized property search for buyers</li>
              <li><mat-icon>check_circle</mat-icon> Investment portfolio review available</li>
            </ul>
            <div class="re-contact-info" *ngIf="tenant.config.contact?.phone">
              <mat-icon>phone</mat-icon> {{ tenant.config.contact.phone }}
            </div>
            <div class="re-contact-info" *ngIf="tenant.config.contact?.email">
              <mat-icon>email</mat-icon> {{ tenant.config.contact.email }}
            </div>
          </div>
          <div class="re-form-card" *ngIf="!submitted">
            <h3>Get in Touch</h3>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <mat-form-field appearance="outline" class="re-full">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="name" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="re-full">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" formControlName="email" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="re-full">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
              <mat-form-field appearance="outline" class="re-full">
                <mat-label>Tell us about your real estate needs</mat-label>
                <textarea matInput rows="3" formControlName="message"></textarea>
              </mat-form-field>
              <button mat-raised-button type="submit" class="re-submit-btn" [disabled]="form.invalid || submitting">
                <mat-spinner diameter="18" *ngIf="submitting" class="re-btn-spinner"></mat-spinner>
                <mat-icon *ngIf="!submitting">send</mat-icon>
                {{ submitting ? 'Sending...' : 'Request Consultation' }}
              </button>
            </form>
          </div>
          <div class="re-form-success" *ngIf="submitted">
            <mat-icon class="re-success-icon">check_circle</mat-icon>
            <h3>We'll be in touch!</h3>
            <p>Thank you for reaching out. A member of our team will contact you within one business day to schedule your consultation.</p>
          </div>
        </div>
      </section>

      <!-- REVIEWS -->
      <section class="re-reviews-section" *ngIf="reviews.length > 0">
        <div class="re-section-header">
          <h2>What Our Clients Say</h2>
        </div>
        <div class="re-reviews-summary">
          <span class="re-avg-rating">{{ avgRating | number:'1.1-1' }}</span>
          <div>
            <div class="re-avg-stars">
              <mat-icon *ngFor="let s of [1,2,3,4,5]" class="re-star" [class.re-star-filled]="s <= roundedAvg">star</mat-icon>
            </div>
            <div class="re-avg-label">{{ reviews.length }} verified reviews</div>
          </div>
        </div>
        <div class="re-reviews-grid">
          <div class="re-review-card" *ngFor="let r of reviews | slice:0:6">
            <div class="re-review-stars">
              <mat-icon *ngFor="let s of [1,2,3,4,5]" class="re-star" [class.re-star-filled]="s <= r.rating">star</mat-icon>
            </div>
            <p class="re-review-comment">"{{ r.comment }}"</p>
            <span class="re-review-author">— {{ r.reviewerName }}</span>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="re-footer">
        <div class="re-footer-brand">
          <mat-icon>{{ tenant.config.icon }}</mat-icon>
          <span>{{ tenant.config.businessName }}</span>
        </div>
        <p class="re-footer-tagline">{{ tenant.config.tagline }}</p>
        <p class="re-footer-copy">&copy; {{ year }} {{ tenant.config.businessName }}. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    .re-page { font-family: Roboto, sans-serif; background: #fff; min-height: 100vh; }

    /* NAV */
    .re-nav {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 48px; background: #fff; border-bottom: 1px solid #E3F2FD;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .re-brand { display: flex; align-items: center; gap: 10px; }
    .re-brand-icon { color: #1565C0; font-size: 28px; width: 28px; height: 28px; }
    .re-brand-name { font-size: 20px; font-weight: 700; color: #0D47A1; letter-spacing: -.3px; }
    .re-nav-actions { display: flex; gap: 24px; align-items: center; }
    .re-nav-link { color: #1565C0; text-decoration: none; font-weight: 500; font-size: 14px; }
    .re-nav-link:hover { color: #0D47A1; }
    .re-nav-greeting { font-size: 14px; color: #555; font-weight: 500; }
    .re-login-btn { color: #1565C0 !important; border-color: #1565C0 !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; }
    .re-logout-btn { color: #c62828 !important; border-color: #c62828 !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; }

    /* HERO */
    .re-hero {
      display: flex; align-items: center; justify-content: space-between;
      padding: 80px 48px; background: linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%);
      min-height: 580px; gap: 40px;
    }
    .re-hero-content { max-width: 600px; }
    .re-hero-badge { display: inline-block; background: rgba(255,255,255,.15); color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 4px 14px; border-radius: 20px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,.25); }
    .re-hero-title { font-size: 48px; font-weight: 800; line-height: 1.1; color: #fff; margin: 0 0 20px; }
    .re-hero-sub { font-size: 17px; color: rgba(255,255,255,.85); line-height: 1.7; margin: 0 0 32px; }
    .re-hero-actions { display: flex; gap: 16px; align-items: center; margin-bottom: 40px; flex-wrap: wrap; }
    .re-cta-btn { background: #f9a825 !important; color: #0D47A1 !important; padding: 12px 28px !important; font-size: 15px !important; font-weight: 700 !important; border-radius: 6px !important; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(0,0,0,.25) !important; }
    .re-cta-btn:hover { background: #f57f17 !important; }
    .re-outline-btn { color: #fff !important; border: 2px solid rgba(255,255,255,.6) !important; padding: 10px 24px !important; font-size: 15px !important; font-weight: 600 !important; border-radius: 6px !important; text-decoration: none; display: inline-block; }
    .re-hero-stats { display: flex; align-items: center; gap: 24px; }
    .re-stat { display: flex; flex-direction: column; }
    .re-stat-num { font-size: 28px; font-weight: 800; color: #f9a825; }
    .re-stat-label { font-size: 12px; color: rgba(255,255,255,.7); }
    .re-stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,.2); }

    /* HERO VISUAL */
    .re-hero-visual { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .re-property-cards { display: flex; flex-direction: column; gap: 16px; }
    .re-prop-card {
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
      border-radius: 16px; padding: 24px 32px; display: flex; align-items: center; gap: 16px;
      color: #fff; backdrop-filter: blur(8px); min-width: 220px;
      transition: background .2s;
    }
    .re-prop-card:hover { background: rgba(255,255,255,.2); }
    .re-prop-card mat-icon { font-size: 36px; width: 36px; height: 36px; color: #f9a825; }
    .re-prop-label { font-size: 16px; font-weight: 600; }
    .re-prop-1 { transform: translateX(20px); }
    .re-prop-3 { transform: translateX(20px); }

    /* SECTION HEADER */
    .re-section-header { text-align: center; margin-bottom: 48px; }
    .re-section-header h2 { font-size: 34px; font-weight: 700; color: #0D47A1; margin: 0 0 12px; }
    .re-section-header p { color: #666; font-size: 16px; margin: 0; }
    .re-section-header.re-light h2 { color: #fff; }

    /* SERVICES */
    .re-services { padding: 80px 48px; background: #F3F8FF; }
    .re-services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
    .re-service-card { background: #fff; border: 1px solid #BBDEFB; border-radius: 12px; padding: 28px 24px; text-align: center; transition: box-shadow .2s, transform .2s; }
    .re-service-card:hover { box-shadow: 0 8px 24px rgba(21,101,192,.12); transform: translateY(-3px); }
    .re-service-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: #E3F2FD; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .re-service-icon-wrap mat-icon { color: #1565C0; font-size: 26px; width: 26px; height: 26px; }
    .re-service-card h3 { font-size: 17px; font-weight: 600; margin: 0 0 8px; color: #0D47A1; }
    .re-service-card p { font-size: 14px; color: #666; margin: 0; line-height: 1.6; }

    /* WHY US */
    .re-why { padding: 80px 48px; background: #1565C0; }
    .re-why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; max-width: 1100px; margin: 0 auto; }
    .re-why-item { display: flex; gap: 16px; align-items: flex-start; }
    .re-why-icon { color: #f9a825; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin-top: 2px; }
    .re-why-item h4 { font-size: 16px; font-weight: 600; color: #fff; margin: 0 0 6px; }
    .re-why-item p { font-size: 14px; color: #90CAF9; margin: 0; line-height: 1.6; }

    /* CONTACT */
    .re-contact-section { padding: 80px 48px; background: #fff; }
    .re-contact-inner { display: flex; gap: 60px; align-items: flex-start; max-width: 1000px; margin: 0 auto; flex-wrap: wrap; }
    .re-contact-copy { flex: 1; min-width: 280px; }
    .re-contact-copy h2 { font-size: 32px; font-weight: 700; color: #0D47A1; margin: 0 0 16px; }
    .re-contact-copy p { font-size: 16px; color: #555; margin: 0 0 24px; line-height: 1.7; }
    .re-perks { list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 12px; }
    .re-perks li { display: flex; align-items: center; gap: 10px; font-size: 15px; color: #444; }
    .re-perks mat-icon { color: #1565C0; font-size: 20px; width: 20px; height: 20px; }
    .re-contact-info { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #555; margin-bottom: 8px; }
    .re-contact-info mat-icon { color: #1565C0; font-size: 18px; width: 18px; height: 18px; }
    .re-form-card { flex: 1; min-width: 300px; background: #F3F8FF; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .re-form-card h3 { font-size: 20px; font-weight: 600; color: #0D47A1; margin: 0 0 20px; }
    .re-full { width: 100%; margin-bottom: 4px; }
    .re-submit-btn { width: 100% !important; padding: 12px !important; font-size: 15px !important; font-weight: 600 !important; background: #1565C0 !important; color: #fff !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; }
    .re-submit-btn:disabled { background: #ccc !important; }
    .re-btn-spinner { display: inline-block; }
    .re-form-success { flex: 1; min-width: 300px; background: #F3F8FF; border-radius: 12px; padding: 48px 32px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
    .re-success-icon { font-size: 64px; width: 64px; height: 64px; color: #1565C0; margin-bottom: 16px; display: block; margin: 0 auto 16px; }
    .re-form-success h3 { font-size: 22px; font-weight: 600; color: #0D47A1; margin: 0 0 12px; }
    .re-form-success p { color: #555; line-height: 1.6; margin: 0; }

    /* REVIEWS */
    .re-reviews-section { padding: 80px 48px; background: #F3F8FF; }
    .re-reviews-summary { display: flex; align-items: center; gap: 16px; justify-content: center; margin-bottom: 48px; }
    .re-avg-rating { font-size: 48px; font-weight: 800; color: #1565C0; line-height: 1; }
    .re-avg-stars { display: flex; gap: 2px; }
    .re-avg-label { font-size: 14px; color: #777; }
    .re-reviews-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
    .re-review-card { background: #fff; border: 1px solid #BBDEFB; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .re-review-stars { display: flex; gap: 2px; }
    .re-star { font-size: 20px; color: #ddd; }
    .re-star.re-star-filled { color: #f9a825; }
    .re-review-comment { font-size: 14px; color: #555; line-height: 1.7; margin: 0; font-style: italic; flex: 1; }
    .re-review-author { font-size: 13px; font-weight: 600; color: #1565C0; }

    /* FOOTER */
    .re-footer { background: #0D47A1; padding: 40px 48px; text-align: center; }
    .re-footer-brand { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 8px; }
    .re-footer-brand mat-icon { color: #90CAF9; }
    .re-footer-brand span { color: #fff; font-size: 18px; font-weight: 700; }
    .re-footer-tagline { color: #90CAF9; font-size: 14px; margin: 0 0 8px; }
    .re-footer-copy { color: #64B5F6; font-size: 12px; margin: 0; }

    @media (max-width: 768px) {
      .re-page { overflow-x: hidden; max-width: 100vw; }
      .re-nav { padding: 12px 16px; }
      .re-nav-actions .re-nav-link { display: none; }
      .re-brand-name { font-size: 15px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .re-hero { flex-direction: column; padding: 40px 16px; min-height: unset; gap: 32px; }
      .re-hero-title { font-size: 32px; }
      .re-hero-sub { font-size: 15px; }
      .re-hero-visual { display: none; }
      .re-services, .re-why, .re-contact-section, .re-reviews-section { padding: 48px 16px; }
      .re-contact-inner { flex-direction: column; gap: 32px; }
      .re-section-header h2 { font-size: 26px; }
      .re-footer { padding: 32px 16px; }
    }
  `]
})
export class RealEstateLandingComponent implements OnInit {
  tenant = inject(TenantService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  submitted = false;
  submitting = false;
  year = new Date().getFullYear();
  currentUser: any = null;
  reviews: any[] = [];
  avgRating = 0;
  roundedAvg = 0;

  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    message: ['']
  });

  services = [
    { icon: 'home', title: 'Residential Sales', description: 'From starter homes to luxury estates, we guide buyers and sellers through every step with expert market knowledge.' },
    { icon: 'business', title: 'Commercial Real Estate', description: 'Office spaces, retail, and industrial properties — we find the right fit for your business goals and budget.' },
    { icon: 'apartment', title: 'Property Management', description: 'Full-service management for rental portfolios including tenant screening, maintenance coordination, and rent collection.' },
    { icon: 'trending_up', title: 'Investment Analysis', description: 'Maximize ROI with our market data, comparative analysis, and hands-on investment strategy consulting.' }
  ];

  whyUs = [
    { icon: 'workspace_premium', title: 'Market Expertise', text: 'Deep knowledge of local markets, pricing trends, and neighborhood dynamics so you always make informed decisions.' },
    { icon: 'handshake', title: 'Full-Service Support', text: 'We are with you from the first showing to the final closing signature — and available long after.' },
    { icon: 'speed', title: 'Results You Can Count On', text: 'Our listings sell faster and our buyers close confidently with dedicated representation at every step.' },
    { icon: 'star', title: 'Client-First Approach', text: 'Your goals drive everything we do. We measure our success entirely by your satisfaction.' }
  ];

  ngOnInit() {
    this.loadReviews();
    this.auth.getMe().subscribe({
      next: user => {
        if (!user) return;
        if (user.role === 'Admin' || user.role === 'Sales' || user.role === 'Accountant' || user.role === 'FieldWorker') {
          this.router.navigate(['/cq/dashboard']);
        } else if (user.role === 'Customer') {
          this.currentUser = user;
        }
      },
      error: () => {}
    });
  }

  loadReviews() {
    this.api.getReviews().subscribe({
      next: reviews => {
        this.reviews = reviews;
        if (reviews.length > 0) {
          this.avgRating = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
          this.roundedAvg = Math.round(this.avgRating);
        }
      },
      error: () => {}
    });
  }

  logout() {
    window.location.href = '/cdn-cgi/access/logout?returnTo=' + window.location.origin + '/';
  }

  login() { window.location.href = '/cq/dashboard'; }

  submit() {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const { name, email, phone, message } = this.form.value;
    this.api.submitContactRequest({ name: name!, email: email!, phone: phone || '', message: message || '' }).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: () => {
        this.submitting = false;
        this.snack.open('Something went wrong. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }
}
