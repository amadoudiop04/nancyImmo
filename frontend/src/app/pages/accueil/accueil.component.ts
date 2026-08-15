import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, DashboardStats } from '../../services/api.service';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div>
      <!-- Hero -->
      <section class="nm-split" style="max-width:1180px;margin:0 auto;padding:64px 32px 40px;display:grid;grid-template-columns:1.05fr 0.95fr;gap:48px;align-items:center;">
        <div>
          <span style="display:inline-block;background:#E7F1EF;color:#0E4F4A;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:0.04em;padding:7px 14px;border-radius:999px;font-weight:500;">Gestion locative autonome</span>
          <h1 style="font-size:56px;line-height:1.04;font-weight:800;letter-spacing:-0.03em;margin:22px 0 0;">
            Gérez vos biens<br>sans agence,<br><span style="color:#2A9D8F;">en toute sérénité.</span>
          </h1>
          <p style="font-size:18px;color:#5A655F;line-height:1.6;margin:22px 0 0;max-width:480px;">
            Nancy Immo réunit locataires, paiements, contrats et quittances dans une seule interface.
          </p>
          <div style="display:flex;gap:12px;margin-top:30px;">
            <a routerLink="/bailleur"
              style="background:#0E4F4A;color:#fff;border:none;padding:15px 26px;border-radius:13px;font-family:inherit;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none;">
              Commencer gratuitement →
            </a>
            <a routerLink="/recherche"
              style="background:#fff;color:#16201D;border:1px solid #D6DED9;padding:15px 26px;border-radius:13px;font-family:inherit;font-weight:600;font-size:16px;cursor:pointer;text-decoration:none;">
              Chercher un logement
            </a>
          </div>
          <div style="display:flex;gap:30px;margin-top:38px;">
            <div>
              <div style="font-size:26px;font-weight:800;">{{ stats?.totalProperties ?? '—' }}</div>
              <div style="font-size:13px;color:#8A938E;">biens gérés</div>
            </div>
            <div>
              <div style="font-size:26px;font-weight:800;">0%</div>
              <div style="font-size:13px;color:#8A938E;">de commission d'agence</div>
            </div>
            <div>
              <div style="font-size:26px;font-weight:800;">2 min</div>
              <div style="font-size:13px;color:#8A938E;">pour ajouter un bien</div>
            </div>
          </div>
        </div>

        <!-- Hero visual -->
        <div style="position:relative;">
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:20px;padding:20px;box-shadow:0 30px 60px rgba(14,79,74,0.12);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:700;font-size:15px;">Tableau de bord</div>
              <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#2A9D8F;">+12,4%</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:14px;">
              <div style="background:#F4F6F3;border-radius:12px;padding:14px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:#9AA49E;">Revenus</div>
                <div style="font-size:22px;font-weight:800;margin-top:5px;">{{ revenueLabel }}</div>
              </div>
              <div style="background:#0E4F4A;border-radius:12px;padding:14px;color:#fff;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.06em;text-transform:uppercase;color:#7FC9BD;">Occupation</div>
                <div style="font-size:22px;font-weight:800;margin-top:5px;">{{ stats?.occupancyRate ?? '—' }}%</div>
              </div>
            </div>
            <div style="display:flex;align-items:flex-end;gap:6px;height:78px;margin-top:14px;">
              @for (h of barHeights; track $index) {
                <div style="flex:1;border-radius:4px 4px 0 0;" [style.height]="h + '%'"
                  [style.background]="$index < 4 ? '#D6E2DD' : ($index < 6 ? '#2A9D8F' : '#0E4F4A')"></div>
              }
            </div>
          </div>
          <div style="position:absolute;bottom:-22px;left:-22px;background:#fff;border:1px solid #E4E7E2;border-radius:14px;padding:13px 16px;box-shadow:0 16px 30px rgba(14,79,74,0.12);display:flex;align-items:center;gap:11px;">
            <div style="width:34px;height:34px;border-radius:9px;background:#E7F1EF;color:#0E4F4A;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;">✓</div>
            <div><div style="font-size:13px;font-weight:700;">Quittance envoyée</div><div style="font-size:11px;color:#8A938E;">Automatique · ce mois</div></div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section style="max-width:1180px;margin:60px auto 0;padding:48px 32px;">
        <div style="text-align:center;max-width:600px;margin:0 auto 40px;">
          <h2 style="font-size:34px;font-weight:800;letter-spacing:-0.02em;margin:0;">Tout ce qu'il faut pour gérer seul</h2>
          <p style="font-size:16px;color:#5A655F;margin:12px 0 0;">Une plateforme complète, côté bailleur comme côté locataire.</p>
        </div>
        <div class="nm-cards" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:18px;padding:26px;">
            <div style="width:46px;height:46px;border-radius:13px;background:#E7F1EF;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-6.5L20 11v8.5a.5.5 0 0 1-.5.5H15v-6H9v6H4.5a.5.5 0 0 1-.5-.5z" stroke="#0E4F4A" stroke-width="1.7" stroke-linejoin="round"/></svg>
            </div>
            <div style="font-size:18px;font-weight:700;">Gestion des biens</div>
            <p style="font-size:14px;color:#5A655F;line-height:1.6;margin:9px 0 0;">Centralisez photos, descriptifs, documents légaux et historique de chaque logement.</p>
          </div>
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:18px;padding:26px;">
            <div style="width:46px;height:46px;border-radius:13px;background:#E7F1EF;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="#0E4F4A" stroke-width="1.7"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="#0E4F4A" stroke-width="1.7" stroke-linecap="round"/></svg>
            </div>
            <div style="font-size:18px;font-weight:700;">Suivi des locataires</div>
            <p style="font-size:14px;color:#5A655F;line-height:1.6;margin:9px 0 0;">Baux, paiements, communication directe et candidatures réunis au même endroit.</p>
          </div>
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:18px;padding:26px;">
            <div style="width:46px;height:46px;border-radius:13px;background:#E7F1EF;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="5.5" width="18" height="13" rx="2" stroke="#0E4F4A" stroke-width="1.7"/><path d="M3 9.5h18" stroke="#0E4F4A" stroke-width="1.7"/></svg>
            </div>
            <div style="font-size:18px;font-weight:700;">Paiements & quittances</div>
            <p style="font-size:14px;color:#5A655F;line-height:1.6;margin:9px 0 0;">Encaissez les loyers en ligne et générez les quittances automatiquement chaque mois.</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section style="max-width:1180px;margin:0 auto;padding:24px 32px 72px;">
        <div style="background:#0E4F4A;border-radius:24px;padding:54px;text-align:center;color:#fff;">
          <h2 style="font-size:36px;font-weight:800;letter-spacing:-0.02em;margin:0;">Reprenez la main sur votre gestion locative</h2>
          <p style="font-size:17px;color:#BFE0D9;margin:14px auto 0;max-width:540px;">Sans agence, sans commission. Vous gérez, Nancy Immo automatise.</p>
          <a routerLink="/bailleur"
            style="display:inline-block;margin-top:28px;background:#2A9D8F;color:#fff;padding:16px 32px;border-radius:13px;font-family:inherit;font-weight:700;font-size:16px;text-decoration:none;">
            Démarrer gratuitement
          </a>
        </div>
      </section>

      <footer style="border-top:1px solid #E4E7E2;padding:28px 32px;max-width:1180px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
        <div style="display:flex;align-items:center;gap:9px;">
          <div style="width:26px;height:26px;border-radius:8px;background:#0E4F4A;display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" fill="#2A9D8F"/></svg>
          </div>
          <span style="font-weight:800;">Nancy<span style="color:#2A9D8F;">Immo</span></span>
        </div>
        <div style="font-size:13px;color:#9AA49E;">© 2026 Nancy Immo — Gestion locative autonome</div>
      </footer>
    </div>
  `
})
export class AccueilComponent implements OnInit {
  private api = inject(ApiService);

  stats: DashboardStats | null = null;
  barHeights = [46, 62, 54, 74, 66, 88, 100];

  get revenueLabel(): string {
    if (!this.stats) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(this.stats.monthlyRevenue);
  }

  ngOnInit() {
    this.api.getDashboardStats().subscribe({ next: s => this.stats = s, error: () => {} });
  }
}
