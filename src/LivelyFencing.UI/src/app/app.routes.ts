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
  {
    path: 'portal/listings',
    loadComponent: () => import('./features/listings/listings-search.component').then(m => m.ListingsSearchComponent),
    canActivate: [authGuard(['Admin', 'FMLSApprover'])]
  },
  {
    path: 'portal/listings/:key',
    loadComponent: () => import('./features/listings/listing-detail.component').then(m => m.ListingDetailComponent),
    canActivate: [authGuard(['Admin', 'FMLSApprover'])]
  },
  { path: 'unauthorized', loadComponent: () => import('./features/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
  {
    path: 'cq/transactions',
    loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/showings',
    loadComponent: () => import('./features/showings/showings.component').then(m => m.ShowingsComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/open-houses',
    loadComponent: () => import('./features/open-houses/open-houses.component').then(m => m.OpenHousesComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/email-templates',
    loadComponent: () => import('./features/email-templates/email-templates.component').then(m => m.EmailTemplatesComponent),
    canActivate: [authGuard(['Admin', 'Sales'])]
  },
  {
    path: 'cq/analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard(['Admin', 'Sales', 'Accountant'])]
  },
  {
    path: 'portal/my-listings',
    loadComponent: () => import('./features/listings/my-listings.component').then(m => m.MyListingsComponent),
    canActivate: [authGuard(['Admin', 'FMLSApprover'])]
  },
  { path: '**', redirectTo: '/cq/dashboard' }
];
