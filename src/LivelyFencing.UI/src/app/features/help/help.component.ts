import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatExpansionModule, MatChipsModule, MatDividerModule],
  template: `
    <div class="help-container">
      <div class="help-header">
        <mat-icon class="header-icon">menu_book</mat-icon>
        <div>
          <h1>Internal Workflow Guide</h1>
          <p class="subtitle">End-to-end reference for the Lookin' Lively Exterior Solutions management system</p>
        </div>
      </div>

      <!-- Workflow overview -->
      <div class="workflow-strip">
        <div class="flow-step"><mat-icon>people</mat-icon><span>Customer</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>build</mat-icon><span>Job</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>request_quote</mat-icon><span>Quote</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>engineering</mat-icon><span>Contractors</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>receipt_long</mat-icon><span>Expenses</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>bar_chart</mat-icon><span>Reports</span></div>
      </div>

      <!-- Sections -->
      <mat-accordion multi>

        <!-- CUSTOMERS -->
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">people</mat-icon>Step 1 — Customers</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip sales">Sales</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Every job starts with a customer record. Create the customer first so they can be linked to jobs and quotes.</p>
          <ol>
            <li>Navigate to <strong>Customers</strong> in the sidebar.</li>
            <li>Click <strong>New Customer</strong> and fill in name, email, phone, and address.</li>
            <li>Save — the customer now appears in the list and can be searched by name, email, or company.</li>
            <li>Click a customer's name to view their full detail page, including linked jobs and quote history.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Keep the email accurate — it is used when sending quotes via the customer portal link.</div>
        </mat-expansion-panel>

        <!-- JOBS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">build</mat-icon>Step 2 — Jobs</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip sales">Sales</span><span class="role-chip accountant">Accountant</span><span class="role-chip fieldworker">Field Worker</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>A job represents a specific scope of work (e.g., "Install wood privacy fence — 120 ft"). Jobs are linked to a customer and track status through the project lifecycle.</p>
          <ol>
            <li>Navigate to <strong>Jobs</strong> and click <strong>New Job</strong>.</li>
            <li>Select the customer, enter a title, description, and site address.</li>
            <li>Set the initial status to <strong>Pending</strong>.</li>
            <li>Add detailed scope notes — these are used by AI to auto-generate a quote.</li>
          </ol>
          <h4>Job Statuses</h4>
          <table class="status-table">
            <tr><td><span class="badge pending">Pending</span></td><td>Newly created, awaiting quote or scheduling</td></tr>
            <tr><td><span class="badge inprogress">In Progress</span></td><td>Work has started on site</td></tr>
            <tr><td><span class="badge completed">Completed</span></td><td>Work finished, ready to invoice</td></tr>
            <tr><td><span class="badge cancelled">Cancelled</span></td><td>Job cancelled by customer or company</td></tr>
          </table>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Field Workers can view jobs but cannot create or edit them.</div>
        </mat-expansion-panel>

        <!-- QUOTES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">request_quote</mat-icon>Step 3 — Quotes</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip sales">Sales</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Quotes are generated from jobs and sent to customers for approval via a secure portal link.</p>

          <h4>Creating a Quote</h4>
          <ol>
            <li>From the <strong>Quotes</strong> list, click <strong>New Quote</strong>.</li>
            <li>Choose <strong>AI-Generate</strong> (uses job description to suggest line items &amp; pricing) or <strong>Manual</strong> (enter line items yourself).</li>
            <li>Review and edit line items — adjust quantities, unit prices, and descriptions as needed.</li>
            <li>Save the quote. It enters <strong>Draft</strong> status.</li>
          </ol>

          <h4>Quote Workflow</h4>
          <table class="status-table">
            <tr><td><span class="badge draft">Draft</span></td><td>Being built — not yet visible to customer</td></tr>
            <tr><td><span class="badge sent">Sent</span></td><td>Customer has received a portal link</td></tr>
            <tr><td><span class="badge accepted">Accepted</span></td><td>Customer approved — <strong>cannot be deleted</strong></td></tr>
            <tr><td><span class="badge rejected">Rejected</span></td><td>Customer declined with a reason</td></tr>
          </table>

          <h4>Sending a Quote</h4>
          <ol>
            <li>Open a <strong>Draft</strong> quote and click <strong>Send to Customer</strong>.</li>
            <li>The system generates a unique portal link and sends it via email (SendGrid).</li>
            <li>The customer clicks the link, reviews the itemized quote, and clicks <strong>Accept</strong> or <strong>Decline</strong>.</li>
            <li>Status updates automatically and appears in your Quotes list.</li>
          </ol>

          <h4>Admin Review</h4>
          <ol>
            <li>Admins can <strong>Approve</strong> or <strong>Reject</strong> any quote from the detail view.</li>
            <li>Add internal admin notes when approving/rejecting.</li>
            <li>Download a PDF copy at any time from the quote detail page.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Accepted quotes cannot be deleted to preserve billing records.</div>
        </mat-expansion-panel>

        <!-- CONTRACTORS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">engineering</mat-icon>Step 4 — Contractors &amp; Payments</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Contractors are 1099 subcontractors. Track their information, payments, and generate year-end 1099 reports.</p>
          <ol>
            <li>Navigate to <strong>Contractors</strong> and click <strong>New Contractor</strong>.</li>
            <li>Enter name, email, phone, address, and Tax ID (SSN or EIN) — Tax IDs are stored encrypted and masked in the UI.</li>
            <li>Open a contractor's detail page to log payments as jobs are completed.</li>
            <li>Click <strong>Add Payment</strong>, enter the amount, job description, and payment date.</li>
            <li>At year end, use the <strong>Download 1099</strong> button to generate a pre-filled 1099-NEC PDF.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> The Reports page → <em>Contractor Payments</em> tab shows total paid per contractor for any tax year.</div>
        </mat-expansion-panel>

        <!-- BUDGETS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">account_balance_wallet</mat-icon>Step 5 — Budgets</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Budgets let you plan annual spending by category and track actuals against those targets.</p>
          <ol>
            <li>Navigate to <strong>Budgets</strong> and click <strong>New Budget</strong>.</li>
            <li>Set the year and a name (e.g., "2026 Operating Budget").</li>
            <li>Add line items with category, description, and budgeted amount.</li>
            <li>Open a budget to see <strong>Actuals</strong> — expenses recorded in the same category automatically populate the variance column.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Budget categories should match your Expense categories for accurate variance tracking.</div>
        </mat-expansion-panel>

        <!-- EXPENSES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">receipt_long</mat-icon>Step 6 — Expenses</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Record all business expenses throughout the year. These feed into budget actuals, tax summaries, and expense reports.</p>
          <ol>
            <li>Navigate to <strong>Expenses</strong> and click <strong>Add Expense</strong>.</li>
            <li>Enter date, vendor, category, amount, and an optional description/receipt note.</li>
            <li>Use the <strong>Year</strong> and <strong>Category</strong> filters to find specific expenses.</li>
            <li>Edit or delete individual expense entries as needed.</li>
          </ol>
          <h4>Common Categories</h4>
          <p>Materials, Labor, Equipment, Fuel, Insurance, Marketing, Office, Utilities, Other</p>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Expenses are used to calculate the tax deductions section on the Tax Summary report.</div>
        </mat-expansion-panel>

        <!-- REPORTS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">bar_chart</mat-icon>Step 7 — Reports</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin</span><span class="role-chip accountant">Accountant</span></mat-panel-description>
          </mat-expansion-panel-header>
          <p>Reports aggregate data across the system for financial review and tax preparation.</p>
          <table class="status-table">
            <tr>
              <td><strong>Revenue</strong></td>
              <td>Accepted quote totals by month/quarter. Filter by year or quarter.</td>
            </tr>
            <tr>
              <td><strong>Job Summary</strong></td>
              <td>Count and status breakdown of all jobs for a given year.</td>
            </tr>
            <tr>
              <td><strong>Contractor Payments</strong></td>
              <td>Total paid to each contractor — use for 1099 threshold checks ($600+).</td>
            </tr>
            <tr>
              <td><strong>Expenses</strong></td>
              <td>Total expenses by category for the selected year.</td>
            </tr>
            <tr>
              <td><strong>Tax Summary</strong></td>
              <td>Gross revenue, total expenses, and estimated net taxable income for the year.</td>
            </tr>
          </table>
        </mat-expansion-panel>

        <!-- USER ROLES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="section-icon">manage_accounts</mat-icon>User Roles &amp; Permissions</mat-panel-title>
            <mat-panel-description><span class="role-chip admin">Admin only</span></mat-panel-description>
          </mat-expansion-panel-header>
          <table class="roles-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Admin</th>
                <th>Sales</th>
                <th>Accountant</th>
                <th>Field Worker</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Customers</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Jobs (view)</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td></tr>
              <tr><td>Jobs (edit)</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Quotes</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Contractors</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Budgets</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Expenses</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Reports</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td><td class="n">—</td></tr>
              <tr><td>Delete records</td><td class="y">✓</td><td class="n">—</td><td class="n">—</td><td class="n">—</td></tr>
              <tr><td>User Management</td><td class="y">✓</td><td class="n">—</td><td class="n">—</td><td class="n">—</td></tr>
              <tr><td>Role Impersonation</td><td class="y">✓</td><td class="n">—</td><td class="n">—</td><td class="n">—</td></tr>
            </tbody>
          </table>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Admins can impersonate other roles using the dropdown in the bottom-left of the sidebar to preview the experience without switching accounts.</div>
        </mat-expansion-panel>

      </mat-accordion>
    </div>
  `,
  styles: [`
    .help-container { padding: 24px; max-width: 900px; }
    .help-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .header-icon { font-size: 48px; width: 48px; height: 48px; color: #1B5E20; }
    h1 { font-size: 26px; font-weight: 600; color: #1B5E20; margin: 0 0 4px; }
    .subtitle { color: #757575; margin: 0; font-size: 14px; }

    .workflow-strip {
      display: flex; align-items: center; gap: 8px;
      background: #F1F8E9; border: 1px solid #C5E1A5;
      border-radius: 8px; padding: 14px 20px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .flow-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 64px; }
    .flow-step mat-icon { color: #2E7D32; font-size: 22px; width: 22px; height: 22px; }
    .flow-step span { font-size: 11px; font-weight: 500; color: #2E7D32; }
    .arrow { color: #A5D6A7; font-size: 18px; width: 18px; height: 18px; }

    mat-expansion-panel { margin-bottom: 8px !important; }
    mat-panel-title { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
    mat-panel-description { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .section-icon { color: #2E7D32; font-size: 20px; width: 20px; height: 20px; }

    .role-chip {
      font-size: 10px; padding: 2px 7px; border-radius: 10px;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px;
    }
    .admin { background: #E8F5E9; color: #1B5E20; }
    .sales { background: #E3F2FD; color: #0D47A1; }
    .accountant { background: #FFF8E1; color: #E65100; }
    .fieldworker { background: #F3E5F5; color: #4A148C; }

    ol { padding-left: 20px; line-height: 2; }
    h4 { margin: 16px 0 8px; color: #333; font-size: 14px; font-weight: 600; }

    .status-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 14px; }
    .status-table td { padding: 6px 10px; border-bottom: 1px solid #EEE; vertical-align: top; }
    .status-table tr:last-child td { border-bottom: none; }

    .badge {
      display: inline-block; padding: 2px 10px; border-radius: 12px;
      font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .draft { background: #E0E0E0; color: #424242; }
    .sent { background: #E3F2FD; color: #1565C0; }
    .accepted { background: #E8F5E9; color: #1B5E20; }
    .rejected { background: #FFEBEE; color: #B71C1C; }
    .pending { background: #FFF9C4; color: #F57F17; }
    .inprogress { background: #E3F2FD; color: #1565C0; }
    .completed { background: #E8F5E9; color: #1B5E20; }
    .cancelled { background: #FFEBEE; color: #B71C1C; }

    .tip {
      display: flex; align-items: flex-start; gap: 8px;
      background: #FFF8E1; border-left: 3px solid #F9A825;
      padding: 10px 12px; border-radius: 4px;
      font-size: 13px; color: #555; margin-top: 12px;
    }
    .tip mat-icon { color: #F9A825; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .roles-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; }
    .roles-table th { background: #F5F5F5; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #DDD; }
    .roles-table td { padding: 7px 12px; border-bottom: 1px solid #EEE; }
    .roles-table .y { color: #2E7D32; font-weight: 700; text-align: center; }
    .roles-table .n { color: #BDBDBD; text-align: center; }
  `]
})
export class HelpComponent {}
