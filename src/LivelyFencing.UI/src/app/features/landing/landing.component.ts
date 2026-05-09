import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../core/services/tenant.service';
import { RealEstateLandingComponent } from './realestate-landing.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RealEstateLandingComponent],
  template: `
    <app-realestate-landing *ngIf="tenant.config.industry === 'realestate'"></app-realestate-landing>
  `
})
export class LandingComponent {
  tenant = inject(TenantService);
}
