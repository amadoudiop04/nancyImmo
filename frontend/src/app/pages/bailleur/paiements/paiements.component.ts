import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Payment, PaymentStats, PropertyDetails } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-paiements',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div style="margin-bottom:24px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Finances</div>
        <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Paiements</h1>
      </div>

      <!-- Stats -->
      <div class="nm-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px;">
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Encaissé</div>
          <div style="font-size:28px;font-weight:800;margin-top:10px;color:#0E4F4A;">{{ fmt(payStats?.totalPaid) }}</div>
        </div>
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">En attente</div>
          <div style="font-size:28px;font-weight:800;margin-top:10px;">{{ fmt(payStats?.totalPending) }}</div>
        </div>
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">En retard</div>
          <div style="font-size:28px;font-weight:800;margin-top:10px;color:#C2563B;">{{ fmt(payStats?.totalLate) }}</div>
        </div>
      </div>

      <!-- Add payment -->
      <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:22px;margin-bottom:18px;">
        <button (click)="showForm=!showForm" style="font-size:14px;font-weight:600;color:#0E4F4A;background:transparent;border:none;cursor:pointer;padding:0;">
          {{ showForm ? '▲ Masquer' : '+ Enregistrer un paiement' }}
        </button>
        @if (showForm) {
          <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;margin-top:16px;">
            <div>
              <label for="payment-lease" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Bien</label>
              <select id="payment-lease" [(ngModel)]="newPay.leaseId" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;background:#fff;">
                <option [value]="undefined">— Sélectionner —</option>
                @for (p of properties; track p.id) {
                  @if (p.lease) {
                    <option [value]="p.lease.id">{{ p.name }} ({{ p.tenant?.firstName }} {{ p.tenant?.lastName }})</option>
                  }
                }
              </select>
            </div>
            <div>
              <label for="payment-period" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Période</label>
              <input id="payment-period" type="date" [(ngModel)]="newPay.period" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
            </div>
            <div>
              <label for="payment-amount" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Montant (€)</label>
              <input id="payment-amount" type="number" [(ngModel)]="newPay.amount" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
            </div>
            <div>
              <label for="payment-status" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Statut</label>
              <select id="payment-status" [(ngModel)]="newPay.status" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;background:#fff;">
                <option value="PAID">Payé</option>
                <option value="PENDING">En attente</option>
                <option value="LATE">En retard</option>
              </select>
            </div>
          </div>
          <button (click)="createPayment()" style="margin-top:14px;padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
            Enregistrer
          </button>
        }
      </div>

      <!-- Payments list -->
      <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;overflow:hidden;">
        <div style="padding:16px 22px;font-size:15px;font-weight:700;border-bottom:1px solid #EEF1ED;">Quittances et paiements</div>
        @for (p of payments; track p.id) {
          <div style="display:flex;align-items:center;gap:14px;padding:15px 22px;border-top:1px solid #EEF1ED;">
            <div style="width:34px;height:34px;border-radius:9px;background:#E7F1EF;color:#0E4F4A;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:9.5px;flex:none;">PDF</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:14px;">{{ p.tenantName ?? '—' }}</div>
              <div style="font-size:12px;color:#9AA49E;">{{ p.propertyName ?? '—' }} · {{ p.period }}</div>
            </div>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:13.5px;">{{ fmtAmt(p.amount) }}</span>
            <span [style.background]="badgeBg(p.status)" [style.color]="badgeFg(p.status)"
              style="display:inline-block;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600;">
              {{ statusLabel(p.status) }}
            </span>
            <button (click)="deletePayment(p.id)"
              style="padding:6px 10px;border:1px solid #D6DED9;border-radius:8px;background:#fff;color:#C2563B;font-family:inherit;font-size:12px;cursor:pointer;">
              ✕
            </button>
          </div>
        }
        @if (payments.length === 0) {
          <div style="padding:36px;text-align:center;color:#9AA49E;">Aucun paiement enregistré.</div>
        }
      </div>
    </div>
  `
})
export class PaiementsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  payments: Payment[] = [];
  payStats: PaymentStats | null = null;
  properties: PropertyDetails[] = [];
  showForm = false;
  newPay: Partial<Payment> = { status: 'PAID', amount: 0 };

  ngOnInit() {
    this.load();
    this.api.getPaymentStats().subscribe({ next: s => this.payStats = s, error: () => {} });
    this.api.getPropertyDetails().subscribe({ next: p => this.properties = p, error: () => {} });
  }

  load() {
    this.api.getPayments().subscribe({ next: p => this.payments = p, error: () => {} });
  }

  createPayment() {
    this.api.createPayment(this.newPay as Omit<Payment, 'id'>).subscribe({
      next: () => {
        this.showForm = false;
        this.newPay = { status: 'PAID', amount: 0 };
        this.toast.success('Paiement enregistré');
        this.load();
        this.api.getPaymentStats().subscribe({ next: s => this.payStats = s, error: () => {} });
      },
      error: () => this.toast.error('Impossible d\'enregistrer le paiement')
    });
  }

  deletePayment(id: number) {
    this.api.deletePayment(id).subscribe({
      next: () => {
        this.toast.success('Paiement supprimé');
        this.load();
        this.api.getPaymentStats().subscribe({ next: s => this.payStats = s, error: () => {} });
      },
      error: () => this.toast.error('Suppression impossible')
    });
  }

  fmt(v?: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  fmtAmt(v: number): string { return this.fmt(v); }

  statusLabel(s: string): string {
    return s === 'PAID' ? 'Payé' : s === 'PENDING' ? 'En attente' : 'En retard';
  }

  badgeBg(s: string): string {
    return s === 'PAID' ? '#D1FAE5' : s === 'PENDING' ? '#FEF3C7' : '#FEE2E2';
  }

  badgeFg(s: string): string {
    return s === 'PAID' ? '#065F46' : s === 'PENDING' ? '#92400E' : '#991B1B';
  }
}
