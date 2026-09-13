import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable, of, catchError, switchMap } from 'rxjs';
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
              <div style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:8px;">Photo du bien</div>
              <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                <input id="prop-photo" #photoInput type="file" class="nm-file-input"
                  accept="image/jpeg,image/png,image/gif,image/webp" (change)="onPhotoSelected($event)">
                <label for="prop-photo" class="nm-file">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2.5" />
                    <circle cx="8.8" cy="8.8" r="1.6" />
                    <path d="M21 14.5 16 9.5 5.5 20" />
                  </svg>
                  {{ photoPreview ? 'Changer la photo' : 'Choisir une photo' }}
                </label>
                <span style="font-size:12.5px;color:#8A938E;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ photoStatus }}</span>
              </div>
              <p style="margin:8px 0 0;font-size:11.5px;color:#9AA49E;">JPEG, PNG, GIF ou WebP — 5 Mo maximum.</p>
              @if (photoError) { <p style="color:#C2563B;margin:6px 0 0;font-size:12.5px;">{{ photoError }}</p> }
              @if (photoPreview) {
                <div style="position:relative;margin-top:10px;">
                  <img [src]="photoPreview" alt="Aperçu de la photo du bien"
                    style="display:block;width:100%;max-height:200px;object-fit:cover;border-radius:10px;border:1px solid #E4E7E2;">
                  <button type="button" (click)="removePhoto()" class="nm-del"
                    style="position:absolute;top:10px;right:10px;padding:7px 13px;border:1px solid #E4E7E2;border-radius:9px;background:rgba(255,255,255,0.94);color:#C2563B;font-family:inherit;font-weight:600;font-size:12.5px;cursor:pointer;">
                    Retirer la photo
                  </button>
                </div>
              }
            </div>
            <div style="grid-column:1/3;">
              <label for="prop-description" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Description</label>
              <textarea id="prop-description" [(ngModel)]="newProp.description" rows="3" placeholder="Appartement lumineux, balcon, parking…"
                style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;outline:none;resize:vertical;"></textarea>
            </div>
          </div>
          <div style="display:flex;gap:10px;margin-top:16px;">
            <button (click)="saveProperty()" [disabled]="saving"
              [style.opacity]="saving ? '0.6' : '1'"
              style="padding:11px 22px;border:none;border-radius:10px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
              {{ saving ? 'Enregistrement…' : (editingId ? 'Enregistrer les modifications' : 'Enregistrer') }}
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

      /* Le champ fichier natif est masqué : c'est le label .nm-file qui sert de bouton.
         Masquage accessible (et non display:none) pour que le focus clavier reste possible. */
      .nm-file-input {
        position:absolute; width:1px; height:1px; padding:0; margin:-1px;
        overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0;
      }
      .nm-file {
        display:inline-flex; align-items:center; gap:8px;
        padding:10px 16px; border:1px solid #D6DED9; border-radius:10px;
        background:#fff; color:#0E4F4A;
        font-family:inherit; font-weight:600; font-size:13.5px;
        cursor:pointer; user-select:none;
        transition:background .15s ease, border-color .15s ease, box-shadow .15s ease;
      }
      .nm-file:hover { background:#E7F1EF; border-color:#CFE0DA; }
      .nm-file:active { background:#DCEAE6; }
      .nm-file svg { flex-shrink:0; opacity:0.75; }
      .nm-file-input:focus-visible + .nm-file { border-color:#0E4F4A; box-shadow:0 0 0 3px rgba(14,79,74,0.16); }
    </style>
  `
})
export class BiensComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  properties: PropertyDetails[] = [];
  buildings: Building[] = [];
  loading = true;
  showForm = false;
  error = '';
  removingId: number | null = null;
  editingId: number | null = null;
  saving = false;
  newProp: Partial<Property> = { name: '', kind: '', size: '', location: '' };

  // Photo : fichier choisi, aperçu affiché, et suppression demandée de la photo existante.
  photoFile: File | null = null;
  photoPreview: string | null = null;
  photoCleared = false;
  photoError = '';

  private static readonly PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private static readonly PHOTO_MAX_BYTES = 5 * 1024 * 1024;

  /** Texte affiché à côté du bouton : nom du fichier choisi, ou état courant. */
  get photoStatus(): string {
    if (this.photoFile) return this.photoFile.name;
    if (this.photoPreview) return 'Photo actuelle';
    return 'Aucun fichier sélectionné';
  }

  private emptyProp(): Partial<Property> {
    // imageUrl est absent volontairement : la photo passe par ses propres endpoints,
    // et le backend conserve la valeur existante quand le champ n'est pas transmis.
    return { name: '', kind: '', size: '', location: '', rent: undefined, description: '', buildingId: undefined };
  }

  /** Libère l'aperçu local et remet l'état photo à zéro. */
  private resetPhoto() {
    if (this.photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoFile = null;
    this.photoPreview = null;
    this.photoCleared = false;
    this.photoError = '';
    if (this.photoInput) this.photoInput.nativeElement.value = '';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!BiensComponent.PHOTO_TYPES.includes(file.type)) {
      this.photoError = 'Format non supporté. Choisissez une image JPEG, PNG, GIF ou WebP.';
      input.value = '';
      return;
    }
    if (file.size > BiensComponent.PHOTO_MAX_BYTES) {
      this.photoError = 'Image trop volumineuse (5 Mo maximum).';
      input.value = '';
      return;
    }

    if (this.photoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(this.photoPreview);
    }
    this.photoFile = file;
    this.photoPreview = URL.createObjectURL(file);
    this.photoCleared = false;
    this.photoError = '';
  }

  removePhoto() {
    const wasEditing = this.editingId !== null;
    this.resetPhoto();
    // En modification, la photo déjà enregistrée doit être supprimée côté serveur.
    this.photoCleared = wasEditing;
  }

  /** Applique le changement de photo une fois le bien enregistré. */
  private syncPhoto(propertyId: number): Observable<unknown> {
    if (this.photoFile) return this.api.uploadPropertyPhoto(propertyId, this.photoFile);
    if (this.photoCleared) return this.api.deletePropertyPhoto(propertyId);
    return of(null);
  }

  openCreate() {
    this.editingId = null;
    this.error = '';
    this.resetPhoto();
    this.newProp = this.emptyProp();
    this.showForm = !this.showForm;
  }

  startEdit(p: PropertyDetails) {
    this.editingId = p.id;
    this.error = '';
    this.newProp = {
      name: p.name, kind: p.kind, size: p.size, location: p.location,
      rent: p.rent ?? p.lease?.rentAmount, description: p.description,
      buildingId: p.building?.id,
    };
    this.resetPhoto();
    // Aperçu de la photo déjà enregistrée, tant qu'aucun nouveau fichier n'est choisi.
    this.photoPreview = p.imageUrl ?? null;
    this.showForm = true;
    // Le formulaire est en haut de la page : on y remonte pour qu'il soit visible.
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
    this.resetPhoto();
    this.newProp = this.emptyProp();
    this.error = '';
  }

  saveProperty() {
    this.error = '';
    if (!this.newProp.name) { this.error = 'Le nom est requis.'; return; }

    const isEdit = this.editingId !== null;
    // La photo s'envoie après coup : à la création, l'identifiant du bien n'existe pas encore.
    const saved$ = isEdit
      ? this.api.updateProperty(this.editingId as number, this.newProp)
      : this.api.createProperty(this.newProp as Omit<Property, 'id'>);

    let photoFailed = false;
    this.saving = true;
    saved$.pipe(
      switchMap(saved => this.syncPhoto(saved.id).pipe(
        catchError(() => { photoFailed = true; return of(null); })
      ))
    ).subscribe({
      next: () => {
        this.saving = false;
        this.cancelForm();
        if (photoFailed) {
          this.toast.error('Bien enregistré, mais l\'envoi de la photo a échoué');
        } else {
          this.toast.success(isEdit ? 'Bien modifié' : 'Bien ajouté');
        }
        this.load();
      },
      error: () => {
        this.saving = false;
        this.error = isEdit ? 'Erreur lors de la modification.' : 'Erreur lors de la création.';
        this.toast.error(isEdit ? 'Impossible de modifier le bien' : 'Impossible d\'ajouter le bien');
      }
    });
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
