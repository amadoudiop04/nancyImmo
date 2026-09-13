import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, PropertyDetails, Document, Lease, Tenant } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-bien-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <a routerLink="../" style="border:none;background:transparent;color:#5A655F;font-weight:600;font-size:13px;font-family:inherit;cursor:pointer;margin-bottom:14px;display:inline-block;text-decoration:none;">← Mes biens</a>

      @if (!property) {
        <div style="text-align:center;padding:48px;color:#9AA49E;">Chargement…</div>
      } @else {
        <div class="nm-split" style="display:grid;grid-template-columns:1.5fr 1fr;gap:18px;">
          <div>
            <div style="position:relative;height:240px;border-radius:18px;overflow:hidden;display:flex;align-items:flex-end;padding:16px;"
              [style.background]="property.imageUrl ? '#EDEFEA' : 'repeating-linear-gradient(45deg,#EDEFEA,#EDEFEA 13px,#E4E7E2 13px,#E4E7E2 26px)'">
              @if (property.imageUrl) {
                <img [src]="property.imageUrl" alt="{{ property.name }}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
              } @else {
                <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9AA49E;background:#fff;padding:3px 9px;border-radius:6px;">galerie photos du bien</span>
              }
            </div>
            <h1 style="margin:18px 0 4px;font-size:26px;font-weight:800;letter-spacing:-0.02em;">{{ property.name }}</h1>
            <div style="font-size:14px;color:#8A938E;">{{ property.location }}</div>

            @if (property.description) {
              <p style="margin:14px 0 0;font-size:14px;color:#5A655F;line-height:1.6;">{{ property.description }}</p>
            }

            <div style="display:flex;gap:10px;margin-top:16px;">
              <div style="flex:1;background:#fff;border:1px solid #E4E7E2;border-radius:13px;padding:15px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Type</div>
                <div style="font-weight:700;font-size:18px;margin-top:5px;">{{ property.kind || '—' }}</div>
              </div>
              <div style="flex:1;background:#fff;border:1px solid #E4E7E2;border-radius:13px;padding:15px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Surface</div>
                <div style="font-weight:700;font-size:18px;margin-top:5px;">{{ property.size || '—' }}</div>
              </div>
              <div style="flex:1;background:#fff;border:1px solid #E4E7E2;border-radius:13px;padding:15px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Loyer</div>
                <div style="font-weight:700;font-size:18px;margin-top:5px;color:#0E4F4A;">{{ formatRent(property.lease?.rentAmount, property.lease?.currency) }}</div>
              </div>
            </div>

            <!-- Documents -->
            <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;margin-top:18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div style="font-size:15px;font-weight:700;">Documents du bien</div>
                <button (click)="addDoc()" style="padding:7px 14px;border:none;border-radius:8px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:12px;cursor:pointer;">+ Ajouter</button>
              </div>
              @if (showDocForm) {
                <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
                  <input [(ngModel)]="newDoc.name" placeholder="Nom du document"
                    style="flex:1;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;min-width:140px;">
                  <select [(ngModel)]="newDoc.docType"
                    style="padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;background:#fff;">
                    <option value="LEASE">Bail</option>
                    <option value="QUITTANCE">Quittance</option>
                    <option value="IDENTITY">Identité</option>
                    <option value="OTHER">Autre</option>
                  </select>
                  <button (click)="saveDoc()" style="padding:9px 14px;border:none;border-radius:8px;background:#2A9D8F;color:#fff;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">Sauvegarder</button>
                  <button (click)="showDocForm=false" style="padding:9px 14px;border:1px solid #D6DED9;border-radius:8px;background:#fff;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">Annuler</button>
                </div>
              }
              <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                @for (d of documents; track d.id) {
                  <div style="display:flex;align-items:center;gap:11px;padding:11px;border:1px solid #EEF1ED;border-radius:11px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:#E7F1EF;color:#0E4F4A;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;flex:none;">PDF</div>
                    <div style="min-width:0;flex:1;">
                      <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ d.name }}</div>
                      <div style="font-size:11px;color:#9AA49E;">{{ d.docType }} · {{ d.createdAt }}</div>
                    </div>
                    <button (click)="deleteDoc(d.id)" style="border:none;background:transparent;color:#C2563B;cursor:pointer;font-size:13px;">✕</button>
                  </div>
                }
                @if (documents.length === 0) {
                  <p style="grid-column:1/-1;color:#9AA49E;font-size:13px;">Aucun document.</p>
                }
              </div>
            </div>

            <!-- Lease form -->
            @if (!property.lease) {
              <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;margin-top:18px;">
                <div style="font-size:15px;font-weight:700;margin-bottom:14px;">Créer un bail</div>
                <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div>
                    <label for="new-lease-start" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Date de début</label>
                    <input id="new-lease-start" type="date" [(ngModel)]="newLease.startDate" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                  </div>
                  <div>
                    <label for="new-lease-end" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Date de fin</label>
                    <input id="new-lease-end" type="date" [(ngModel)]="newLease.endDate" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                  </div>
                  <div>
                    <label for="new-lease-rent" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Loyer (€)</label>
                    <input id="new-lease-rent" type="number" [(ngModel)]="newLease.rentAmount" placeholder="800" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                  </div>
                  <div>
                    <label for="new-lease-tenant" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Locataire</label>
                    <select id="new-lease-tenant" [(ngModel)]="newLease.tenantId" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;background:#fff;">
                      <option [value]="undefined">— Sélectionner —</option>
                      @for (t of tenants; track t.id) {
                        <option [value]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
                      }
                    </select>
                  </div>
                </div>
                <button (click)="createLease()" style="margin-top:14px;padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
                  Créer le bail
                </button>
              </div>
            }
          </div>

          <!-- Right panel -->
          <div>
            @if (property.tenant) {
              <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;">Locataire en place</div>
                <div style="display:flex;align-items:center;gap:13px;margin-top:14px;">
                  <div style="width:46px;height:46px;border-radius:13px;background:#0E4F4A;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">
                    {{ property.tenant.firstName[0] }}{{ property.tenant.lastName[0] }}
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:15px;">{{ property.tenant.firstName }} {{ property.tenant.lastName }}</div>
                    <div style="font-size:12.5px;color:#8A938E;">Bail en cours</div>
                  </div>
                </div>
                <div style="margin-top:14px;font-size:13px;color:#5A655F;">{{ property.tenant.email }}</div>
              </div>
            } @else {
              <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;text-align:center;">
                <div style="color:#9AA49E;font-size:14px;">Aucun locataire en place</div>
              </div>
            }

            @if (property.lease) {
              <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;margin-top:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                  <div style="font-size:15px;font-weight:700;">Contrat de bail</div>
                  @if (!editingLease) {
                    <button (click)="startEditLease()" style="border:1px solid #D6DED9;background:#fff;color:#0E4F4A;border-radius:8px;font-family:inherit;font-weight:600;font-size:12px;padding:5px 11px;cursor:pointer;">Modifier</button>
                  }
                </div>

                @if (!editingLease) {
                  <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:30px;font-weight:800;color:#2A9D8F;letter-spacing:-0.02em;">{{ formatRent(property.lease.rentAmount, property.lease.currency) }}</span>
                    <span style="font-size:13px;color:#2A9D8F;font-weight:600;">/mois</span>
                  </div>
                  <div style="margin-top:16px;display:flex;flex-direction:column;gap:11px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;">
                      <span style="color:#5A655F;">Date de début</span>
                      <span style="font-family:'IBM Plex Mono',monospace;font-weight:500;">{{ property.lease.startDate }}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;">
                      <span style="color:#5A655F;">Date de fin</span>
                      <span style="font-family:'IBM Plex Mono',monospace;font-weight:500;">{{ property.lease.endDate }}</span>
                    </div>
                  </div>
                  <button (click)="deleteLease()" style="margin-top:14px;width:100%;padding:9px;border:1px solid #C2563B;border-radius:8px;background:#fff;color:#C2563B;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">
                    Résilier le bail
                  </button>
                } @else {
                  <div style="display:flex;flex-direction:column;gap:11px;">
                    <div>
                      <label for="edit-lease-rent" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Loyer (€)</label>
                      <input id="edit-lease-rent" type="number" [(ngModel)]="leaseEdit.rentAmount" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                    </div>
                    <div>
                      <label for="edit-lease-start" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Date de début</label>
                      <input id="edit-lease-start" type="date" [(ngModel)]="leaseEdit.startDate" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                    </div>
                    <div>
                      <label for="edit-lease-end" style="font-size:12px;font-weight:600;color:#5A655F;margin-bottom:5px;display:block;">Date de fin</label>
                      <input id="edit-lease-end" type="date" [(ngModel)]="leaseEdit.endDate" style="width:100%;padding:9px 12px;border:1px solid #D6DED9;border-radius:8px;font-family:inherit;font-size:13px;">
                    </div>
                  </div>
                  <div style="display:flex;gap:9px;margin-top:14px;">
                    <button (click)="saveLease()" style="flex:1;padding:9px;border:none;border-radius:8px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">Enregistrer</button>
                    <button (click)="editingLease=false" style="padding:9px 14px;border:1px solid #D6DED9;border-radius:8px;background:#fff;color:#16201D;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">Annuler</button>
                  </div>
                }
              </div>
            }

            @if (property.building) {
              <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px;margin-top:16px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:#9AA49E;margin-bottom:10px;">Immeuble</div>
                <div style="font-weight:700;">{{ property.building.name }}</div>
                <div style="font-size:13px;color:#8A938E;margin-top:4px;">{{ property.building.street }}, {{ property.building.city }}</div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class BiensDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  property: PropertyDetails | null = null;
  documents: Document[] = [];
  tenants: Tenant[] = [];
  showDocForm = false;
  newDoc: Partial<Document> = { name: '', docType: 'OTHER' };
  newLease: Partial<Lease> = { startDate: '', endDate: '', rentAmount: 0, currency: 'EUR' };
  editingLease = false;
  leaseEdit: Partial<Lease> = { startDate: '', endDate: '', rentAmount: 0 };
  propertyId!: number;

  ngOnInit() {
    this.propertyId = +this.route.snapshot.paramMap.get('id')!;
    this.load();
    this.api.getTenants().subscribe({ next: t => this.tenants = t, error: () => {} });
    this.api.getDocuments({ propertyId: this.propertyId }).subscribe({ next: d => this.documents = d, error: () => {} });
  }

  load() {
    this.api.getPropertyDetail(this.propertyId).subscribe({ next: p => this.property = p, error: () => {} });
  }

  addDoc() { this.showDocForm = true; this.newDoc = { name: '', docType: 'OTHER' }; }

  saveDoc() {
    this.api.createDocument({ ...this.newDoc, propertyId: this.propertyId, createdAt: new Date().toISOString().slice(0, 10) } as Omit<Document, 'id'>).subscribe({
      next: () => {
        this.showDocForm = false;
        this.api.getDocuments({ propertyId: this.propertyId }).subscribe({ next: d => this.documents = d, error: () => {} });
      },
      error: () => {}
    });
  }

  deleteDoc(id: number) {
    this.api.deleteDocument(id).subscribe({
      next: () => this.api.getDocuments({ propertyId: this.propertyId }).subscribe({ next: d => this.documents = d, error: () => {} }),
      error: () => {}
    });
  }

  createLease() {
    this.api.createLease({ ...this.newLease, propertyId: this.propertyId } as Omit<Lease, 'id'>).subscribe({
      next: () => { this.toast.success('Bail créé'); this.load(); },
      error: () => this.toast.error('Impossible de créer le bail')
    });
  }

  startEditLease() {
    if (!this.property?.lease) return;
    this.editingLease = true;
    this.leaseEdit = {
      startDate: this.property.lease.startDate,
      endDate: this.property.lease.endDate,
      rentAmount: this.property.lease.rentAmount,
      currency: this.property.lease.currency ?? 'EUR',
    };
  }

  saveLease() {
    if (!this.property?.lease) return;
    this.api.updateLease(this.property.lease.id, this.leaseEdit).subscribe({
      next: () => { this.editingLease = false; this.toast.success('Bail modifié'); this.load(); },
      error: () => this.toast.error('Impossible de modifier le bail')
    });
  }

  deleteLease() {
    if (!this.property?.lease) return;
    if (!confirm('Résilier ce bail ?')) return;
    this.api.deleteLease(this.property.lease.id).subscribe({
      next: () => { this.toast.success('Bail résilié'); this.load(); },
      error: () => this.toast.error('Impossible de résilier le bail')
    });
  }

  formatRent(amount?: number, currency?: string): string {
    if (!amount) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency ?? 'EUR', maximumFractionDigits: 0 }).format(amount);
  }
}
