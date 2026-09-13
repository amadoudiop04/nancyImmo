import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, Landlord, PropertyDetails } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div style="max-width:1000px;margin:0 auto;padding:34px 32px 60px;">
      <div style="margin-bottom:24px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Compte</div>
        <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Mon profil</h1>
      </div>

      @if (!landlord) {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:18px;padding:40px;text-align:center;">
          <div style="font-size:15px;color:#5A655F;">
            @if (loading) { Chargement de votre profil… }
            @else { Aucun profil bailleur trouvé pour ce compte. }
          </div>
          @if (!loading) {
            <a routerLink="/inscription"
              style="display:inline-block;margin-top:18px;background:#0E4F4A;color:#fff;padding:12px 24px;border-radius:11px;font-family:inherit;font-weight:700;font-size:14px;text-decoration:none;">
              Créer mon compte bailleur
            </a>
          }
        </div>
      } @else {
        <div class="nm-split" style="display:grid;grid-template-columns:300px 1fr;gap:20px;align-items:flex-start;">
          <!-- Avatar card -->
          <div style="background:#fff;border:1px solid #E4E7E2;border-radius:18px;padding:26px;text-align:center;">
            <div style="width:84px;height:84px;border-radius:24px;background:#0E4F4A;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;margin:0 auto;">
              {{ initials }}
            </div>
            <div style="font-size:19px;font-weight:800;margin-top:16px;">{{ landlord.firstName }} {{ landlord.lastName }}</div>
            <div style="font-size:13.5px;color:#8A938E;margin-top:3px;">{{ landlord.email }}</div>
            <span style="display:inline-block;margin-top:12px;background:#E7F1EF;color:#0E4F4A;font-size:12px;font-weight:600;padding:6px 13px;border-radius:999px;">
              Bailleur · {{ propertyCount }} bien{{ propertyCount > 1 ? 's' : '' }}
            </span>
            <button disabled title="Bientôt disponible"
              style="margin-top:18px;width:100%;padding:11px;border:1px solid #D6DED9;background:#fff;color:#16201D;border-radius:10px;font-family:inherit;font-weight:600;font-size:13.5px;cursor:not-allowed;opacity:0.7;">
              Changer la photo
            </button>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px;">
            <!-- Informations personnelles -->
            <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;">
              <div style="font-size:16px;font-weight:700;margin-bottom:18px;">Informations personnelles</div>
              <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <div>
                  <label for="profil-firstname" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Prénom</label>
                  <input id="profil-firstname" [(ngModel)]="landlord.firstName" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
                <div>
                  <label for="profil-lastname" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Nom</label>
                  <input id="profil-lastname" [(ngModel)]="landlord.lastName" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
                <div>
                  <label for="profil-email" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Email</label>
                  <input id="profil-email" [(ngModel)]="landlord.email" type="email" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
                <div>
                  <label for="profil-phone" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Téléphone</label>
                  <input id="profil-phone" [(ngModel)]="landlord.phone" type="tel" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
                <div>
                  <label for="profil-city" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Ville</label>
                  <input id="profil-city" [(ngModel)]="landlord.city" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
                <div>
                  <label for="profil-zipcode" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Code postal</label>
                  <input id="profil-zipcode" [(ngModel)]="landlord.zipCode" style="width:100%;padding:11px 13px;border:1px solid #D6DED9;border-radius:10px;font-family:inherit;font-size:14px;color:#16201D;background:#fff;outline:none;">
                </div>
              </div>
            </div>

            <!-- Préférences de notification -->
            <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:24px;">
              <div style="font-size:16px;font-weight:700;margin-bottom:18px;">Préférences de notification</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                @for (n of notifPrefs; track n.key; let last = $last) {
                  <div [style.border-bottom]="last ? 'none' : '1px solid #F2F4F0'"
                    style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;">
                    <div>
                      <div style="font-size:14px;font-weight:600;">{{ n.title }}</div>
                      <div style="font-size:12.5px;color:#8A938E;">{{ n.sub }}</div>
                    </div>
                    <button type="button" role="switch" (click)="n.on = !n.on"
                      [attr.aria-checked]="n.on" [attr.aria-label]="n.title"
                      [style.background]="n.on ? '#2A9D8F' : '#D6DED9'"
                      style="width:44px;height:25px;border:none;padding:0;border-radius:999px;position:relative;cursor:pointer;transition:background .15s;flex:none;">
                      <div [style.left]="n.on ? 'auto' : '3px'" [style.right]="n.on ? '3px' : 'auto'"
                        style="position:absolute;top:3px;width:19px;height:19px;border-radius:50%;background:#fff;"></div>
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:10px;align-items:center;">
              <button (click)="save()"
                style="padding:12px 22px;border:none;border-radius:11px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;">
                {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
              <button (click)="logout()"
                style="padding:12px 22px;border:1px solid #E4C8C0;background:#fff;color:#C2563B;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;border-radius:11px;">
                Se déconnecter
              </button>
              @if (savedMessage) {
                <span style="font-size:13px;color:#2A9D8F;font-weight:600;">{{ savedMessage }}</span>
              }
            </div>

            <!-- Zone de danger : suppression du compte -->
            <div style="background:#fff;border:1px solid #F0D9D2;border-radius:16px;padding:24px;">
              <div style="font-size:16px;font-weight:700;margin-bottom:6px;color:#C2563B;">Zone de danger</div>
              <p style="font-size:13px;color:#8A938E;margin:0 0 16px;line-height:1.6;">
                La suppression de votre compte est <strong>définitive</strong> et efface toutes vos données :
                biens, locataires, baux, paiements, candidatures et documents. Cette action est irréversible.
              </p>
              @if (!confirmingDelete) {
                <button (click)="confirmingDelete = true"
                  style="padding:11px 20px;border:1px solid #E4C8C0;background:#fff;color:#C2563B;font-family:inherit;font-weight:600;font-size:14px;cursor:pointer;border-radius:11px;">
                  Supprimer mon compte
                </button>
              } @else {
                <div style="background:#FBF1EE;border:1px solid #F0D9D2;border-radius:12px;padding:16px;">
                  <div style="font-size:13.5px;font-weight:600;color:#16201D;margin-bottom:12px;">
                    Confirmez-vous la suppression définitive de votre compte ?
                  </div>
                  <div style="display:flex;gap:10px;">
                    <button (click)="deleteAccount()" [disabled]="deleting"
                      style="padding:10px 18px;border:none;border-radius:10px;background:#C2563B;color:#fff;font-family:inherit;font-weight:600;font-size:13.5px;cursor:pointer;">
                      {{ deleting ? 'Suppression…' : 'Oui, supprimer définitivement' }}
                    </button>
                    <button (click)="confirmingDelete = false" [disabled]="deleting"
                      style="padding:10px 18px;border:1px solid #D6DED9;border-radius:10px;background:#fff;color:#16201D;font-family:inherit;font-weight:600;font-size:13.5px;cursor:pointer;">
                      Annuler
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ProfilComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  landlord: Landlord | null = null;
  loading = true;
  saving = false;
  savedMessage = '';
  propertyCount = 0;
  confirmingDelete = false;
  deleting = false;

  notifPrefs = [
    { key: 'payments', title: 'Paiements reçus', sub: 'Alerte à chaque loyer encaissé', on: true },
    { key: 'late', title: 'Retards de paiement', sub: 'Relance automatique des locataires', on: true },
    { key: 'applications', title: 'Nouvelles candidatures', sub: 'Dossiers déposés sur vos biens', on: false },
  ];

  ngOnInit() {
    // Identifie le bailleur via la session sécurisée (JWT) : /api/auth/me.
    this.auth.me().subscribe({
      next: (me) => {
        this.api.getLandlords().subscribe({
          next: (landlords) => {
            this.landlord = landlords.find(l => l.email?.toLowerCase() === me.email?.toLowerCase()) || null;
            this.loading = false;
            if (this.landlord) {
              this.loadPropertyCount(this.landlord.id);
            }
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });

    this.loadNotifPrefs();
  }

  private loadPropertyCount(landlordId: number) {
    this.api.getPropertyDetails().subscribe({
      next: (props: PropertyDetails[]) => {
        this.propertyCount = props.filter(p => p.landlord?.id === landlordId).length;
      },
      error: () => {}
    });
  }

  private loadNotifPrefs() {
    const stored = localStorage.getItem('nancyimmo_notif_prefs');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        this.notifPrefs.forEach(p => { if (p.key in parsed) p.on = parsed[p.key]; });
      } catch { /* ignore */ }
    }
  }

  get initials(): string {
    if (!this.landlord) return '?';
    return (this.landlord.firstName?.[0] ?? '') + (this.landlord.lastName?.[0] ?? '');
  }

  save() {
    if (!this.landlord) return;
    this.saving = true;
    this.savedMessage = '';

    // Persiste les préférences de notification (côté navigateur).
    const prefs: Record<string, boolean> = {};
    this.notifPrefs.forEach(p => prefs[p.key] = p.on);
    localStorage.setItem('nancyimmo_notif_prefs', JSON.stringify(prefs));

    this.api.updateLandlord(this.landlord.id, this.landlord).subscribe({
      next: (updated) => {
        this.landlord = updated;
        this.saving = false;
        this.savedMessage = 'Modifications enregistrées ✓';
        this.toast.success('Profil mis à jour');
        setTimeout(() => this.savedMessage = '', 2500);
      },
      error: () => {
        this.saving = false;
        this.savedMessage = '';
        this.toast.error('Échec de l\'enregistrement');
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/connexion']);
  }

  deleteAccount() {
    this.deleting = true;
    this.api.deleteAccount().subscribe({
      next: () => {
        this.toast.success('Votre compte a été supprimé');
        this.auth.logout();
        this.router.navigate(['/connexion']);
      },
      error: () => {
        this.deleting = false;
        this.toast.error('La suppression du compte a échoué');
      }
    });
  }
}
