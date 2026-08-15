import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, Document, PropertyDetails, Tenant, Lease } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:24px;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Archivage</div>
          <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Documents</h1>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button (click)="toggle('bail')"
            style="padding:11px 18px;border:1px solid #0E4F4A;border-radius:11px;background:#fff;color:#0E4F4A;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
            Générer un bail
          </button>
          <button (click)="toggle('quittance')"
            style="padding:11px 18px;border:1px solid #0E4F4A;border-radius:11px;background:#fff;color:#0E4F4A;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
            Générer une quittance
          </button>
          <button (click)="toggle('upload')"
            style="padding:11px 18px;border:none;border-radius:11px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
            + Importer une pièce
          </button>
        </div>
      </div>

      <!-- Générer un bail (PDF réel) -->
      @if (panel === 'bail') {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;margin-bottom:24px;">
          <h2 style="margin:0 0 6px;font-size:16px;font-weight:700;">Générer un contrat de bail</h2>
          <p style="margin:0 0 16px;font-size:13px;color:#8A938E;">Un PDF est généré à partir des informations du bail (bailleur, locataire, bien, loyer, dates).</p>
          @if (leases.length === 0) {
            <p style="color:#9AA49E;font-size:13.5px;">Aucun bail actif. Attribuez d'abord un locataire à un bien.</p>
          } @else {
            <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;">
              <div style="flex:1;min-width:260px;">
                <label for="bail-lease" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Bail</label>
                <select id="bail-lease" [(ngModel)]="selectedLeaseId"
                  style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
                  <option [ngValue]="null">— Choisir un bail —</option>
                  @for (l of leases; track l.id) {
                    <option [ngValue]="l.id">{{ leaseLabel(l) }}</option>
                  }
                </select>
              </div>
              <button (click)="generateBail()" [disabled]="!selectedLeaseId || working"
                style="padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
                {{ working ? 'Génération…' : 'Générer le PDF' }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Générer une quittance (PDF réel) -->
      @if (panel === 'quittance') {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;margin-bottom:24px;">
          <h2 style="margin:0 0 6px;font-size:16px;font-weight:700;">Générer une quittance de loyer</h2>
          <p style="margin:0 0 16px;font-size:13px;color:#8A938E;">Quittance PDF pour un bail et un mois donné (bailleur, locataire, bien, montant).</p>
          @if (leases.length === 0) {
            <p style="color:#9AA49E;font-size:13.5px;">Aucun bail actif. Attribuez d'abord un locataire à un bien.</p>
          } @else {
            <div style="display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;">
              <div style="flex:1;min-width:240px;">
                <label for="quittance-lease" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Bail</label>
                <select id="quittance-lease" [(ngModel)]="quittanceLeaseId"
                  style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
                  <option [ngValue]="null">— Choisir un bail —</option>
                  @for (l of leases; track l.id) {
                    <option [ngValue]="l.id">{{ leaseLabel(l) }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="quittance-month" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Mois</label>
                <input id="quittance-month" type="month" [(ngModel)]="quittanceMonth"
                  style="padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
              </div>
              <button (click)="generateQuittance()" [disabled]="!quittanceLeaseId || !quittanceMonth || working"
                style="padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
                {{ working ? 'Génération…' : 'Générer le PDF' }}
              </button>
            </div>
          }
        </div>
      }

      <!-- Importer une pièce justificative (upload réel) -->
      @if (panel === 'upload') {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;margin-bottom:24px;">
          <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;">Importer une pièce justificative</h2>
          <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:14px;">
            <div style="grid-column:1/3;">
              <label for="doc-name" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Nom (optionnel)</label>
              <input id="doc-name" [(ngModel)]="newDoc.name" placeholder="Pièce d'identité — Thomas Bernard"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;">
            </div>
            <div>
              <label for="doc-type" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Type</label>
              <select id="doc-type" [(ngModel)]="newDoc.docType"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
                <option value="IDENTITY">Pièce d'identité</option>
                <option value="LEASE">Bail</option>
                <option value="QUITTANCE">Quittance</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label for="doc-tenant" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Lié au locataire</label>
              <select id="doc-tenant" [(ngModel)]="newDoc.tenantId"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
                <option [ngValue]="undefined">— Aucun —</option>
                @for (t of tenants; track t.id) {
                  <option [ngValue]="t.id">{{ t.firstName }} {{ t.lastName }}</option>
                }
              </select>
            </div>
            <div>
              <label for="doc-property" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Lié au bien</label>
              <select id="doc-property" [(ngModel)]="newDoc.propertyId"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
                <option [ngValue]="undefined">— Aucun —</option>
                @for (p of properties; track p.id) {
                  <option [ngValue]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>
            <div style="grid-column:1/5;">
              <label for="doc-file" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Fichier (PDF, image…)</label>
              <input id="doc-file" type="file" (change)="onFileSelected($event)"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                style="width:100%;padding:10px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;background:#fff;outline:none;">
              @if (selectedFile) {
                <div style="margin-top:8px;font-size:12.5px;color:#5A655F;">{{ selectedFile.name }} ({{ fileSize(selectedFile.size) }})</div>
              }
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button (click)="uploadDoc()" [disabled]="working"
              style="padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
              {{ working ? 'Import…' : 'Importer' }}
            </button>
            <button (click)="panel=null"
              style="padding:11px 22px;border:1px solid #D6DED9;border-radius:10px;background:#fff;color:#16201D;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
              Annuler
            </button>
          </div>
        </div>
      }

      <!-- Filter tabs -->
      <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
        @for (t of typeTabs; track t.value) {
          <button (click)="activeType=t.value"
            [style.background]="activeType===t.value ? '#0E4F4A' : '#fff'"
            [style.color]="activeType===t.value ? '#fff' : '#5A655F'"
            [style.border]="activeType===t.value ? '1px solid #0E4F4A' : '1px solid #E4E7E2'"
            style="padding:8px 15px;border-radius:999px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;">
            {{ t.label }}
          </button>
        }
      </div>

      <div class="nm-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">
        @for (d of visibleDocuments; track d.id) {
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:14px;padding:18px;display:flex;gap:13px;align-items:center;">
            <div style="width:40px;height:40px;border-radius:10px;background:#E7F1EF;color:#0E4F4A;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:10px;flex:none;">
              {{ fileBadge(d) }}
            </div>
            <div style="min-width:0;flex:1;">
              <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ d.name }}</div>
              <div style="font-size:11.5px;color:#9AA49E;">{{ typeLabel(d.docType) }} · {{ d.createdAt }}</div>
            </div>
            @if (d.hasFile) {
              <button (click)="download(d)" title="Télécharger / ouvrir"
                style="border:1px solid #D6DED9;background:#fff;color:#0E4F4A;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;padding:6px 10px;flex:none;">
                Ouvrir
              </button>
            } @else {
              <span style="font-size:11px;color:#B9C0BA;flex:none;">Sans fichier</span>
            }
            <button (click)="deleteDoc(d.id)" title="Supprimer"
              style="border:none;background:transparent;color:#C2563B;cursor:pointer;font-size:13px;flex:none;">✕</button>
          </div>
        }
        @if (visibleDocuments.length === 0) {
          <div style="grid-column:1/-1;text-align:center;padding:48px;color:#9AA49E;">Aucun document dans cette catégorie.</div>
        }
      </div>
    </div>
  `
})
export class DocumentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  documents: Document[] = [];
  properties: PropertyDetails[] = [];
  tenants: Tenant[] = [];
  leases: Lease[] = [];
  panel: 'upload' | 'bail' | 'quittance' | null = null;
  newDoc: Partial<Document> = { docType: 'IDENTITY' };
  selectedFile: File | null = null;
  selectedLeaseId: number | null = null;
  quittanceLeaseId: number | null = null;
  quittanceMonth: string = new Date().toISOString().slice(0, 7);
  working = false;
  activeType = 'ALL';

  typeTabs = [
    { value: 'ALL', label: 'Tous' },
    { value: 'QUITTANCE', label: 'Quittances' },
    { value: 'LEASE', label: 'Baux' },
    { value: 'IDENTITY', label: 'Identité' },
    { value: 'OTHER', label: 'Autres' },
  ];

  get visibleDocuments(): Document[] {
    if (this.activeType === 'ALL') return this.documents;
    return this.documents.filter(d => d.docType === this.activeType);
  }

  toggle(panel: 'upload' | 'bail' | 'quittance') {
    this.panel = this.panel === panel ? null : panel;
  }

  ngOnInit() {
    this.load();
    this.api.getPropertyDetails().subscribe({ next: p => this.properties = p, error: () => {} });
    this.api.getTenants().subscribe({ next: t => this.tenants = t, error: () => {} });
    this.api.getLeases().subscribe({ next: l => this.leases = l, error: () => {} });
  }

  load() {
    this.api.getDocuments().subscribe({ next: d => this.documents = d, error: () => {} });
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length ? input.files[0] : null;
  }

  uploadDoc() {
    if (!this.selectedFile) { this.toast.error('Choisissez un fichier'); return; }
    const form = new FormData();
    form.append('file', this.selectedFile);
    if (this.newDoc.name) form.append('name', this.newDoc.name);
    form.append('docType', this.newDoc.docType || 'IDENTITY');
    if (this.newDoc.propertyId) form.append('propertyId', String(this.newDoc.propertyId));
    if (this.newDoc.tenantId) form.append('tenantId', String(this.newDoc.tenantId));
    this.working = true;
    this.api.uploadDocument(form).subscribe({
      next: () => {
        this.working = false;
        this.panel = null;
        this.newDoc = { docType: 'IDENTITY' };
        this.selectedFile = null;
        this.toast.success('Pièce importée');
        this.load();
      },
      error: () => { this.working = false; this.toast.error('Import impossible'); }
    });
  }

  generateBail() {
    if (!this.selectedLeaseId) return;
    this.working = true;
    this.api.generateBail(this.selectedLeaseId).subscribe({
      next: () => {
        this.working = false;
        this.panel = null;
        this.selectedLeaseId = null;
        this.toast.success('Contrat de bail généré (PDF)');
        this.load();
      },
      error: () => { this.working = false; this.toast.error('Génération impossible'); }
    });
  }

  generateQuittance() {
    if (!this.quittanceLeaseId || !this.quittanceMonth) return;
    const [year, month] = this.quittanceMonth.split('-').map(Number);
    this.working = true;
    this.api.generateQuittance(this.quittanceLeaseId, year, month).subscribe({
      next: () => {
        this.working = false;
        this.panel = null;
        this.quittanceLeaseId = null;
        this.toast.success('Quittance générée (PDF)');
        this.load();
      },
      error: () => { this.working = false; this.toast.error('Génération impossible'); }
    });
  }

  download(d: Document) {
    this.api.downloadDocument(d.id).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: () => this.toast.error('Téléchargement impossible')
    });
  }

  deleteDoc(id: number) {
    this.api.deleteDocument(id).subscribe({
      next: () => { this.toast.success('Document supprimé'); this.load(); },
      error: () => this.toast.error('Suppression impossible')
    });
  }

  leaseLabel(l: Lease): string {
    const prop = this.properties.find(p => p.id === l.propertyId);
    const propName = prop?.name ?? ('Bien #' + l.propertyId);
    const tenantName = prop?.tenant ? ` — ${prop.tenant.firstName} ${prop.tenant.lastName}` : '';
    return propName + tenantName;
  }

  fileBadge(d: Document): string {
    if (!d.hasFile) return '—';
    const n = (d.fileName ?? '').toLowerCase();
    if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp')) return 'IMG';
    return 'PDF';
  }

  fileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  typeLabel(t: string): string {
    return t === 'LEASE' ? 'Bail' : t === 'QUITTANCE' ? 'Quittance' : t === 'IDENTITY' ? 'Identité' : 'Autre';
  }
}
