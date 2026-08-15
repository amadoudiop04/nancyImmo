import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, Property, PropertyDetails, Building } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-biens',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Patrimoine</div>
          <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Mes biens</h1>
        </div>
        <button (click)="openCreate()"
          style="padding:11px 18px;border:none;border-radius:11px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
          + Ajouter un bien
        </button>
      </div>

      <!-- Add / edit form -->
      @if (showForm) {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;margin-bottom:24px;">
          <h2 style="margin:0 0 18px;font-size:16px;font-weight:700;">{{ editingId ? 'Modifier le bien' : 'Nouveau bien' }}</h2>
          <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <label for="prop-name" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Nom du bien</label>
              <input id="prop-name" [(ngModel)]="newProp.name" placeholder="Ex: Appartement T3 Foch" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="prop-kind" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Type</label>
              <input id="prop-kind" [(ngModel)]="newProp.kind" placeholder="Ex: T3, Studio, Maison" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="prop-size" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Surface</label>
              <input id="prop-size" [(ngModel)]="newProp.size" placeholder="Ex: 65 m²" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="prop-rent" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Loyer demandé (€/mois)</label>
              <input id="prop-rent" [(ngModel)]="newProp.rent" type="number" placeholder="Ex: 750" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="prop-location" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Adresse / Localisation</label>
              <input id="prop-location" [(ngModel)]="newProp.location" placeholder="Ex: 12 Av. Foch, Nancy" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="prop-building" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Immeuble</label>
              <select id="prop-building" [(ngModel)]="newProp.buildingId" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;background:#fff;">
                <option [value]="undefined">— Aucun —</option>
                @for (b of buildings; track b.id) {
                  <option [value]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
            <div style="grid-column:1/3;">
              <label for="prop-image" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Photo du bien (URL)</label>
              <input id="prop-image" [(ngModel)]="newProp.imageUrl" placeholder="https://… (lien vers une image)"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
              @if (newProp.imageUrl) {
                <img [src]="newProp.imageUrl" alt="aperçu" style="margin-top:10px;width:100%;max-height:160px;object-fit:cover;border-radius:10px;border:1px solid #E4E7E2;">
              }
            </div>
            <div style="grid-column:1/3;">
              <label for="prop-description" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Description</label>
              <textarea id="prop-description" [(ngModel)]="newProp.description" rows="3" placeholder="Appartement lumineux, balcon, parking…"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;resize:vertical;"></textarea>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button (click)="saveProperty()"
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

      <!-- Properties grid -->
      <div class="nm-cards" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
        @for (p of properties; track p.id) {
          <div class="nm-card"
            [style.opacity]="removingId === p.id ? '0' : '1'"
            [style.transform]="removingId === p.id ? 'scale(0.94)' : 'none'"
            style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;overflow:hidden;transition:opacity .28s ease,transform .28s ease,box-shadow .18s ease,border-color .18s ease;">
            <div style="position:relative;height:148px;display:flex;align-items:flex-end;padding:12px;overflow:hidden;"
              [style.background]="p.imageUrl ? '#EDEFEA' : 'repeating-linear-gradient(45deg,#EDEFEA,#EDEFEA 11px,#E4E7E2 11px,#E4E7E2 22px)'">
              @if (p.imageUrl) {
                <img [src]="p.imageUrl" alt="{{ p.name }}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
              }
              <span style="position:absolute;top:12px;left:12px;padding:5px 11px;border-radius:999px;font-size:11.5px;font-weight:600;z-index:1;"
                [style.background]="p.landlord ? '#D1FAE5' : '#F3F4F6'"
                [style.color]="p.landlord ? '#065F46' : '#6B7280'">
                {{ p.landlord ? 'Géré' : 'Sans bailleur' }}
              </span>
            </div>
            <div style="padding:16px 18px 18px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div style="font-weight:700;font-size:15.5px;line-height:1.25;">{{ p.name }}</div>
                <div style="font-family:'IBM Plex Mono',monospace;font-weight:500;font-size:15px;color:#0E4F4A;white-space:nowrap;">
                  {{ displayRent(p) }}
                </div>
              </div>
              <div style="font-size:12.5px;color:#8A938E;margin-top:4px;">{{ p.location }}</div>
              <div style="display:flex;gap:8px;margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5A655F;flex-wrap:wrap;">
                <span style="background:#F1F4F0;padding:4px 9px;border-radius:7px;">{{ p.kind }}</span>
                <span style="background:#F1F4F0;padding:4px 9px;border-radius:7px;">{{ p.size }}</span>
                <span style="background:#F1F4F0;padding:4px 9px;border-radius:7px;">
                  {{ p.tenant ? p.tenant.firstName + ' ' + p.tenant.lastName : 'Vacant' }}
                </span>
              </div>
              <div style="display:flex;gap:8px;margin-top:14px;">
                <a [routerLink]="p.id.toString()"
                  style="flex:1;padding:9px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;text-decoration:none;text-align:center;">
                  Voir détail
                </a>
                <button (click)="startEdit(p)" title="Modifier" class="nm-edit"
                  style="padding:9px 14px;border:1px solid #D6DED9;border-radius:10px;background:#fff;color:#0E4F4A;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;">
                  Modifier
                </button>
                <button (click)="deleteProperty(p.id, p.name)" title="Supprimer"
                  class="nm-del"
                  style="padding:9px 14px;border:1px solid #D6DED9;border-radius:10px;background:#fff;color:#C2563B;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;">
                  ✕
                </button>
              </div>
            </div>
          </div>
        }
        @if (properties.length === 0 && !loading) {
          <div style="grid-column:1/-1;text-align:center;padding:48px;color:#9AA49E;">
            Aucun bien enregistré. Ajoutez votre premier bien ci-dessus.
          </div>
        }
      </div>
    </div>

    <style>
      .nm-card:hover { box-shadow:0 14px 30px rgba(14,79,74,0.10); border-color:#CFE0DA; }
      .nm-del:hover { background:#FBE7DF; border-color:#E4C8C0; }
      .nm-edit:hover { background:#E7F1EF; border-color:#CFE0DA; }
    </style>
  `
})
export class BiensComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  properties: PropertyDetails[] = [];
  buildings: Building[] = [];
  loading = true;
  showForm = false;
  error = '';
  removingId: number | null = null;
  editingId: number | null = null;
  newProp: Partial<Property> = { name: '', kind: '', size: '', location: '' };

  private emptyProp(): Partial<Property> {
    return { name: '', kind: '', size: '', location: '', rent: undefined, description: '', imageUrl: '', buildingId: undefined };
  }

  openCreate() {
    this.editingId = null;
    this.error = '';
    this.newProp = this.emptyProp();
    this.showForm = !this.showForm;
  }

  startEdit(p: PropertyDetails) {
    this.editingId = p.id;
    this.error = '';
    this.newProp = {
      name: p.name, kind: p.kind, size: p.size, location: p.location,
      rent: p.rent ?? p.lease?.rentAmount, description: p.description, imageUrl: p.imageUrl,
      buildingId: p.building?.id,
    };
    this.showForm = true;
    // Le formulaire est en haut de la page : on y remonte pour qu'il soit visible.
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.newProp = this.emptyProp();
    this.error = '';
  }

  saveProperty() {
    this.error = '';
    if (!this.newProp.name) { this.error = 'Le nom est requis.'; return; }

    if (this.editingId) {
      this.api.updateProperty(this.editingId, this.newProp).subscribe({
        next: () => { this.cancelForm(); this.toast.success('Bien modifié'); this.load(); },
        error: () => { this.error = 'Erreur lors de la modification.'; this.toast.error('Impossible de modifier le bien'); }
      });
    } else {
      this.api.createProperty(this.newProp as Omit<Property, 'id'>).subscribe({
        next: () => { this.cancelForm(); this.toast.success('Bien ajouté'); this.load(); },
        error: () => { this.error = 'Erreur lors de la création.'; this.toast.error('Impossible d\'ajouter le bien'); }
      });
    }
  }

  ngOnInit() {
    this.load();
    this.api.getBuildings().subscribe({ next: b => this.buildings = b, error: () => {} });
  }

  load() {
    this.loading = true;
    this.api.getPropertyDetails().subscribe({
      next: p => { this.properties = p; this.loading = false; },
      error: () => this.loading = false
    });
  }

  deleteProperty(id: number, name?: string) {
    if (!confirm('Supprimer ce bien ?')) return;
    this.removingId = id;
    this.api.deleteProperty(id).subscribe({
      next: () => {
        this.toast.success(name ? `« ${name} » supprimé` : 'Bien supprimé');
        // Laisse l'animation de disparition se jouer avant le rechargement.
        setTimeout(() => { this.removingId = null; this.load(); }, 280);
      },
      error: () => { this.removingId = null; this.toast.error('Suppression impossible'); }
    });
  }

  formatRent(amount: number, currency: string): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency ?? 'EUR', maximumFractionDigits: 0 }).format(amount);
  }

  displayRent(p: PropertyDetails): string {
    const amount = p.lease?.rentAmount ?? p.rent;
    if (!amount) return '—';
    return this.formatRent(amount, p.lease?.currency ?? 'EUR') + '/mois';
  }
}
