import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { TenantService } from '../../core/services/tenant.service';

@Component({
  selector: 'app-realestate-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule, MatSelectModule, MatCheckboxModule],
  template: `
    <div class="re-page">

      <!-- NAV -->
      <nav class="re-nav">
        <div class="re-brand">
          <mat-icon class="re-brand-icon">{{ tenant.config.icon }}</mat-icon>
          <span class="re-brand-name">{{ tenant.config.businessName }}</span>
        </div>
        <div class="re-nav-actions">
          <!-- Browse Listings hidden until FMLS approval -->
          <a href="#services" class="re-nav-link">Services</a>
          <a href="#contact" class="re-nav-link">Contact</a>
          <span class="re-nav-greeting" *ngIf="currentUser">Hi, {{ currentUser?.name?.split(' ')[0] }}</span>
          <button mat-icon-button class="re-logout-btn" (click)="logout()" *ngIf="currentUser">
            <mat-icon>logout</mat-icon><span class="re-btn-label"> Logout</span>
          </button>
          <button mat-icon-button class="re-login-btn" (click)="login()" *ngIf="!currentUser">
            <mat-icon>login</mat-icon><span class="re-btn-label"> Login</span>
          </button>
        </div>
      </nav>

      <!-- HERO -->
      <section class="re-hero">
        <div class="re-hero-content">
          <div class="re-hero-badge">Real Estate Professionals</div>
          <h1 class="re-hero-title">{{ tenant.config.businessName }}</h1>
          <p class="re-hero-sub">{{ tenant.config.tagline || taglineFallback }}</p>
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
        <div class="re-hero-carousel">
          <div class="re-car-track" [style.transform]="carouselTransform">
            <img *ngFor="let img of carouselImages" [src]="img" alt="Property photo" class="re-car-img" loading="lazy">
          </div>
          <button class="re-car-arrow re-car-prev" (click)="carouselPrev()" aria-label="Previous">&#8249;</button>
          <button class="re-car-arrow re-car-next" (click)="carouselNext()" aria-label="Next">&#8250;</button>
          <div class="re-car-dots">
            <span *ngFor="let img of carouselImages; let i = index"
              class="re-car-dot" [class.active]="i === carouselIndex"
              (click)="carouselIndex = i"></span>
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
          <p>Your trusted partner from first showing to final closing</p>
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
              <li><mat-icon>check_circle</mat-icon> Investment portfolio review available</li>
            </ul>
            <div class="re-contact-info" *ngIf="tenant.config.contact?.phone">
              <a [href]="'tel:' + tenant.config.contact.phone" class="re-contact-link"><mat-icon>phone</mat-icon> {{ tenant.config.contact.phone }}</a>
            </div>
            <div class="re-contact-info" *ngIf="tenant.config.contact?.email">
              <a [href]="'mailto:' + tenant.config.contact.email" class="re-contact-link"><mat-icon>email</mat-icon> {{ tenant.config.contact.email }}</a>
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
                <mat-label>How did you find us?</mat-label>
                <mat-select formControlName="referralSource">
                  <mat-option value="">Prefer not to say</mat-option>
                  <mat-option value="Google Search">Google Search</mat-option>
                  <mat-option value="Google Maps">Google Maps</mat-option>
                  <mat-option value="Facebook">Facebook</mat-option>
                  <mat-option value="Instagram">Instagram</mat-option>
                  <mat-option value="Referral / Word of Mouth">Referral / Word of Mouth</mat-option>
                  <mat-option value="Zillow / Realtor.com">Zillow / Realtor.com</mat-option>
                  <mat-option value="Yard Sign">Yard Sign</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="re-full">
                <mat-label>Tell us about your real estate needs</mat-label>
                <textarea matInput rows="3" formControlName="message"></textarea>
              </mat-form-field>
              <div class="re-lender-check">
                <mat-checkbox formControlName="hasLender" color="primary">I already have a lender</mat-checkbox>
              </div>
              <mat-form-field appearance="outline" class="re-full" *ngIf="form.get('hasLender')?.value">
                <mat-label>Lender Name (optional)</mat-label>
                <input matInput formControlName="lenderName" placeholder="e.g. Quicken Loans, local credit union...">
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

      <!-- TESTIMONIALS -->
      <section class="re-testimonials" *ngIf="reviews.length > 0">
        <div class="re-section-header">
          <h2>What Our Clients Say</h2>
          <p>Real experiences from the people we've had the privilege of serving</p>
        </div>
        <div class="re-tcarousel-wrap">
          <button class="re-tcar-arrow re-tcar-prev" (click)="reviewPrev()" aria-label="Previous review">&#8249;</button>
          <div class="re-tcarousel-track">
            <div class="re-testimonial-card" *ngFor="let rv of reviews; let i = index"
                 [class.re-tcard-active]="i === reviewCarouselIndex"
                 [style.transform]="'translateX(' + (i - reviewCarouselIndex) * 100 + '%)'">
              <div class="re-tcard-top">
                <div class="re-tcard-stars">
                  <mat-icon *ngFor="let s of [1,2,3,4,5]" [class.re-star-filled]="s <= rv.rating">star</mat-icon>
                </div>
                <span *ngIf="rv.source === 'Google'" class="re-google-tag">Google</span>
              </div>
              <p class="re-tcard-comment">&#8220;{{ rv.comment }}&#8221;</p>
              <div class="re-tcard-author">
                <img *ngIf="rv.reviewerPhotoUrl" [src]="rv.reviewerPhotoUrl" alt="" class="re-tcard-avatar">
                <div *ngIf="!rv.reviewerPhotoUrl" class="re-tcard-avatar-initial">{{ rv.reviewerName.charAt(0) }}</div>
                <span class="re-tcard-name">{{ rv.reviewerName }}</span>
              </div>
            </div>
          </div>
          <button class="re-tcar-arrow re-tcar-next" (click)="reviewNext()" aria-label="Next review">&#8250;</button>
        </div>
        <div class="re-tcar-dots">
          <span *ngFor="let rv of reviews; let i = index"
                class="re-tcar-dot" [class.active]="i === reviewCarouselIndex"
                (click)="reviewCarouselIndex = i; resetReviewTimer()"></span>
        </div>
      </section>

      <!-- REVIEWS -->
      <section class="re-leave-review-section">
        <div class="re-section-header">
          <h2>Leave a Review</h2>
          <p>We value your feedback. Share your experience working with us.</p>
        </div>
        <div class="re-leave-review-inner">
          <div class="re-leave-review-card re-google-review-card">
            <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" class="re-google-logo" />
            <p class="re-google-review-text">Reviews help other buyers and sellers find us. Click below to share your experience on Google.</p>
            <a href="https://search.google.com/local/writereview?placeid=ChIJwWRda1CJ9YgRz5oErFejsAg"
               target="_blank" rel="noopener noreferrer"
               mat-raised-button class="re-submit-btn re-google-btn">
              <mat-icon>star_rate</mat-icon>
              Write a Google Review
            </a>
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
    .re-page { font-family: 'Roboto', sans-serif; background: #FAFAF8; min-height: 100vh; color: #1A1A1A; }

    /* NAV */
    .re-nav {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 48px; background: #0A0A0A;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,.4);
    }
    .re-brand { display: flex; align-items: center; gap: 10px; }
    .re-brand-icon { color: #C9A96E; font-size: 28px; width: 28px; height: 28px; }
    .re-brand-name { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: .5px; }
    .re-nav-actions { display: flex; gap: 24px; align-items: center; }
    .re-nav-link { color: rgba(255,255,255,.7); text-decoration: none; font-weight: 500; font-size: 14px; letter-spacing: .3px; }
    .re-nav-link:hover { color: #C9A96E; }
    .re-nav-greeting { font-size: 14px; color: rgba(255,255,255,.6); font-weight: 500; }
        .re-login-btn { color: #C9A96E !important; border: 1px solid #C9A96E !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; width: auto !important; border-radius: 4px !important; }
    .re-logout-btn { color: rgba(255,255,255,.6) !important; border: 1px solid rgba(255,255,255,.3) !important; font-size: 13px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; gap: 4px !important; padding: 0 14px !important; height: 36px !important; width: auto !important; border-radius: 4px !important; }

    /* HERO */
    .re-hero {
      display: flex; align-items: center; justify-content: space-between;
      padding: 90px 48px;
      background: linear-gradient(135deg, #0A0A0A 0%, #0D1A12 55%, #1A3A2A 100%);
      min-height: 600px; gap: 40px;
    }
    .re-hero-content { max-width: 600px; }
    .re-hero-badge { display: inline-block; background: rgba(201,169,110,.12); color: #C9A96E; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 5px 16px; border-radius: 2px; margin-bottom: 24px; border: 1px solid rgba(201,169,110,.35); }
    .re-hero-title { font-size: 52px; font-weight: 800; line-height: 1.08; color: #fff; margin: 0 0 20px; letter-spacing: -.5px; }
    .re-hero-sub { font-size: 17px; color: rgba(255,255,255,.65); line-height: 1.8; margin: 0 0 36px; font-weight: 300; letter-spacing: .2px; }
    .re-hero-actions { display: flex; gap: 16px; align-items: center; margin-bottom: 48px; flex-wrap: wrap; }
    .re-cta-btn { background: #C9A96E !important; color: #0A0A0A !important; padding: 13px 32px !important; font-size: 14px !important; font-weight: 700 !important; letter-spacing: .5px !important; text-transform: uppercase !important; border-radius: 2px !important; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(201,169,110,.3) !important; }
    .re-cta-btn:hover { background: #B8935A !important; }
    .re-outline-btn { color: rgba(255,255,255,.85) !important; border: 1px solid rgba(255,255,255,.35) !important; padding: 12px 28px !important; font-size: 14px !important; font-weight: 500 !important; letter-spacing: .5px !important; text-transform: uppercase !important; border-radius: 2px !important; text-decoration: none; display: inline-block; }
    .re-outline-btn:hover { border-color: rgba(255,255,255,.6) !important; }
    .re-hero-stats { display: flex; align-items: center; gap: 32px; }
    .re-stat { display: flex; flex-direction: column; }
    .re-stat-num { font-size: 30px; font-weight: 800; color: #C9A96E; letter-spacing: -.5px; }
    .re-stat-label { font-size: 11px; color: rgba(255,255,255,.5); letter-spacing: 1px; text-transform: uppercase; margin-top: 2px; }
    .re-stat-divider { width: 1px; height: 44px; background: rgba(255,255,255,.12); }


    /* HERO CAROUSEL */
    .re-hero-carousel {
      position: relative; flex-shrink: 0; width: 580px; height: 440px;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 8px 40px rgba(0,0,0,.45);
    }
    .re-car-track { display: flex; width: 100%; height: 100%; transition: transform .5s ease; }
    .re-car-img { min-width: 100%; height: 100%; object-fit: cover; flex-shrink: 0; }
    .re-car-arrow {
      position: absolute; top: 50%; transform: translateY(-50%);
      background: rgba(0,0,0,.45); color: #fff; border: none; cursor: pointer;
      font-size: 32px; line-height: 1; padding: 6px 12px; border-radius: 6px;
      opacity: 0; transition: opacity .2s; z-index: 2;
    }
    .re-hero-carousel:hover .re-car-arrow { opacity: 1; }
    .re-car-prev { left: 10px; }
    .re-car-next { right: 10px; }
    .re-car-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 2; }
    .re-car-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.45); cursor: pointer; transition: background .2s; }
    .re-car-dot.active { background: #C9A96E; }
    /* SECTION HEADER */
    .re-section-header { text-align: center; margin-bottom: 56px; }
    .re-section-header h2 { font-size: 34px; font-weight: 700; color: #1A1A1A; margin: 0 0 14px; letter-spacing: -.3px; }
    .re-section-header::after { content: ''; display: block; width: 48px; height: 2px; background: #C9A96E; margin: 16px auto 0; }
    .re-section-header p { color: #777; font-size: 16px; margin: 0; }
    .re-section-header.re-light h2 { color: #fff; }
    .re-section-header.re-light::after { background: #C9A96E; }
    .re-section-header.re-light p { color: rgba(255,255,255,.55); }

    /* SERVICES */
    .re-services { padding: 88px 48px; background: #FAFAF8; }
    .re-services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; max-width: 1100px; margin: 0 auto; }
    .re-service-card { background: #fff; border: 1px solid #E8EDE9; border-radius: 4px; padding: 32px 24px; text-align: center; transition: box-shadow .25s, transform .25s; }
    .re-service-card:hover { box-shadow: 0 8px 32px rgba(26,58,42,.1); transform: translateY(-4px); border-color: #C9A96E; }
    .re-service-icon-wrap { width: 58px; height: 58px; border-radius: 50%; background: #F0F4F1; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .re-service-icon-wrap mat-icon { color: #2D5A40; font-size: 26px; width: 26px; height: 26px; }
    .re-service-card h3 { font-weight: 700; margin: 0 0 10px; color: #1A1A1A; letter-spacing: .2px; text-transform: uppercase; font-size: 13px; }
    .re-service-card p { font-size: 14px; color: #666; margin: 0; line-height: 1.7; }

    /* WHY US */
    .re-why { padding: 88px 48px; background: #0D1A12; }
    .re-why-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 32px; max-width: 1100px; margin: 0 auto; }
    .re-why-item { display: flex; gap: 18px; align-items: flex-start; }
    .re-why-icon { color: #C9A96E; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; margin-top: 2px; }
    .re-why-item h4 { font-size: 15px; font-weight: 700; color: #fff; margin: 0 0 8px; letter-spacing: .3px; text-transform: uppercase; }
    .re-why-item p { font-size: 14px; color: rgba(255,255,255,.5); margin: 0; line-height: 1.7; }

    /* CONTACT */
    .re-contact-section { padding: 88px 48px; background: #fff; }
    .re-contact-inner { display: flex; gap: 64px; align-items: flex-start; max-width: 1000px; margin: 0 auto; flex-wrap: wrap; }
    .re-contact-copy { flex: 1; min-width: 280px; }
    .re-contact-copy h2 { font-size: 32px; font-weight: 700; color: #1A1A1A; margin: 0 0 16px; letter-spacing: -.3px; }
    .re-contact-copy p { font-size: 16px; color: #666; margin: 0 0 28px; line-height: 1.8; }
    .re-perks { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 14px; }
    .re-perks li { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #444; }
    .re-perks mat-icon { color: #2D5A40; font-size: 20px; width: 20px; height: 20px; }
    .re-contact-info { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #666; margin-bottom: 10px; }
    .re-contact-link { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #2D5A40; margin-bottom: 10px; text-decoration: none; font-weight: 500; }
    .re-contact-link:hover { text-decoration: underline; }
    .re-contact-info mat-icon { color: #2D5A40; font-size: 18px; width: 18px; height: 18px; }
    .re-form-card { flex: 1; min-width: 300px; background: #F5F7F5; border-radius: 4px; padding: 36px; box-shadow: 0 4px 24px rgba(0,0,0,.07); border: 1px solid #E8EDE9; }
    .re-form-card h3 { font-size: 18px; font-weight: 700; color: #1A1A1A; margin: 0 0 24px; letter-spacing: .3px; text-transform: uppercase; }
    .re-full { width: 100%; margin-bottom: 4px; }
    .re-lender-check { margin: 0 0 16px; }
    .re-submit-btn { width: 100% !important; padding: 14px !important; font-size: 13px !important; font-weight: 700 !important; letter-spacing: 1px !important; text-transform: uppercase !important; background: #1A3A2A !important; color: #fff !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; border-radius: 2px !important; }
    .re-submit-btn:hover:not(:disabled) { background: #0D1F14 !important; }
    .re-submit-btn:disabled { background: #ccc !important; }
    .re-btn-spinner { display: inline-block; }
    .re-form-success { flex: 1; min-width: 300px; background: #F5F7F5; border-radius: 4px; padding: 56px 36px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,.07); border: 1px solid #E8EDE9; }
    .re-success-icon { font-size: 56px; width: 56px; height: 56px; color: #2D5A40; display: block; margin: 0 auto 20px; }
    .re-form-success h3 { font-size: 22px; font-weight: 700; color: #1A1A1A; margin: 0 0 12px; }
    .re-form-success p { color: #666; line-height: 1.7; margin: 0; }

    /* TESTIMONIALS */
    .re-testimonials { padding: 88px 48px; background: #fff; }
    .re-tcarousel-wrap { position: relative; max-width: 680px; margin: 0 auto; display: flex; align-items: center; gap: 8px; }
    .re-tcarousel-track { flex: 1; overflow: hidden; position: relative; min-height: 210px; }
    .re-testimonial-card { position: absolute; top: 0; left: 0; width: 100%; background: #FAFAF8; border: 1px solid #E8EDE9; border-radius: 8px; padding: 36px; display: flex; flex-direction: column; gap: 16px; box-shadow: 0 2px 12px rgba(0,0,0,.04); transition: transform .4s ease, opacity .4s ease; opacity: 0; pointer-events: none; }
    .re-testimonial-card.re-tcard-active { opacity: 1; pointer-events: auto; position: relative; transform: translateX(0) !important; }
    .re-tcard-top { display: flex; align-items: center; justify-content: space-between; }
    .re-tcard-stars { display: flex; gap: 2px; }
    .re-tcard-stars mat-icon { font-size: 18px; width: 18px; height: 18px; color: #E0E0E0; }
    .re-tcard-stars mat-icon.re-star-filled { color: #C9A96E; }
    .re-google-tag { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #4285F4; background: rgba(66,133,244,.08); padding: 3px 8px; border-radius: 3px; border: 1px solid rgba(66,133,244,.2); }
    .re-tcard-comment { font-size: 15px; color: #444; line-height: 1.8; margin: 0; font-style: italic; flex: 1; }
    .re-tcard-author { display: flex; align-items: center; gap: 10px; }
    .re-tcard-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    .re-tcard-avatar-initial { width: 40px; height: 40px; border-radius: 50%; background: #1A3A2A; color: #C9A96E; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
    .re-tcard-name { font-size: 13px; font-weight: 600; color: #1A1A1A; }
    .re-tcar-arrow { background: none; border: 1px solid #E8EDE9; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 24px; line-height: 1; color: #1A3A2A; flex-shrink: 0; transition: background .2s, border-color .2s; display: flex; align-items: center; justify-content: center; }
    .re-tcar-arrow:hover { background: #F0F4F1; border-color: #C9A96E; }
    .re-tcar-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
    .re-tcar-dot { width: 8px; height: 8px; border-radius: 50%; background: #D0D7D1; cursor: pointer; transition: background .2s, transform .2s; }
    .re-tcar-dot.active { background: #C9A96E; transform: scale(1.3); }

    /* REVIEWS */
    .re-leave-review-section { padding: 88px 48px; background: #FAFAF8; }
    .re-leave-review-inner { display: flex; justify-content: center; }
    .re-leave-review-card { background: #fff; border: 1px solid #E8EDE9; border-radius: 4px; padding: 40px; width: 100%; max-width: 480px; box-shadow: 0 4px 24px rgba(0,0,0,.07); display: flex; flex-direction: column; gap: 20px; }
    .re-google-review-card { align-items: center; text-align: center; }
    .re-google-logo { height: 30px; width: auto; }
    .re-google-review-text { color: #555; font-size: 15px; line-height: 1.6; margin: 0; }
    .re-google-btn { background: #4285F4 !important; color: #fff !important; gap: 8px; }
    .re-google-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    /* FOOTER */
    .re-footer { background: #0A0A0A; padding: 48px; text-align: center; border-top: 1px solid #1A3A2A; }
    .re-footer-brand { display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 12px; }
    .re-footer-brand mat-icon { color: #C9A96E; }
    .re-footer-brand span { color: #fff; font-size: 18px; font-weight: 700; letter-spacing: .5px; }
    .re-footer-tagline { color: rgba(255,255,255,.4); font-size: 13px; margin: 0 0 12px; letter-spacing: .5px; }
    .re-footer-copy { color: rgba(255,255,255,.25); font-size: 11px; margin: 0; letter-spacing: .5px; }

    @media (max-width: 768px) {
      .re-page { overflow-x: hidden; max-width: 100vw; }
      .re-nav { padding: 12px 16px; }
      .re-nav-actions .re-nav-link { display: none; }
      .re-nav-actions .re-browse-btn { display: inline-flex; padding: 6px 14px; border: 1px solid rgba(255,255,255,.4); border-radius: 6px; font-size: 13px; }
      .re-brand-name { font-size: 15px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .re-nav-actions { gap: 8px; }
      .re-nav-greeting { display: none; }
      .re-btn-label { display: none; }
      .re-logout-btn { width: 36px !important; height: 36px !important; border: none !important; padding: 0 !important; }
      .re-login-btn { width: 36px !important; height: 36px !important; border: none !important; padding: 0 !important; }
      .re-browse-btn { white-space: nowrap; font-size: 12px !important; padding: 5px 10px !important; }
      .re-hero { flex-direction: column; padding: 48px 20px; min-height: unset; gap: 32px; }
      .re-hero-title { font-size: 34px; }
      .re-hero-sub { font-size: 15px; }
      .re-hero-carousel { width: 100%; height: 260px; border-radius: 8px; }
      .re-hero-carousel::after { content: 'Meet Your Agent'; position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,.65)); color: #fff; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-align: center; padding: 24px 0 10px; pointer-events: none; }
      .re-hero-carousel .re-car-dots { bottom: 38px; }
      .re-services, .re-why, .re-contact-section, .re-testimonials, .re-leave-review-section { padding: 56px 20px; }
      .re-tcarousel-wrap { gap: 4px; } .re-tcar-arrow { width: 32px; height: 32px; font-size: 20px; }
      .re-contact-inner { flex-direction: column; gap: 32px; }
      .re-section-header h2 { font-size: 26px; }
      .re-footer { padding: 36px 20px; }
    }
  `]
})
export class RealEstateLandingComponent implements OnInit, OnDestroy {
  tenant = inject(TenantService);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  carouselImages: string[] = [];
  carouselIndex = 0;
  private _carouselTimer: any;
  get carouselTransform() { return `translateX(-${this.carouselIndex * 100}%)`; }
  carouselNext() { this.carouselIndex = (this.carouselIndex + 1) % this.carouselImages.length; }
  carouselPrev() { this.carouselIndex = (this.carouselIndex - 1 + this.carouselImages.length) % this.carouselImages.length; }
  ngOnDestroy() { clearInterval(this._carouselTimer); clearInterval(this._reviewTimer); }

