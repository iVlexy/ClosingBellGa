import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantService } from '../../core/services/tenant.service';
import { ContractorLandingComponent } from './contractor-landing.component';
import { RealEstateLandingComponent } from './realestate-landing.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ContractorLandingComponent, RealEstateLandingComponent],
  template: `
    <app-contractor-landing *ngIf="tenant.config.industry === 'contractor'"></app-contractor-landing>
    <app-realestate-landing *ngIf="tenant.config.industry === 'realestate'"></app-realestate-landing>
  `
})
export class LandingComponent {
  tenant = inject(TenantService);
}
