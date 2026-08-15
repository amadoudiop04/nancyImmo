import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, PropertyDetails, Payment, Document, StatementLine, DueMonth } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-locataire',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="max-width:1180px;margin:0 auto;padding:34px 32px 60px;">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Espace locataire</div>
          <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Bonjour, {{ userName }}</h1>
          <p style="margin:6px 0 0;color:#5A655F;font-size:15px;">{{ currentProperty?.location ?? 'Aucun bien associé' }}</p>
        </div>
      </div>

      <div class="nm-split" style="display:grid;grid-template-columns:1.5fr 360px;gap:20px;">
        <div>
          <!-- Solde -->
          <div style="background:#0E4F4A;border-radius:18px;padding:26px;color:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:#7FC9BD;">Solde à régler</div>
                <div style="font-size:42px;font-weight:800;letter-spacing:-0.02em;margin-top:8px;">{{ currentRent }}</div>
                <div style="font-size:13.5px;color:#BFE0D9;margin-top:4px;">Loyer + charges · échéance le 5</div>
              </div>
              <span style="background:#E9C46A;color:#3A2E10;font-weight:700;font-size:12px;padding:6px 13px;border-radius:999px;">À régler</span>
            </div>
            <button (click)="startCheckout()" [disabled]="!currentProperty?.lease || processing || lateDues.length > 0"
              [style.opacity]="lateDues.length > 0 ? '0.55' : '1'"
              [style.cursor]="lateDues.length > 0 ? 'not-allowed' : 'pointer'"
              style="margin-top:22px;width:100%;padding:14px;border:none;border-radius:12px;background:#2A9D8F;color:#fff;font-family:inherit;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px;">
              @if (processing) { <span>Redirection vers le paiement…</span> } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 11V8a6 6 0 0 1 12 0v3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="11" width="16" height="10" rx="2" stroke="#fff" stroke-width="1.8"/></svg>
                <span>Payer le mois courant →</span>
              }
            </button>
            @if (lateDues.length > 0) {
              <div style="margin-top:10px;font-size:11.5px;color:#FBD9A0;text-align:center;">⚠️ Régularisez d'abord les {{ lateDues.length }} mois en retard ci-dessous.</div>
            } @else {
              <div style="margin-top:10px;font-size:11.5px;color:#BFE0D9;text-align:center;">🔒 Paiement sécurisé par Stripe</div>
            }
          </div>

          <!-- Mois en retard à régulariser -->
          @if (lateDues.length > 0) {
            <div style="background:#fff;border:1px solid #F0D2C6;border-radius:16px;padding:22px;margin-top:18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="font-size:16px;font-weight:700;color:#C2563B;">Mois en retard à régulariser</div>
                <span style="background:#FBE7DF;color:#C2563B;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;">Total : {{ fmt(lateTotal) }}</span>
              </div>
              <p style="margin:0 0 14px;font-size:12.5px;color:#8A938E;">Réglez les mois les plus anciens en premier pour solder votre retard.</p>
              @for (d of lateDues; track d.period) {
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #F2F4F0;">
                  <div>
                    <div style="font-size:14px;font-weight:600;">{{ d.label }}</div>
                    <div style="font-size:12px;color:#C2563B;">En retard · {{ fmt(d.amount) }}</div>
                  </div>
                  <button (click)="startCheckout(d.period)" [disabled]="processing"
                    style="padding:9px 16px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap;">
                    Régulariser →
                  </button>
                </div>
              }
            </div>
          }

          <!-- Situation de compte (débit / crédit / solde) -->
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:22px;margin-top:18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div style="font-size:16px;font-weight:700;">Situation de compte</div>
              <span [style.background]="balance > 0 ? '#FBE7DF' : '#D1FAE5'" [style.color]="balance > 0 ? '#C2563B' : '#065F46'"
                style="padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;">
                {{ balance > 0 ? 'Solde dû : ' + fmt(balance) : 'À jour' }}
              </span>
            </div>

            <div class="nm-stmt" style="display:grid;grid-template-columns:64px 1fr 92px 92px 96px;gap:10px;padding:10px 0;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;color:#9AA49E;border-bottom:1px solid #EEF1ED;">
              <span>Date</span><span>Libellé</span>
              <span style="text-align:right;">Débit</span><span style="text-align:right;">Crédit</span><span style="text-align:right;">Solde</span>
            </div>

            @for (l of statement; track $index) {
              <div class="nm-stmt-row nm-stmt" style="display:grid;grid-template-columns:64px 1fr 92px 92px 96px;gap:10px;padding:12px 0;border-bottom:1px solid #F2F4F0;font-size:13px;align-items:center;transition:background .15s;">
                <span style="font-family:'IBM Plex Mono',monospace;color:#9AA49E;font-size:12px;">{{ shortDate(l.date) }}</span>
                <span style="font-weight:500;">{{ l.label }}</span>
                <span style="text-align:right;font-family:'IBM Plex Mono',monospace;color:#C2563B;">{{ l.debit ? fmt(l.debit) : '' }}</span>
                <span style="text-align:right;font-family:'IBM Plex Mono',monospace;color:#2A9D8F;">{{ l.credit ? fmt(l.credit) : '' }}</span>
                <span style="text-align:right;font-family:'IBM Plex Mono',monospace;font-weight:600;">{{ fmt(l.balance) }}</span>
              </div>
            }
            @if (statement.length === 0) {
              <p style="color:#9AA49E;font-size:13px;margin-top:12px;">Aucun mouvement de compte.</p>
            }
          </div>

          <!-- Documents -->
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:22px;margin-top:18px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:14px;">Mes documents</div>
            <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:11px;">
              @for (d of documents; track d.id) {
                <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #EEF1ED;border-radius:12px;">
                  <div style="width:34px;height:34px;border-radius:9px;background:#E7F1EF;color:#0E4F4A;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:9.5px;flex:none;">PDF</div>
                  <div style="min-width:0;">
                    <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ d.name }}</div>
                    <div style="font-size:11px;color:#9AA49E;">{{ d.createdAt }}</div>
                  </div>
                </div>
              }
              @if (documents.length === 0) {
                <p style="color:#9AA49E;font-size:13px;">Aucun document.</p>
              }
            </div>
          </div>
        </div>

        <!-- Right: bien info -->
        <div>
          @if (currentProperty) {
            <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;">
              <div style="position:relative;height:130px;border-radius:13px;overflow:hidden;display:flex;align-items:flex-end;padding:11px;"
                [style.background]="currentProperty.imageUrl ? '#EDEFEA' : 'repeating-linear-gradient(45deg,#EDEFEA,#EDEFEA 11px,#E4E7E2 11px,#E4E7E2 22px)'">
                @if (currentProperty.imageUrl) {
                  <img [src]="currentProperty.imageUrl" alt="logement" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
                } @else {
                  <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#9AA49E;background:#fff;padding:2px 7px;border-radius:5px;">photo du logement</span>
                }
              </div>
              <div style="font-weight:700;font-size:16px;margin-top:14px;">{{ currentProperty.name }}</div>
              <div style="font-size:13px;color:#8A938E;margin-top:3px;">{{ currentProperty.kind }} · {{ currentProperty.size }} · {{ currentProperty.location }}</div>
              @if (currentProperty.description) {
                <div style="margin-top:14px;font-size:13.5px;color:#5A655F;line-height:1.6;">{{ currentProperty.description }}</div>
              }
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class LocataireComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentProperty: PropertyDetails | null = null;
  payments: Payment[] = [];
  documents: Document[] = [];
  statement: StatementLine[] = [];
  dues: DueMonth[] = [];
  balance = 0;

  processing = false;

  /** Mois en retard (arriérés) à régulariser avant le mois courant. */
  get lateDues(): DueMonth[] {
    return this.dues.filter(d => d.status === 'LATE');
  }

  /** Montant total des arriérés en retard. */
  get lateTotal(): number {
    return this.lateDues.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  }

  get userName(): string {
    const u = this.auth.user;
    if (!u) return '';
    return [u.firstName, u.lastName].filter(Boolean).join(' ');
  }

  /** Démarre le paiement Stripe Checkout (mois courant par défaut, ou un mois précis à régulariser). */
  startCheckout(period?: string) {
    const lease = this.currentProperty?.lease;
    if (!lease) return;
    this.processing = true;
    this.api.createMyCheckout(period).subscribe({
      next: res => { window.location.href = res.url; },
      error: (e) => {
        this.processing = false;
        this.toast.error(e?.status === 503
          ? 'Paiement en ligne indisponible : Stripe n\'est pas configuré.'
          : 'Impossible de démarrer le paiement.');
      }
    });
  }

  /** Au retour de Stripe : confirme la session et enregistre le paiement. */
  private handleStripeReturn() {
    const params = this.route.snapshot.queryParamMap;
    const sessionId = params.get('session_id');
    if (params.get('paid') === '1' && sessionId) {
      this.api.confirmMyCheckout(sessionId).subscribe({
        next: () => {
          this.toast.success('Paiement reçu — votre quittance sera disponible.');
          this.loadStatement();
          this.loadDues();
        },
        error: () => {}
      });
      this.cleanUrl();
    } else if (params.get('canceled') === '1') {
      this.toast.info('Paiement annulé.');
      this.cleanUrl();
    }
  }

  private cleanUrl() {
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }

  ngOnInit() {
    // Espace locataire : on ne charge QUE les données du bien loué par le locataire connecté.
    this.api.getMyProperty().subscribe({
      next: property => {
        this.currentProperty = property ?? null;
        if (this.currentProperty?.lease) {
          this.loadStatement();
          this.loadDues();
        }
        this.api.getMyDocuments().subscribe({ next: d => this.documents = d, error: () => {} });
        // Gère le retour de Stripe une fois le bien/bail chargé.
        this.handleStripeReturn();
      },
      error: () => this.handleStripeReturn()
    });
  }

  loadStatement() {
    this.api.getMyStatement().subscribe({
      next: lines => {
        this.statement = lines;
        this.balance = lines.length ? lines[lines.length - 1].balance : 0;
      },
      error: () => {}
    });
  }

  loadDues() {
    this.api.getMyDues().subscribe({
      next: dues => this.dues = dues,
      error: () => {}
    });
  }

  shortDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  get currentRent(): string {
    if (!this.currentProperty?.lease?.rentAmount) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: this.currentProperty.lease.currency ?? 'EUR', maximumFractionDigits: 0 }).format(this.currentProperty.lease.rentAmount);
  }

  fmt(v: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v ?? 0);
  }

  formatPeriod(period: string): string {
    if (!period) return '';
    const d = new Date(period);
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

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