  submitted = false;
  submitting = false;
  year = new Date().getFullYear();
  currentUser: any = null;
  reviews: any[] = [];
  reviewCarouselIndex = 0;
  private _reviewTimer: any;
  form = this.fb.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    phone:   [''],
    referralSource: [''],
    message: [''],
    hasLender: [false],
    lenderName: ['']
  });

  taglineFallback = "Connecting people with properties. Expert guidance for buyers, sellers, and investors in today's market.";
  services = [
    { icon: 'home', title: 'Residential Sales', description: 'From starter homes to luxury estates, we guide buyers and sellers through every step with expert market knowledge.' },
    { icon: 'business', title: 'Commercial Real Estate', description: 'Office spaces, retail, and industrial properties — we find the right fit for your business goals and budget.' },
    { icon: 'trending_up', title: 'Investment Analysis', description: 'Maximize ROI with our market data, comparative analysis, and hands-on investment strategy consulting.' }
  ];

  whyUs = [
    { icon: 'workspace_premium', title: 'Market Expertise', text: 'Deep knowledge of local markets, pricing trends, and neighborhood dynamics so you always make informed decisions.' },
    { icon: 'handshake', title: 'Full-Service Support', text: 'We are with you from the first showing to the final closing signature — and available long after.' },
    { icon: 'speed', title: 'Results You Can Count On', text: 'Our listings sell faster and our buyers close confidently with dedicated representation at every step.' },
    { icon: 'star', title: 'Client-First Approach', text: 'Your goals drive everything we do. We measure our success entirely by your satisfaction.' }
  ];

  ngOnInit() {
    this.api.getCarouselImages().subscribe({ next: imgs => { if (imgs?.length) { this.carouselImages = imgs; } }, error: () => {} });
    this._carouselTimer = setInterval(() => this.carouselNext(), 7000);
    this.api.getReviews().subscribe({ next: r => { this.reviews = r; this.resetReviewTimer(); }, error: () => {} });
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

  reviewNext() { this.reviewCarouselIndex = (this.reviewCarouselIndex + 1) % this.reviews.length; this.resetReviewTimer(); }
  reviewPrev() { this.reviewCarouselIndex = (this.reviewCarouselIndex - 1 + this.reviews.length) % this.reviews.length; this.resetReviewTimer(); }
  resetReviewTimer() { clearInterval(this._reviewTimer); this._reviewTimer = setInterval(() => this.reviewNext(), 5000); }

  logout() {
    window.location.href = '/cdn-cgi/access/logout?returnTo=' + window.location.origin + '/';
  }

  login() { window.location.href = '/cq/dashboard'; }

  submit() {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    const { name, email, phone, message, hasLender, lenderName } = this.form.value;
    this.api.submitContactRequest({ name: name!, email: email!, phone: phone || '', message: message || '', source: this.form.value.referralSource || undefined, hasLender: hasLender ?? false, lenderName: hasLender ? (lenderName || undefined) : undefined }).subscribe({
      next: () => { this.submitting = false; this.submitted = true; },
      error: () => {
        this.submitting = false;
        this.snack.open('Something went wrong. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }
}
