import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface TenantStat { value: string; label: string; }
export interface TenantConfig {
  businessName: string;
  industry: 'contractor' | 'realestate' | string;
  tagline: string;
  primaryColor: string;
  primaryColorDark?: string;
  icon: string;
  features: string[];
  contact: { phone: string; email: string; };
  stats: TenantStat[];
}

const DEFAULTS: TenantConfig = {
  businessName: 'Business',
  industry: 'contractor',
  tagline: '',
  primaryColor: '#2e7d32',
  icon: 'business',
  features: ['dashboard','customers','jobs','quotes','reports'],
  contact: { phone: '', email: '' },
  stats: []
};

@Injectable({ providedIn: 'root' })
export class TenantService {
  config: TenantConfig = { ...DEFAULTS };

  constructor(private http: HttpClient) {}

  async load(): Promise<void> {
    try {
      this.config = await firstValueFrom(
        this.http.get<TenantConfig>('/assets/tenant.json')
      );
    } catch {
      // fall back to defaults
    }
  }

  /** CSS class to add to <html> to activate the matching Material theme */
  get themeClass(): string {
    switch (this.config.industry) {
      case 'realestate': return 'theme-luxe';
      default: return 'theme-green'; // contractor / fallback → green (default)
    }
  }

  hasFeature(feature: string): boolean {
    return this.config.features.includes(feature);
  }
}
