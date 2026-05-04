import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'cq/dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant', 'FieldWorker'])]
  },
  {
    path: 'cq/customers',
    loadComponent: () => import('./features/customers/customer-list.component').then(m => m.CustomerListComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant'])]
  },
  {
    path: 'cq/customers/:id',
    loadComponent: () => import('./features/customers/customer-detail.component').then(m => m.CustomerDetailComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant'])]
  },
  {
    path: 'cq/jobs',
    loadComponent: () => import('./features/jobs/job-list.component').then(m => m.JobListComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant', 'FieldWorker'])]
  },
  {
    path: 'cq/jobs/:id',
    loadComponent: () => import('./features/jobs/job-detail.component').then(m => m.JobDetailComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant', 'FieldWorker'])]
  },
  {
    path: 'cq/quotes',
    loadComponent: () => import('./features/quotes/quote-list.component').then(m => m.QuoteListComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant'])]
  },
  {
    path: 'cq/quotes/:id',
    loadComponent: () => import('./features/quotes/quote-detail.component').then(m => m.QuoteDetailComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant'])]
  },
  {
    path: 'cq/contractors',
    loadComponent: () => import('./features/contractors/contractor-list.component').then(m => m.ContractorListComponent),
    canActivate: [authGuard(['Admin', 'Accountant'])]
  },
  {
    path: 'cq/contractors/:id',
    loadComponent: () => import('./features/contractors/contractor-detail.component').then(m => m.ContractorDetailComponent),
    canActivate: [authGuard(['Admin', 'Accountant'])]
  },
  {
    path: 'cq/budgets',
    loadComponent: () => import('./features/budgets/budget-list.component').then(m => m.BudgetListComponent),
    canActivate: [authGuard(['Admin', 'Accountant'])]
  },
  {
    path: 'cq/reports',
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [authGuard(['Admin', 'Accountant'])]
  },
  {
    path: 'portal/quotes/:token',
    loadComponent: () => import('./features/portal/portal-quote.component').then(m => m.PortalQuoteComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant', 'FieldWorker', 'Customer'])]
  },
  {
    path: 'cq/expenses',
    loadComponent: () => import('./features/expenses/expense-list.component').then(m => m.ExpenseListComponent),
    canActivate: [authGuard(['Admin', 'Accountant'])]
  },
  {
    path: 'cq/income',
    loadComponent: () => import('./features/income/income-list.component').then(m => m.IncomeListComponent),
  },
  {
    path: 'cq/admin/users',
    loadComponent: () => import('./features/admin/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [authGuard(['Admin'])]
  },
  {
    path: 'cq/admin/carousel',
    loadComponent: () => import('./features/admin/carousel-management.component').then(m => m.CarouselManagementComponent),
    canActivate: [authGuard(['Admin'])]
  },
  {
    path: 'cq/admin/reviews',
    loadComponent: () => import('./features/admin/reviews-management.component').then(m => m.ReviewsManagementComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/leads',
    loadComponent: () => import('./features/leads/leads.component').then(m => m.LeadsComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/help',
    loadComponent: () => import('./features/help/help.component').then(m => m.HelpComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant', 'FieldWorker'])]
  },
  { path: 'unauthorized', loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
  { path: '**', redirectTo: '/cq/dashboard' }
];
