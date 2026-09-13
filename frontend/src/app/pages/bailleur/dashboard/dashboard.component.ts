import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardStats, PropertyDetails } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:26px;">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Vue d'ensemble</div>
          <h1 style="margin:6px 0 0;font-size:30px;font-weight:800;letter-spacing:-0.02em;">Bonjour, {{ landlordName }}</h1>
          <p style="margin:6px 0 0;color:#5A655F;font-size:15px;">Voici l'état de votre patrimoine immobilier en temps réel.</p>
        </div>
        <a routerLink="../biens"
          style="padding:11px 18px;border:none;border-radius:11px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;text-decoration:none;">
          <span style="font-size:18px;line-height:1;">+</span> Ajouter un bien
        </a>
      </div>

      <!-- KPIs -->
      @if (stats) {
        <div class="nm-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px;">
          <div class="nm-kpi" style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;transition:transform .18s ease,box-shadow .18s ease;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Biens gérés</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-0.02em;margin-top:10px;">{{ animProperties }}</div>
          </div>
          <div class="nm-kpi" style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;transition:transform .18s ease,box-shadow .18s ease;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Locataires actifs</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-0.02em;margin-top:10px;">{{ animTenants }}</div>
          </div>
          <div class="nm-kpi" style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;transition:transform .18s ease,box-shadow .18s ease;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Revenus mensuels</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-0.02em;margin-top:10px;">{{ formatRevenue(animRevenue) }}</div>
          </div>
          <div class="nm-kpi" style="background:#0E4F4A;border:1px solid #0E4F4A;border-radius:16px;padding:20px;color:#fff;transition:transform .18s ease,box-shadow .18s ease;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:#7FC9BD;">Taux d'occupation</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-0.02em;margin-top:10px;">{{ animOccupancy }}%</div>
            <div style="margin-top:10px;height:6px;border-radius:6px;background:rgba(255,255,255,0.18);overflow:hidden;">
              <div [style.width]="animOccupancy + '%'" style="height:100%;background:#2A9D8F;transition:width .4s ease;"></div>
            </div>
          </div>
        </div>
      } @else {
        <div style="height:120px;background:#fff;border:1px solid #E4E7E2;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#9AA49E;margin-bottom:18px;">Chargement des statistiques…</div>
      }

      <!-- Properties list -->
      <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:22px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:16px;font-weight:700;">Loyers du mois</div>
          <a routerLink="../paiements" style="border:none;background:transparent;color:#2A9D8F;font-weight:600;font-size:13px;font-family:inherit;cursor:pointer;text-decoration:none;">Voir tout →</a>
        </div>
        @if (properties.length === 0) {
          <p style="color:#9AA49E;text-align:center;padding:24px 0;">Aucun bien trouvé. <a routerLink="../biens" style="color:#0E4F4A;font-weight:600;">Ajouter un bien</a></p>
        }
        @for (p of properties; track p.id) {
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid #EEF1ED;">
            <div [style.background]="colorFor(p.id)"
              style="width:38px;height:38px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;">
              {{ initials(p.tenant) }}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:600;font-size:14px;">{{ p.tenant?.firstName }} {{ p.tenant?.lastName }}</div>
              <div style="font-size:12.5px;color:#8A938E;">{{ p.name }}</div>
            </div>
            <div style="font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:14px;">{{ formatRent(p.lease?.rentAmount, p.lease?.currency) }}</div>
            <div style="width:110px;text-align:right;">
              <span [style.background]="p.tenant ? '#D1FAE5' : '#FEF3C7'" [style.color]="p.tenant ? '#065F46' : '#92400E'"
                style="display:inline-block;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;">
                {{ p.tenant ? 'Payé' : 'Vacant' }}
              </span>
            </div>
          </div>
        }
      </div>
    </div>

    <style>
      .nm-kpi:hover { transform: translateY(-3px); box-shadow:0 14px 30px rgba(14,79,74,0.12); }
    </style>
  `
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  stats: DashboardStats | null = null;
  properties: PropertyDetails[] = [];

  animProperties = 0;
  animTenants = 0;
  animRevenue = 0;
  animOccupancy = 0;

  private colors = ['#0E4F4A', '#2A9D8F', '#264653', '#E76F51', '#E9C46A'];

  get landlordName(): string {
    const u = this.auth.user;
    if (!u) return 'bailleur';
    return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'bailleur';
  }

  ngOnInit() {
    this.api.getMyDashboardStats().subscribe({
      next: s => { this.stats = s; this.animateCounters(s); },
      error: () => {}
    });
    this.api.getPropertyDetails().subscribe({ next: p => this.properties = p, error: () => {} });
  }

  /** Compte progressif des KPI (ease-out) pour un effet vivant. */
  private animateCounters(s: DashboardStats) {
    const duration = 900;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const e = ease(p);
      this.animProperties = Math.round(s.totalProperties * e);
      this.animTenants = Math.round(s.activeTenants * e);
      this.animRevenue = Math.round(s.monthlyRevenue * e);
      this.animOccupancy = Math.round(s.occupancyRate * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  initials(tenant?: PropertyDetails['tenant']): string {
    if (!tenant) return '—';
    return (tenant.firstName[0] ?? '') + (tenant.lastName[0] ?? '');
  }

  colorFor(id: number): string {
    return this.colors[id % this.colors.length];
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount ?? 0);
  }

  formatRent(amount?: number, currency?: string): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency ?? 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
