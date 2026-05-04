import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  `
})
export class UnauthorizedComponent {}
