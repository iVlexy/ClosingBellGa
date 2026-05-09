import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // Customers
  getCustomers(search?: string) { return this.http.get<any[]>(`${this.base}/customers`, { params: search ? { search } : {} }); }
  getCustomer(id: string) { return this.http.get<any>(`${this.base}/customers/${id}`); }
  createCustomer(data: any) { return this.http.post<any>(`${this.base}/customers`, data); }
  updateCustomer(id: string, data: any) { return this.http.put<any>(`${this.base}/customers/${id}`, data); }
  deleteCustomer(id: string) { return this.http.delete(`${this.base}/customers/${id}`); }

  // Jobs
  getJobs(customerId?: string, status?: string) {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId);
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.base}/jobs`, { params });
  }
  getJob(id: string) { return this.http.get<any>(`${this.base}/jobs/${id}`); }
  createJob(data: any) { return this.http.post<any>(`${this.base}/jobs`, data); }
  updateJob(id: string, data: any) { return this.http.put<any>(`${this.base}/jobs/${id}`, data); }
  updateJobStatus(id: string, status: string) { return this.http.patch<any>(`${this.base}/jobs/${id}/status`, { status }); }
  deleteJob(id: string) { return this.http.delete(`${this.base}/jobs/${id}`); }



  // Budgets
  getBudgets(year?: number) { return this.http.get<any[]>(`${this.base}/budgets`, { params: year ? { year } : {} }); }
  getBudget(id: string) { return this.http.get<any>(`${this.base}/budgets/${id}`); }
  getBudgetActuals(id: string) { return this.http.get<any>(`${this.base}/budgets/${id}/actuals`); }
  createBudget(data: any) { return this.http.post<any>(`${this.base}/budgets`, data); }
  updateBudget(id: string, data: any) { return this.http.put<any>(`${this.base}/budgets/${id}`, data); }
  deleteBudget(id: string) { return this.http.delete(`${this.base}/budgets/${id}`); }

  // Reports
  getJobSummaryReport(year: number) { return this.http.get<any>(`${this.base}/reports/job-summary`, { params: { year } }); }
  getExpenseReport(year: number) { return this.http.get<any>(`${this.base}/reports/expenses`, { params: { year } }); }
  getTaxSummaryReport(year: number) { return this.http.get<any>(`${this.base}/reports/tax-summary`, { params: { year } }); }

  // Expenses
  getExpenses(year?: number, category?: string) {
    let params = new HttpParams();
    if (year) params = params.set('year', year);
    if (category) params = params.set('category', category);
    return this.http.get<any[]>(`${this.base}/expenses`, { params });
  }
  createExpense(data: any) { return this.http.post<any>(`${this.base}/expenses`, data); }
  updateExpense(id: string, data: any) { return this.http.put<any>(`${this.base}/expenses/${id}`, data); }
  deleteExpense(id: string) { return this.http.delete(`${this.base}/expenses/${id}`); }
  getIncomes(year?: number, category?: string) {
    const params: any = {};
    if (year) params['year'] = year;
    if (category) params['category'] = category;
    return this.http.get<any[]>(`${this.base}/incomes`, { params });
  }
  createIncome(data: any) { return this.http.post<any>(`${this.base}/incomes`, data); }
  updateIncome(id: string, data: any) { return this.http.put<any>(`${this.base}/incomes/${id}`, data); }
  deleteIncome(id: string) { return this.http.delete(`${this.base}/incomes/${id}`); }
  getIncomeReport(year: number) { return this.http.get<any>(`${this.base}/reports/income`, { params: { year } }); }


  // Leads
  getLeads() { return this.http.get<any[]>(`${this.base}/contact`); }
  markLeadContacted(id: string) { return this.http.patch(`${this.base}/contact/${id}/contacted`, {}); }
  createManualLead(data: { name: string; email: string; phone?: string; message?: string; source: string }) { return this.http.post<any>(`${this.base}/contact/manual`, data); }
  markLeadConverted(id: string, customerId: string | null) { return this.http.patch(`${this.base}/contact/${id}/converted`, { customerId }); }

  // Public
  submitContactRequest(data: {name: string; email: string; phone: string; message: string; source?: string; hasLender?: boolean; lenderName?: string}) {
    return this.http.post<any>(`${this.base}/contact`, data);
  }

  // Users
  getUsers() { return this.http.get<any[]>(`${this.base}/users`); }
  updateUserRole(id: string, role: string) { return this.http.patch<any>(`${this.base}/users/${id}/role`, { role }); }
  setUserActive(id: string, isActive: boolean) { return this.http.patch(`${this.base}/users/${id}/active`, { isActive }); }

  // Site Settings
  getCarouselUploadUrl() { return this.http.post<{uploadUrl: string; imageId: string; publicUrl: string}>(`${this.base}/site-settings/carousel/upload-url`, {}); }
  getCarouselImages() { return this.http.get<string[]>(`${this.base}/site-settings/carousel`); }
  updateCarouselImages(images: string[]) { return this.http.put<string[]>(`${this.base}/site-settings/carousel`, images); }

  // Reviews
  getReviews() { return this.http.get<any[]>(`${this.base}/reviews`); }
  submitReview(data: { reviewerName: string; reviewerEmail?: string; rating: number; comment: string }) { return this.http.post<any>(`${this.base}/reviews`, data); }
  getAllReviews() { return this.http.get<any[]>(`${this.base}/reviews/all`); }
  approveReview(id: string) { return this.http.patch<any>(`${this.base}/reviews/${id}/approve`, {}); }
  deleteReview(id: string) { return this.http.delete(`${this.base}/reviews/${id}`); }
  syncGoogleReviews() { return this.http.post<any>(`${this.base}/reviews/sync-google`, {}); }
  // Listings (Bridge Data Output / FMLS proxy)
  searchListings(params: any = {}) { return this.http.get<any>(`${this.base}/listings`, { params }); }
  getListing(key: string) { return this.http.get<any>(`${this.base}/listings/${key}`); }

  // Listing Preferences
  getListingPreferences(customerId: string) { return this.http.get<any[]>(`${this.base}/listing-preferences`, { params: { customerId } }); }
  getMyListingPreferences() { return this.http.get<any[]>(`${this.base}/listing-preferences/my`); }
  reactToListing(data: any) { return this.http.post<any>(`${this.base}/listing-preferences`, data); }
  deleteListingPreference(id: string) { return this.http.delete(`${this.base}/listing-preferences/${id}`); }

  // Transactions
  getTransactions(clientId?: string, status?: string) {
    const params: any = {};
    if (clientId) params['clientId'] = clientId;
    if (status) params['status'] = status;
    return this.http.get<any[]>(`${this.base}/transactions`, { params });
  }
  getTransaction(id: string) { return this.http.get<any>(`${this.base}/transactions/${id}`); }
  createTransaction(data: any) { return this.http.post<any>(`${this.base}/transactions`, data); }
  updateTransaction(id: string, data: any) { return this.http.put<any>(`${this.base}/transactions/${id}`, data); }
  updateTransactionStatus(id: string, status: string) { return this.http.patch<any>(`${this.base}/transactions/${id}/status`, { status }); }
  deleteTransaction(id: string) { return this.http.delete(`${this.base}/transactions/${id}`); }
  addTransactionDoc(txId: string, data: any) { return this.http.post<any>(`${this.base}/transactions/${txId}/documents`, data); }
  updateTransactionDoc(txId: string, docId: string, data: any) { return this.http.put<any>(`${this.base}/transactions/${txId}/documents/${docId}`, data); }
  deleteTransactionDoc(txId: string, docId: string) { return this.http.delete(`${this.base}/transactions/${txId}/documents/${docId}`); }

  // Showings
  getShowings(clientId?: string) { return this.http.get<any[]>(`${this.base}/showings`, { params: clientId ? { clientId } : {} }); }
  createShowing(data: any) { return this.http.post<any>(`${this.base}/showings`, data); }
  updateShowing(id: string, data: any) { return this.http.put<any>(`${this.base}/showings/${id}`, data); }
  deleteShowing(id: string) { return this.http.delete(`${this.base}/showings/${id}`); }

  // Open Houses
  getOpenHouses(address?: string) { return this.http.get<any[]>(`${this.base}/open-houses`, { params: address ? { address } : {} }); }
  createOpenHouseAttendee(data: any) { return this.http.post<any>(`${this.base}/open-houses`, data); }
  updateOpenHouseAttendee(id: string, data: any) { return this.http.put<any>(`${this.base}/open-houses/${id}`, data); }
  deleteOpenHouseAttendee(id: string) { return this.http.delete(`${this.base}/open-houses/${id}`); }

  // Email Templates
  getEmailTemplates() { return this.http.get<any[]>(`${this.base}/email-templates`); }
  createEmailTemplate(data: any) { return this.http.post<any>(`${this.base}/email-templates`, data); }
  updateEmailTemplate(id: string, data: any) { return this.http.put<any>(`${this.base}/email-templates/${id}`, data); }
  deleteEmailTemplate(id: string) { return this.http.delete(`${this.base}/email-templates/${id}`); }
  sendEmailTemplate(id: string, data: { clientId: string, address: string }) { return this.http.post(`${this.base}/email-templates/${id}/send`, data); }

  // Client Notes
  getClientNotes(clientId: string) { return this.http.get<any[]>(`${this.base}/client-notes`, { params: { clientId } }); }
  createClientNote(data: any) { return this.http.post<any>(`${this.base}/client-notes`, data); }
  deleteClientNote(id: string) { return this.http.delete(`${this.base}/client-notes/${id}`); }

  // Buyer Preferences
  getBuyerPreferences(clientId: string) { return this.http.get<any>(`${this.base}/buyer-preferences/${clientId}`); }
  saveBuyerPreferences(clientId: string, data: any) { return this.http.put<any>(`${this.base}/buyer-preferences/${clientId}`, data); }

  // Analytics
  getPipelineFunnel() { return this.http.get<any[]>(`${this.base}/reports/pipeline-funnel`); }
  getGciSummary(year: number) { return this.http.get<any>(`${this.base}/reports/gci-summary`, { params: { year } }); }

}