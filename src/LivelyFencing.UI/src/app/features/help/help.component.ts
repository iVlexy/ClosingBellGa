import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatExpansionModule, MatDividerModule],
  template: `
    <div class="help-container">
      <div class="help-header">
        <mat-icon class="header-icon">menu_book</mat-icon>
        <div>
          <h1>Agent Workflow Guide</h1>
          <p class="subtitle">End-to-end reference for the Closing Bell GA real estate CRM</p>
        </div>
      </div>

      <!-- Workflow strip -->
      <div class="workflow-strip">
        <div class="flow-step"><mat-icon>person_search</mat-icon><span>Lead</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>people</mat-icon><span>Client</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>home_search</mat-icon><span>Showings</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>swap_horiz</mat-icon><span>Pipeline</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>verified</mat-icon><span>Closed</span></div>
        <mat-icon class="arrow">arrow_forward</mat-icon>
        <div class="flow-step"><mat-icon>analytics</mat-icon><span>Analytics</span></div>
      </div>

      <mat-accordion multi>

        <!-- LEADS -->
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">person_search</mat-icon>Step 1 — Leads</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Leads are prospective buyers or sellers who haven't yet become active clients. Capturing them early lets you track where they came from and how they convert.</p>
          <ol>
            <li>Navigate to <strong>Leads</strong> in the sidebar.</li>
            <li>Click <strong>New Lead</strong> and enter name, phone, email, and <strong>Lead Source</strong> (Referral, Zillow, Website, etc.).</li>
            <li>Set a <strong>Status</strong>: New → Contacted → Qualified → Converted / Lost.</li>
            <li>Add notes to record conversations and follow-up dates.</li>
            <li>When a lead is ready, click <strong>Convert to Client</strong> — this creates a Client record and links it back to the lead source for funnel reporting.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Lead source is used in the Analytics → Pipeline Funnel report to show which channels produce closed deals.</div>
        </mat-expansion-panel>

        <!-- CLIENTS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">people</mat-icon>Step 2 — Clients</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span><span class="chip accountant">Accountant</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Clients are active buyers or sellers. Each client has a detail page with four tabs:</p>
          <table class="info-table">
            <tr><td><strong>Activity Notes</strong></td><td>Log every call, email, meeting, or showing interaction with a type badge and timestamp.</td></tr>
            <tr><td><strong>Buyer Criteria</strong></td><td>Record price range, bed/bath requirements, preferred areas, must-haves, and deal breakers. Updates any time as the search evolves.</td></tr>
            <tr><td><strong>Transactions</strong></td><td>View all deals linked to this client with status and expected commission at a glance.</td></tr>
            <tr><td><strong>Listings</strong></td><td>See properties the client has liked or passed on via the client portal.</td></tr>
          </table>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Always log a note after any client contact — it keeps a permanent record and helps with follow-up timing.</div>
        </mat-expansion-panel>

        <!-- LISTINGS & PORTAL -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">home_work</mat-icon>Step 3 — Listings &amp; Client Portal</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>The Listings page connects to your MLS feed and lets clients react to properties directly from their portal link.</p>
          <ol>
            <li>Navigate to <strong>Listings</strong> to search active MLS listings by location, price, beds, and baths.</li>
            <li>Click a listing card to see full details, photos, and map.</li>
            <li>Clients can access their personal portal link (sent by the agent) to browse listings and mark them <strong>Like</strong> or <strong>Pass</strong>.</li>
            <li>Reactions sync to the client's <strong>Listings</strong> tab in their detail page — no manual entry needed.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Use client preferences (price, beds, area) to pre-filter listings before sharing a portal link so clients only see relevant properties.</div>
        </mat-expansion-panel>

        <!-- SHOWINGS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">home_search</mat-icon>Step 4 — Showings</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Log every property tour in the Showings log. This creates a record tied to the client and informs the pipeline funnel analytics.</p>
          <ol>
            <li>Navigate to <strong>Showings</strong> and click <strong>Log Showing</strong>.</li>
            <li>Select the client, enter the property address (and optional MLS key), and set the showing date.</li>
            <li>After the tour, edit the showing to add a <strong>star rating</strong> (1–5) and feedback notes from the client.</li>
            <li>Use the showing history to spot patterns — repeated low ratings may indicate the criteria need to be updated.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Showings appear in the Pipeline Funnel report, showing how many clients progressed from touring to submitting an offer.</div>
        </mat-expansion-panel>

        <!-- OPEN HOUSES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">meeting_room</mat-icon>Step 5 — Open Houses</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Capture walk-in attendee information at open house events. Each record is grouped by property and event date.</p>
          <ol>
            <li>Navigate to <strong>Open Houses</strong> and click <strong>Add Attendee</strong>.</li>
            <li>Enter the property address, event date, and the attendee's name, phone, and email.</li>
            <li>Check <strong>Pre-approved buyer</strong> if they've confirmed financing — a great signal for immediate follow-up.</li>
            <li>Add agent notes while the conversation is fresh (financing situation, timeline, interest level).</li>
            <li>Follow up warm leads by converting them to clients via the Leads page.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> All attendees for the same address + date are grouped into one event panel for easy review.</div>
        </mat-expansion-panel>

        <!-- PIPELINE -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">swap_horiz</mat-icon>Step 6 — Deal Pipeline</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>The Pipeline is a Kanban board that tracks every active transaction from first contact to close. Click any card to see full details and manage documents.</p>

          <h4>Pipeline Stages</h4>
          <table class="info-table">
            <tr><td><span class="badge" style="background:#607d8b;color:#fff">Prospecting</span></td><td>Initial contact — no offer yet</td></tr>
            <tr><td><span class="badge" style="background:#1565C0;color:#fff">Offer Submitted</span></td><td>Offer written and submitted to seller</td></tr>
            <tr><td><span class="badge" style="background:#6A1B9A;color:#fff">Under Contract</span></td><td>Offer accepted — in escrow</td></tr>
            <tr><td><span class="badge" style="background:#E65100;color:#fff">Inspection</span></td><td>Home inspection period active</td></tr>
            <tr><td><span class="badge" style="background:#BF360C;color:#fff">Appraisal</span></td><td>Lender appraisal ordered / in progress</td></tr>
            <tr><td><span class="badge" style="background:#558B2F;color:#fff">Clear to Close</span></td><td>Lender has issued CTC — closing scheduled</td></tr>
            <tr><td><span class="badge" style="background:#2E7D32;color:#fff">Closed</span></td><td>Title transferred, commission earned</td></tr>
            <tr><td><span class="badge" style="background:#c62828;color:#fff">Fall Through</span></td><td>Deal did not close — track for future follow-up</td></tr>
          </table>

          <h4>Document Checklist</h4>
          <p>Each transaction has a document checklist. Open a deal card and click <strong>Add Doc</strong> to track:</p>
          <table class="info-table">
            <tr><td><strong>Pending</strong></td><td>Not yet sent or received</td></tr>
            <tr><td><strong>Sent</strong></td><td>Sent to the appropriate party</td></tr>
            <tr><td><strong>Signed</strong></td><td>Signed by all parties</td></tr>
            <tr><td><strong>Received</strong></td><td>In possession / uploaded</td></tr>
            <tr><td><strong>Not Required</strong></td><td>Waived or not applicable</td></tr>
          </table>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Commission Expected and Commission Received are tracked separately — close the gap in the detail view to confirm you've been paid.</div>
        </mat-expansion-panel>

        <!-- EMAIL TEMPLATES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">mail_outline</mat-icon>Step 7 — Email Templates</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Store and reuse pre-written follow-up email templates organized by stage of the buying/selling process.</p>
          <ol>
            <li>Navigate to <strong>Email Templates</strong> and click <strong>New Template</strong>.</li>
            <li>Give the template a name, select its stage (New Inquiry, Post-Showing, Pre-Offer, etc.), and write the subject and body.</li>
            <li>Use placeholders like <code>[ClientName]</code>, <code>[Address]</code>, and <code>[Date]</code> — replace them manually before sending.</li>
            <li>Click <strong>Copy</strong> on any template card to copy the full subject + body to your clipboard, then paste into your email client.</li>
            <li>Toggle a template <strong>Inactive</strong> to hide it from view without deleting it.</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Build templates for every stage — a quick follow-up after showings and open houses dramatically improves conversion rates.</div>
        </mat-expansion-panel>

        <!-- ANALYTICS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">analytics</mat-icon>Step 8 — Analytics</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip sales">Sales</span><span class="chip accountant">Accountant</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Analytics gives you a data-driven view of your business performance for any calendar year.</p>
          <table class="info-table">
            <tr>
              <td><strong>GCI Summary</strong></td>
              <td>Total closings, total sales volume, and Gross Commission Income for the selected year. Monthly bar chart shows seasonal trends.</td>
            </tr>
            <tr>
              <td><strong>Pipeline Funnel</strong></td>
              <td>Breaks down your leads by source (Referral, Zillow, Website, etc.) and shows the percentage that converted to clients, had showings, submitted offers, and closed. Identify your best-performing lead sources.</td>
            </tr>
          </table>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Change the year selector in the top-right to compare performance year over year.</div>
        </mat-expansion-panel>

        <!-- REPORTS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">bar_chart</mat-icon>Reports</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip accountant">Accountant</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>The Reports page provides financial summaries for accounting and tax preparation.</p>
          <table class="info-table">
            <tr><td><strong>Revenue</strong></td><td>Income by month/quarter from accepted quotes and closed transactions.</td></tr>
            <tr><td><strong>Job Summary</strong></td><td>Count and status breakdown of all jobs for a given year.</td></tr>
            <tr><td><strong>Contractor Payments</strong></td><td>Total paid to each subcontractor — use for 1099 threshold checks ($600+).</td></tr>
            <tr><td><strong>Expenses</strong></td><td>Total expenses by category for the selected year.</td></tr>
            <tr><td><strong>Tax Summary</strong></td><td>Gross revenue minus total deductible expenses = estimated net taxable income.</td></tr>
          </table>
        </mat-expansion-panel>

        <!-- EXPENSES & INCOME -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">receipt_long</mat-icon>Expenses &amp; Income</mat-panel-title>
            <mat-panel-description>
              <span class="chip admin">Admin</span><span class="chip accountant">Accountant</span>
            </mat-panel-description>
          </mat-expansion-panel-header>
          <p>Track all business expenses and non-commission income entries throughout the year. These feed into budget actuals and tax summaries.</p>
          <ol>
            <li>Navigate to <strong>Expenses</strong> and click <strong>Add Expense</strong>.</li>
            <li>Enter date, vendor, category, and amount. Use the filters to find entries by year or category.</li>
            <li>Navigate to <strong>Income</strong> to record any non-commission income (referral fees, rental income, etc.).</li>
          </ol>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Consistent expense categories improve tax summary accuracy. Match them to your Budgets for variance tracking.</div>
        </mat-expansion-panel>

        <!-- PERMISSIONS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title><mat-icon class="si">manage_accounts</mat-icon>User Roles &amp; Permissions</mat-panel-title>
            <mat-panel-description><span class="chip admin">Admin only</span></mat-panel-description>
          </mat-expansion-panel-header>
          <div class="table-scroll">
            <table class="roles-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Admin</th>
                  <th>Sales</th>
                  <th>Accountant</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Leads</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Clients</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓ (read)</td></tr>
                <tr><td>Listings / Portal</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Showings</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Open Houses</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Pipeline / Transactions</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Email Templates</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>
                <tr><td>Analytics</td><td class="y">✓</td><td class="y">✓</td><td class="y">✓</td></tr>
                <tr><td>Reports</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td></tr>
                <tr><td>Expenses / Income</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td></tr>
                <tr><td>Budgets</td><td class="y">✓</td><td class="n">—</td><td class="y">✓</td></tr>
                <tr><td>Delete records</td><td class="y">✓</td><td class="n">—</td><td class="n">—</td></tr>
                <tr><td>User Management</td><td class="y">✓</td><td class="n">—</td><td class="n">—</td></tr>
              </tbody>
            </table>
          </div>
          <div class="tip"><mat-icon>lightbulb</mat-icon> Admins can impersonate other roles using the dropdown in the sidebar to preview the experience without switching accounts.</div>
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
    .flow-step { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 60px; }
    .flow-step mat-icon { color: #2E7D32; font-size: 22px; width: 22px; height: 22px; }
    .flow-step span { font-size: 11px; font-weight: 500; color: #2E7D32; }
    .arrow { color: #A5D6A7; font-size: 18px; width: 18px; height: 18px; }

    mat-expansion-panel { margin-bottom: 8px !important; }
    mat-panel-title { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
    mat-panel-description { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .si { color: #2E7D32; font-size: 20px; width: 20px; height: 20px; }

    .chip { font-size: 10px; padding: 2px 7px; border-radius: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
    .admin { background: #E8F5E9; color: #1B5E20; }
    .sales { background: #E3F2FD; color: #0D47A1; }
    .accountant { background: #FFF8E1; color: #E65100; }

    ol { padding-left: 20px; line-height: 2; }
    h4 { margin: 16px 0 8px; color: #333; font-size: 14px; font-weight: 600; }
    code { background: #f5f5f5; padding: 1px 5px; border-radius: 3px; font-size: 12px; }

    .info-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 14px; }
    .info-table td { padding: 7px 10px; border-bottom: 1px solid #EEE; vertical-align: top; }
    .info-table tr:last-child td { border-bottom: none; }
    .info-table td:first-child { white-space: nowrap; width: 1%; padding-right: 16px; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }

    .tip {
      display: flex; align-items: flex-start; gap: 8px;
      background: #FFF8E1; border-left: 3px solid #F9A825;
      padding: 10px 12px; border-radius: 4px;
      font-size: 13px; color: #555; margin-top: 12px;
    }
    .tip mat-icon { color: #F9A825; font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .table-scroll { overflow-x: auto; }
    .roles-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 8px; min-width: 400px; }
    .roles-table th { background: #F5F5F5; padding: 8px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #DDD; }
    .roles-table td { padding: 7px 12px; border-bottom: 1px solid #EEE; }
    .roles-table .y { color: #2E7D32; font-weight: 700; text-align: center; }
    .roles-table .n { color: #BDBDBD; text-align: center; }

    @media (max-width: 600px) {
      .help-container { padding: 16px; }
      .help-header { gap: 10px; }
      .header-icon { font-size: 36px; width: 36px; height: 36px; }
      h1 { font-size: 20px; }
      .workflow-strip { gap: 4px; padding: 10px 12px; }
      .flow-step { min-width: 44px; }
      .flow-step span { font-size: 9px; }
      .arrow { font-size: 14px; width: 14px; height: 14px; }
      .info-table td:first-child { white-space: normal; }
    }
  `]
})
export class HelpComponent {}
