import { Component, HostListener, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService, Tenant, Lease, PropertyDetails, TenantPaymentHistory } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

/**
 * Formulaire locataire : les champs du bail (bien, loyer, date de début) sont saisis
 * en même temps que le locataire, d'où les propriétés supplémentaires. L'index
 * signature permet la saisie générique via `tenantFields` dans le template.
 */
interface TenantForm extends Partial<Tenant> {
  propertyId?: number | null;
  rentAmount?: number | null;
  startDate?: string | null;
  [key: string]: unknown;
}

@Component({
  selector: 'app-locataires',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Relations</div>
          <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Locataires</h1>
        </div>
        <button (click)="openCreate()"
          style="padding:11px 18px;border:none;border-radius:11px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
          + Inviter un locataire
        </button>
      </div>

      <!-- Add form -->
      @if (showForm) {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;margin-bottom:24px;">
          <h2 style="margin:0 0 18px;font-size:16px;font-weight:700;">{{ editingId ? 'Modifier le locataire' : 'Nouveau locataire' }}</h2>
          <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            @for (f of tenantFields; track f.key) {
              <div>
                <label [attr.for]="'tenant-' + f.key" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">{{ f.label }}</label>
                <input [id]="'tenant-' + f.key" [(ngModel)]="newTenant[f.key]" [placeholder]="f.placeholder" [type]="f.type ?? 'text'"
                  style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
              </div>
            }
          </div>

          <!-- Attacher à un bien (création uniquement) -->
          @if (!editingId) {
            <div style="margin-top:20px;padding-top:18px;border-top:1px dashed #E0E5DE;">
              <div style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:#9AA49E;margin-bottom:12px;">
                Attribuer un bien (optionnel)
              </div>
              <div class="nm-form" style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:14px;">
                <div>
                  <label for="tenant-property" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Bien</label>
                  <select id="tenant-property" [(ngModel)]="newTenant.propertyId" (ngModelChange)="onPropertyChange($event)"
                    style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;background:#fff;">
                    <option [ngValue]="null">— Aucun bien —</option>
                    @for (p of availableProperties; track p.id) {
                      <option [ngValue]="p.id">{{ p.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="tenant-rent" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Loyer (€/mois)</label>
                  <input id="tenant-rent" [(ngModel)]="newTenant.rentAmount" type="number" placeholder="750" [disabled]="!newTenant.propertyId"
                    style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
                </div>
                <div>
                  <label for="tenant-lease-start" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Début du bail</label>
                  <input id="tenant-lease-start" [(ngModel)]="newTenant.startDate" type="date" [disabled]="!newTenant.propertyId"
                    style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
                </div>
              </div>
              @if (availableProperties.length === 0) {
                <p style="color:#9AA49E;margin:10px 0 0;font-size:12.5px;">Aucun bien disponible — tous vos biens sont déjà loués.</p>
              }
            </div>
          }

          <div style="display:flex;gap:10px;margin-top:16px;">
            <button (click)="saveTenant()"
              style="padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
              {{ editingId ? 'Enregistrer les modifications' : 'Enregistrer' }}
            </button>
            <button (click)="cancelForm()"
              style="padding:11px 22px;border:1px solid #D6DED9;border-radius:10px;background:#fff;color:#16201D;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
              Annuler
            </button>
          </div>
          @if (error) { <p style="color:#C2563B;margin-top:10px;font-size:13px;">{{ error }}</p> }
        </div>
      }

      <!-- Table -->
      <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;overflow:hidden;">
        <div class="nm-row-head" style="display:grid;grid-template-columns:2fr 2fr 1fr 290px;gap:14px;padding:14px 22px;background:#F7F9F6;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;color:#9AA49E;">
          <span>Locataire</span><span>Bien</span><span>Loyer</span><span style="text-align:right;">Actions</span>
        </div>
        @for (t of tenants; track t.id) {
          <div class="nm-row" [style.opacity]="removingId === t.id ? '0' : '1'"
            [style.transform]="removingId === t.id ? 'translateX(20px)' : 'none'"
            style="display:grid;grid-template-columns:2fr 2fr 1fr 290px;gap:14px;padding:15px 22px;align-items:center;border-top:1px solid #EEF1ED;transition:opacity .28s ease,transform .28s ease;">
            <div style="display:flex;align-items:center;gap:12px;min-width:0;">
              <div [style.background]="colorFor(t.id)"
                style="width:36px;height:36px;border-radius:10px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12.5px;">
                {{ t.firstName[0] }}{{ t.lastName[0] }}
              </div>
              <div>
                <div style="font-weight:600;font-size:14px;">{{ t.firstName }} {{ t.lastName }}</div>
                <div style="font-size:12px;color:#8A938E;">{{ t.email }}</div>
              </div>
            </div>
            <span style="font-size:13.5px;color:#5A655F;">{{ propertyFor(t.id) }}</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:13.5px;">{{ rentFor(t.id) }}</span>
            <div style="text-align:right;display:flex;justify-content:flex-end;gap:8px;">
              <button (click)="openHistory(t)" class="nm-edit"
                style="padding:6px 12px;border:1px solid #D6DED9;border-radius:8px;background:#fff;color:#0E4F4A;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600;transition:all .15s;">
                Paiements
              </button>
              <button (click)="startEdit(t)" class="nm-edit"
                style="padding:6px 12px;border:1px solid #D6DED9;border-radius:8px;background:#fff;color:#0E4F4A;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600;transition:all .15s;">
                Modifier
              </button>
              <button (click)="deleteTenant(t.id, t.firstName + ' ' + t.lastName)" class="nm-del"
                style="padding:6px 12px;border:1px solid #D6DED9;border-radius:8px;background:#fff;color:#C2563B;font-family:inherit;font-size:12px;cursor:pointer;font-weight:600;transition:all .15s;">
                Supprimer
              </button>
            </div>
          </div>
        }
        @if (tenants.length === 0 && !loading) {
          <div style="padding:36px;text-align:center;color:#9AA49E;">Aucun locataire enregistré.</div>
        }
      </div>

      <!-- Historique de paiement annuel -->
      @if (historyTenant) {
        <div (click)="onHistoryBackdropClick($event)" role="presentation"
          style="position:fixed;inset:0;background:rgba(22,32,29,0.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:24px;">
          <div role="dialog" aria-modal="true"
            style="background:#fff;border-radius:18px;max-width:760px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 30px 70px rgba(0,0,0,0.3);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #EEF1ED;">
              <div>
                <div style="font-size:16px;font-weight:800;">{{ historyTenant.firstName }} {{ historyTenant.lastName }}</div>
                <div style="font-size:12.5px;color:#8A938E;">{{ history?.propertyName || 'Aucun bail' }} · Historique {{ historyYear }}</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <button (click)="changeYear(-1)" style="border:1px solid #D6DED9;background:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:15px;color:#5A655F;">‹</button>
                <span style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;">{{ historyYear }}</span>
                <button (click)="changeYear(1)" style="border:1px solid #D6DED9;background:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer;font-size:15px;color:#5A655F;">›</button>
                <button (click)="closeHistory()" style="border:none;background:transparent;font-size:20px;cursor:pointer;color:#5A655F;margin-left:6px;">✕</button>
              </div>
            </div>

            <div style="padding:24px;">
              @if (historyLoading) {
                <div style="text-align:center;color:#9AA49E;padding:30px;">Chargement…</div>
              } @else if (history) {
                <!-- Totaux -->
                <div class="nm-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
                  <div style="background:#ECFDF5;border:1px solid #C7EBDD;border-radius:12px;padding:14px;">
                    <div style="font-size:11.5px;color:#065F46;font-weight:600;">Encaissé</div>
                    <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:#047857;">{{ money(history.totalEncaisse) }}</div>
                  </div>
                  <div style="background:#FFFBEB;border:1px solid #F3E6C0;border-radius:12px;padding:14px;">
                    <div style="font-size:11.5px;color:#92722A;font-weight:600;">En attente</div>
                    <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:#B7791F;">{{ money(history.totalEnAttente) }}</div>
                  </div>
                  <div style="background:#FEF2F2;border:1px solid #F3D2CC;border-radius:12px;padding:14px;">
                    <div style="font-size:11.5px;color:#9B2C2C;font-weight:600;">En retard</div>
                    <div style="font-family:'IBM Plex Mono',monospace;font-size:18px;font-weight:700;color:#C2563B;">{{ money(history.totalRetard) }}</div>
                  </div>
                </div>

                <!-- Grille 12 mois -->
                <div class="nm-months" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                  @for (c of history.months; track c.month) {
                    <div [style.background]="cellBg(c.status)" [style.border]="'1px solid ' + cellBorder(c.status)"
                      style="border-radius:11px;padding:12px;">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12.5px;font-weight:700;color:#16201D;">{{ c.label }}</span>
                        <span [style.background]="cellDot(c.status)" style="width:9px;height:9px;border-radius:50%;display:inline-block;"></span>
                      </div>
                      <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;margin-top:6px;color:#16201D;">
                        {{ c.status === 'NONE' ? '—' : money(c.amount) }}
                      </div>
                      <div style="font-size:10.5px;color:#7A847E;margin-top:2px;">{{ statusLabel(c.status) }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div style="text-align:center;color:#9AA49E;padding:30px;">Aucune donnée de paiement.</div>
              }
            </div>
          </div>
        </div>
      }
    </div>

    <style>
      .nm-del:hover { background:#FBE7DF; border-color:#E4C8C0; }
      .nm-edit:hover { background:#E7F1EF; border-color:#CFE0DA; }
    </style>
  `
})
export class LocatairesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  tenants: Tenant[] = [];
  properties: PropertyDetails[] = [];
  availableProperties: PropertyDetails[] = [];
  loading = true;
  showForm = false;
  error = '';
  newTenant: TenantForm = {};

  tenantFields = [
    { key: 'firstName', label: 'Prénom', placeholder: 'Thomas' },
    { key: 'lastName', label: 'Nom', placeholder: 'Martin' },
    { key: 'email', label: 'Email', placeholder: 'thomas.martin@email.fr' },
    { key: 'phone', label: 'Téléphone', placeholder: '0600000000', type: 'tel' },
    { key: 'street', label: 'Rue', placeholder: '12 avenue Foch' },
    { key: 'city', label: 'Ville', placeholder: 'Nancy' },
    { key: 'zipCode', label: 'Code postal', placeholder: '54000' },
    { key: 'country', label: 'Pays', placeholder: 'France' },
  ];

  private colors = ['#0E4F4A', '#2A9D8F', '#264653', '#E76F51', '#E9C46A'];
  removingId: number | null = null;
  editingId: number | null = null;

  // Historique de paiement annuel
  historyTenant: Tenant | null = null;
  history: TenantPaymentHistory | null = null;
  historyYear = new Date().getFullYear();
  historyLoading = false;

  openHistory(t: Tenant) {
    this.historyTenant = t;
    this.historyYear = new Date().getFullYear();
    this.loadHistory();
  }

  closeHistory() {
    this.historyTenant = null;
    this.history = null;
  }

  /** Ferme la modale au clic sur le fond, sans intercepter les clics du panneau. */
  onHistoryBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.closeHistory();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.historyTenant) this.closeHistory();
  }

  changeYear(delta: number) {
    this.historyYear += delta;
    this.loadHistory();
  }

  private loadHistory() {
    if (!this.historyTenant) return;
    this.historyLoading = true;
    this.history = null;
    this.api.getTenantPaymentHistory(this.historyTenant.id, this.historyYear).subscribe({
      next: h => { this.history = h; this.historyLoading = false; },
      error: () => { this.historyLoading = false; this.toast.error('Historique indisponible'); }
    });
  }

  money(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount ?? 0);
  }

  statusLabel(s: string): string {
    return s === 'PAID' ? 'Encaissé' : s === 'PENDING' ? 'En attente' : s === 'LATE' ? 'En retard' : 'Hors bail';
  }

  cellBg(s: string): string {
    return s === 'PAID' ? '#ECFDF5' : s === 'PENDING' ? '#FFFBEB' : s === 'LATE' ? '#FEF2F2' : '#F7F9F6';
  }

  cellBorder(s: string): string {
    return s === 'PAID' ? '#C7EBDD' : s === 'PENDING' ? '#F3E6C0' : s === 'LATE' ? '#F3D2CC' : '#EAEEE9';
  }

  cellDot(s: string): string {
    return s === 'PAID' ? '#10B981' : s === 'PENDING' ? '#D9A521' : s === 'LATE' ? '#C2563B' : '#C9D0CB';
  }

  openCreate() {
    this.editingId = null;
    this.error = '';
    this.newTenant = {};
    this.showForm = !this.showForm;
  }

  startEdit(t: Tenant) {
    this.editingId = t.id;
    this.error = '';
    this.newTenant = { ...t };
    this.showForm = true;
    // Le formulaire est en haut de la page : on y remonte pour qu'il soit visible.
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.newTenant = {};
    this.error = '';
  }

  ngOnInit() {
    this.load();
    this.api.getPropertyDetails().subscribe({ next: p => this.properties = p, error: () => {} });
    this.loadAvailableProperties();
  }

  loadAvailableProperties() {
    this.api.getAvailableProperties().subscribe({ next: p => this.availableProperties = p, error: () => {} });
  }

  onPropertyChange(propertyId: number | null) {
    // Pré-remplit le loyer depuis le bien sélectionné (modifiable ensuite).
    const prop = this.availableProperties.find(p => p.id === propertyId);
    this.newTenant.rentAmount = prop?.rent ?? null;
    if (!propertyId) {
      this.newTenant.startDate = null;
    }
  }

  load() {
    this.loading = true;
    this.api.getTenants().subscribe({
      next: t => { this.tenants = t; this.loading = false; },
      error: () => this.loading = false
    });
  }

  saveTenant() {
    this.error = '';
    if (!this.newTenant.firstName || !this.newTenant.lastName) { this.error = 'Prénom et nom requis.'; return; }

    if (this.editingId) {
      this.api.updateTenant(this.editingId, this.newTenant).subscribe({
        next: () => { this.cancelForm(); this.toast.success('Locataire modifié'); this.load(); },
        error: () => { this.error = 'Erreur lors de la modification.'; this.toast.error('Impossible de modifier le locataire'); }
      });
    } else {
      const propertyId = this.newTenant.propertyId;
      const rentAmount = this.newTenant.rentAmount;
      const startDate = this.newTenant.startDate;
      this.api.createTenant(this.newTenant as Omit<Tenant, 'id'>).subscribe({
        next: (tenant) => {
          if (propertyId) {
            this.attachToProperty(tenant.id, propertyId, rentAmount ?? null, startDate ?? null);
          } else {
            this.cancelForm(); this.toast.success('Locataire ajouté'); this.load();
          }
        },
        error: () => { this.error = 'Erreur lors de la création.'; this.toast.error('Impossible d\'ajouter le locataire'); }
      });
    }
  }

  private attachToProperty(tenantId: number, propertyId: number, rentAmount: number | null, startDate: string | null) {
    this.api.createLease({
      propertyId,
      tenantId,
      rentAmount: rentAmount ?? 0,
      currency: 'EUR',
      startDate: startDate ?? new Date().toISOString().slice(0, 10),
    } as Omit<Lease, 'id'>).subscribe({
      next: () => {
        this.cancelForm();
        this.toast.success('Locataire ajouté et attribué au bien');
        this.load();
        this.loadAvailableProperties();
        this.api.getPropertyDetails().subscribe({ next: p => this.properties = p, error: () => {} });
      },
      error: () => {
        // Le locataire est créé mais le bail a échoué : on prévient sans bloquer.
        this.cancelForm();
        this.toast.error('Locataire créé, mais l\'attribution au bien a échoué');
        this.load();
      }
    });
  }

  deleteTenant(id: number, name?: string) {
    if (!confirm('Supprimer ce locataire ?')) return;
    this.removingId = id;
    this.api.deleteTenant(id).subscribe({
      next: () => {
        this.toast.success(name ? `« ${name} » supprimé` : 'Locataire supprimé');
        setTimeout(() => { this.removingId = null; this.load(); }, 280);
      },
      error: () => { this.removingId = null; this.toast.error('Suppression impossible'); }
    });
  }

  colorFor(id: number): string {
    return this.colors[id % this.colors.length];
  }

  propertyFor(tenantId: number): string {
    const prop = this.properties.find(p => p.tenant?.id === tenantId);
    return prop?.name ?? '—';
  }

  rentFor(tenantId: number): string {
    const prop = this.properties.find(p => p.tenant?.id === tenantId);
    if (!prop?.lease?.rentAmount) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: prop.lease.currency ?? 'EUR', maximumFractionDigits: 0 }).format(prop.lease.rentAmount) + '/mois';
  }
}
