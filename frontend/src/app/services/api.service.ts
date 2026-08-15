import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Building {
  id: number; name: string; street: string; city: string; zipCode: string; country: string;
}
export interface Landlord {
  id: number; firstName: string; lastName: string; email: string; phone: string;
  street: string; city: string; zipCode: string; country: string;
}
export interface Property {
  id: number; name: string; size: string; kind: string; location: string;
  description?: string; imageUrl?: string; rent?: number; buildingId?: number; landlordId?: number;
}
export interface PropertyDetails {
  id: number; name: string; size: string; kind: string; location: string; description?: string; imageUrl?: string; rent?: number;
  building?: { id: number; name: string; street: string; city: string; zipCode: string; country: string };
  landlord?: { id: number; firstName: string; lastName: string; email: string; phone: string };
  lease?: { id: number; startDate: string; endDate: string; rentAmount: number; currency: string };
  tenant?: { id: number; firstName: string; lastName: string; email: string; phone: string };
}
export interface Tenant {
  id: number; firstName: string; lastName: string; email: string; phone: string;
  street: string; city: string; zipCode: string; country: string;
}
export interface Lease {
  id: number; signatureDate?: string; startDate: string; endDate: string;
  rentAmount: number; currency: string; propertyId?: number; tenantId?: number;
}
export interface Payment {
  id: number; leaseId: number; period: string; amount: number;
  status: string; paidDate?: string; tenantName?: string; propertyName?: string;
}
export interface PaymentStats {
  totalPaid: number; totalPending: number; totalLate: number;
}
export interface Document {
  id: number; name: string; docType: string; createdAt: string;
  propertyId?: number; tenantId?: number; hasFile?: boolean; fileName?: string;
}
export interface MonthCell {
  month: number; label: string;
  status: 'PAID' | 'PENDING' | 'LATE' | 'NONE' | string;
  amount: number; paidDate?: string;
}
export interface TenantPaymentHistory {
  tenantId: number; tenantName: string; propertyName?: string; year: number;
  months: MonthCell[];
  totalEncaisse: number; totalEnAttente: number; totalRetard: number;
}
export interface DashboardStats {
  totalProperties: number; activeTenants: number; monthlyRevenue: number; occupancyRate: number;
}
export interface StatementLine {
  date: string; label: string; debit: number | null; credit: number | null; balance: number;
}
export interface DueMonth {
  period: string; label: string; amount: number; status: 'LATE' | 'CURRENT' | string;
}
export interface Application {
  id: number; propertyId?: number; propertyName?: string;
  firstName: string; lastName: string; email: string; phone?: string;
  message?: string; status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string; createdAt?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  private readonly api = '/api';

