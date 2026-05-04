import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = signal(localStorage.getItem('lf-dark') === '1');

  get dark() { return this._dark(); }

  toggle() {
    const next = !this._dark();
    this._dark.set(next);
    localStorage.setItem('lf-dark', next ? '1' : '0');
    this.apply();
  }

  apply() {
    document.documentElement.classList.toggle('dark-mode', this._dark());
  }
}