  // Buildings
  getBuildings(): Observable<Building[]> { return this.http.get<Building[]>(`${this.api}/buildings`); }
  addBuilding(b: Omit<Building, 'id'>): Observable<Building> { return this.http.post<Building>(`${this.api}/buildings`, b); }
  modifyBuilding(id: number, b: Omit<Building, 'id'>): Observable<Building> { return this.http.put<Building>(`${this.api}/buildings/${id}`, b); }
  deleteBuilding(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/buildings/${id}`); }

  // Properties
  getProperties(): Observable<Property[]> { return this.http.get<Property[]>(`${this.api}/properties`); }
  getPropertyDetails(): Observable<PropertyDetails[]> { return this.http.get<PropertyDetails[]>(`${this.api}/properties/details`); }
  getPropertyDetail(id: number): Observable<PropertyDetails> { return this.http.get<PropertyDetails>(`${this.api}/properties/${id}/details`); }
  getAvailableProperties(): Observable<PropertyDetails[]> { return this.http.get<PropertyDetails[]>(`${this.api}/properties/available`); }
  createProperty(p: Omit<Property, 'id'>): Observable<Property> { return this.http.post<Property>(`${this.api}/properties`, p); }
  updateProperty(id: number, p: Partial<Property>): Observable<Property> { return this.http.put<Property>(`${this.api}/properties/${id}`, p); }
  deleteProperty(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/properties/${id}`); }

  // Tenants
  getTenants(): Observable<Tenant[]> { return this.http.get<Tenant[]>(`${this.api}/tenants`); }
  getTenant(id: number): Observable<Tenant> { return this.http.get<Tenant>(`${this.api}/tenants/${id}`); }
  createTenant(t: Omit<Tenant, 'id'>): Observable<Tenant> { return this.http.post<Tenant>(`${this.api}/tenants`, t); }
  updateTenant(id: number, t: Partial<Tenant>): Observable<Tenant> { return this.http.put<Tenant>(`${this.api}/tenants/${id}`, t); }
  deleteTenant(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/tenants/${id}`); }

  // Landlords
  getLandlords(): Observable<Landlord[]> { return this.http.get<Landlord[]>(`${this.api}/landlords`); }
  getLandlord(id: number): Observable<Landlord> { return this.http.get<Landlord>(`${this.api}/landlords/${id}`); }
  createLandlord(l: Omit<Landlord, 'id'>): Observable<Landlord> { return this.http.post<Landlord>(`${this.api}/landlords`, l); }
  updateLandlord(id: number, l: Partial<Landlord>): Observable<Landlord> { return this.http.put<Landlord>(`${this.api}/landlords/${id}`, l); }
  deleteLandlord(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/landlords/${id}`); }

  // Leases
  getLeases(): Observable<Lease[]> { return this.http.get<Lease[]>(`${this.api}/leases`); }
  getLease(id: number): Observable<Lease> { return this.http.get<Lease>(`${this.api}/leases/${id}`); }
  createLease(l: Omit<Lease, 'id'>): Observable<Lease> { return this.http.post<Lease>(`${this.api}/leases`, l); }
  updateLease(id: number, l: Partial<Lease>): Observable<Lease> { return this.http.put<Lease>(`${this.api}/leases/${id}`, l); }
  deleteLease(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/leases/${id}`); }
  getStatement(leaseId: number): Observable<StatementLine[]> { return this.http.get<StatementLine[]>(`${this.api}/leases/${leaseId}/statement`); }

  // Applications (candidatures)
  getApplications(propertyId?: number): Observable<Application[]> {
    let p = new HttpParams();
    if (propertyId) p = p.set('propertyId', propertyId);
    return this.http.get<Application[]>(`${this.api}/applications`, { params: p });
  }
  createApplication(a: Omit<Application, 'id' | 'status'>): Observable<Application> { return this.http.post<Application>(`${this.api}/applications`, a); }
  updateApplicationStatus(id: number, status: string): Observable<Application> { return this.http.put<Application>(`${this.api}/applications/${id}/status`, { status }); }
  deleteApplication(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/applications/${id}`); }

  // Payments
  getPayments(params?: { leaseId?: number; status?: string }): Observable<Payment[]> {
    let p = new HttpParams();
    if (params?.leaseId) p = p.set('leaseId', params.leaseId);
    if (params?.status) p = p.set('status', params.status);
    return this.http.get<Payment[]>(`${this.api}/payments`, { params: p });
  }
  getPaymentStats(): Observable<PaymentStats> { return this.http.get<PaymentStats>(`${this.api}/payments/stats`); }
  getTenantPaymentHistory(tenantId: number, year?: number): Observable<TenantPaymentHistory> {
    let p = new HttpParams();
    if (year) p = p.set('year', year);
    return this.http.get<TenantPaymentHistory>(`${this.api}/payments/tenant/${tenantId}/history`, { params: p });
  }
  // Paiement en ligne Stripe
  createCheckout(leaseId: number, period?: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.api}/payments/checkout`, { leaseId, period });
  }
  confirmCheckout(sessionId: string): Observable<Payment> {
    return this.http.post<Payment>(`${this.api}/payments/confirm`, { sessionId });
  }
  createPayment(pay: Omit<Payment, 'id'>): Observable<Payment> { return this.http.post<Payment>(`${this.api}/payments`, pay); }
  updatePayment(id: number, pay: Partial<Payment>): Observable<Payment> { return this.http.put<Payment>(`${this.api}/payments/${id}`, pay); }
  deletePayment(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/payments/${id}`); }

  // Documents
  getDocuments(params?: { propertyId?: number; tenantId?: number }): Observable<Document[]> {
    let p = new HttpParams();
    if (params?.propertyId) p = p.set('propertyId', params.propertyId);
    if (params?.tenantId) p = p.set('tenantId', params.tenantId);
    return this.http.get<Document[]>(`${this.api}/documents`, { params: p });
  }
  createDocument(d: Omit<Document, 'id'>): Observable<Document> { return this.http.post<Document>(`${this.api}/documents`, d); }
  deleteDocument(id: number): Observable<void> { return this.http.delete<void>(`${this.api}/documents/${id}`); }
  generateQuittances(): Observable<Document[]> { return this.http.post<Document[]>(`${this.api}/documents/generate-quittances`, {}); }
  generateBail(leaseId: number): Observable<Document> { return this.http.post<Document>(`${this.api}/documents/generate-bail`, { leaseId }); }
  generateQuittance(leaseId: number, year: number, month: number): Observable<Document> { return this.http.post<Document>(`${this.api}/documents/generate-quittance`, { leaseId, year, month }); }
  uploadDocument(form: FormData): Observable<Document> { return this.http.post<Document>(`${this.api}/documents/upload`, form); }
  downloadDocument(id: number): Observable<Blob> { return this.http.get(`${this.api}/documents/${id}/download`, { responseType: 'blob' }); }

  // Portail locataire (espace locataire, scopé sur le compte connecté)
  getMyProperty(): Observable<PropertyDetails | null> { return this.http.get<PropertyDetails | null>(`${this.api}/portal/property`); }
  getMyStatement(): Observable<StatementLine[]> { return this.http.get<StatementLine[]>(`${this.api}/portal/statement`); }
  getMyDues(): Observable<DueMonth[]> { return this.http.get<DueMonth[]>(`${this.api}/portal/dues`); }
  getMyDocuments(): Observable<Document[]> { return this.http.get<Document[]>(`${this.api}/portal/documents`); }
  downloadMyDocument(id: number): Observable<Blob> { return this.http.get(`${this.api}/portal/documents/${id}/download`, { responseType: 'blob' }); }
  createMyCheckout(period?: string): Observable<{ url: string }> { return this.http.post<{ url: string }>(`${this.api}/portal/checkout`, { period }); }
  confirmMyCheckout(sessionId: string): Observable<Payment> { return this.http.post<Payment>(`${this.api}/portal/confirm`, { sessionId }); }

  // Dashboard
  getDashboardStats(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${this.api}/dashboard`); }
  getMyDashboardStats(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${this.api}/dashboard/me`); }

  // Compte
  deleteAccount(): Observable<void> { return this.http.delete<void>(`/api/auth/me`); }
}

export default ApiService;
