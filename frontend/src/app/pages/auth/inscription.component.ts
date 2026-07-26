import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleSigninComponent } from '../../shared/google-signin.component';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [FormsModule, RouterLink, GoogleSigninComponent],
  template: `
    <div class="nm-auth-split" style="min-height:100vh;display:grid;grid-template-columns:1fr 1fr;">
      <!-- Left brand panel -->
      <div class="nm-auth-brand" style="background:#0E4F4A;color:#fff;padding:56px 64px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;">
        <a routerLink="/" style="display:flex;align-items:center;gap:11px;position:relative;z-index:2;text-decoration:none;color:#fff;">
          <div style="width:32px;height:32px;border-radius:9px;background:#2A9D8F;display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" fill="#fff"/></svg>
          </div>
          <span style="font-weight:800;font-size:19px;">Nancy<span style="color:#7FC9BD;">Immo</span></span>
        </a>
        <div style="position:relative;z-index:2;">
          <h2 style="font-size:38px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;margin:0;">La gestion locative,<br>enfin entre vos mains.</h2>
          <p style="font-size:16px;color:#BFE0D9;line-height:1.6;margin:18px 0 0;max-width:380px;">Biens, locataires, paiements et quittances réunis dans une seule interface. Sans agence, sans commission.</p>
          <div style="display:flex;gap:28px;margin-top:34px;">
            <div><div style="font-size:24px;font-weight:800;">15+</div><div style="font-size:13px;color:#7FC9BD;">biens gérés</div></div>
            <div><div style="font-size:24px;font-weight:800;">0%</div><div style="font-size:13px;color:#7FC9BD;">commission</div></div>
            <div><div style="font-size:24px;font-weight:800;">12 min</div><div style="font-size:13px;color:#7FC9BD;">pour démarrer</div></div>
          </div>
        </div>
        <div style="font-size:12.5px;color:#5E9991;position:relative;z-index:2;">© 2026 Nancy Immo</div>
        <div style="position:absolute;right:-120px;bottom:-120px;width:380px;height:380px;border-radius:50%;background:rgba(42,157,143,0.25);"></div>
        <div style="position:absolute;right:60px;top:-90px;width:220px;height:220px;border-radius:50%;background:rgba(42,157,143,0.16);"></div>
      </div>

      <!-- Right form panel -->
      <div style="background:#F4F6F3;display:flex;align-items:center;justify-content:center;padding:48px 32px;">
        <div style="width:100%;max-width:400px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Bienvenue</div>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">{{ form.role === 'LOCATAIRE' ? 'Créer un compte locataire' : 'Créer un compte bailleur' }}</h1>
          <p style="margin:8px 0 0;color:#5A655F;font-size:14.5px;">{{ form.role === 'LOCATAIRE' ? 'Accédez à votre logement, vos documents et vos paiements.' : 'Gérez vos biens sans agence, gratuitement.' }}</p>

          <!-- Type de compte -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;">
            <button type="button" (click)="form.role = 'BAILLEUR'"
              [style.border]="form.role === 'BAILLEUR' ? '2px solid #0E4F4A' : '1px solid #D6DED9'"
              [style.background]="form.role === 'BAILLEUR' ? '#E7F1EF' : '#fff'"
              style="padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;">
              <div style="font-weight:700;font-size:14px;color:#16201D;">Bailleur</div>
              <div style="font-size:11.5px;color:#5A655F;margin-top:2px;">Je gère mes biens</div>
            </button>
            <button type="button" (click)="form.role = 'LOCATAIRE'"
              [style.border]="form.role === 'LOCATAIRE' ? '2px solid #0E4F4A' : '1px solid #D6DED9'"
              [style.background]="form.role === 'LOCATAIRE' ? '#E7F1EF' : '#fff'"
              style="padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;">
              <div style="font-weight:700;font-size:14px;color:#16201D;">Locataire</div>
              <div style="font-size:11.5px;color:#5A655F;margin-top:2px;">J'accède à mon logement</div>
            </button>
          </div>

          <form (ngSubmit)="register()" style="margin-top:18px;">
            <div class="nm-form" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
              <div>
                <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Prénom</label>
                <input [(ngModel)]="form.firstName" name="firstName" placeholder="Nancy" required
                  style="width:100%;padding:12px 13px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14px;outline:none;background:#fff;">
              </div>
              <div>
                <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Nom</label>
                <input [(ngModel)]="form.lastName" name="lastName" placeholder="Aubert" required
                  style="width:100%;padding:12px 13px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14px;outline:none;background:#fff;">
              </div>
            </div>

            <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Email</label>
            <input [(ngModel)]="form.email" name="email" type="email" placeholder="vous@email.fr" required
              style="width:100%;padding:12px 13px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14px;outline:none;background:#fff;margin-bottom:14px;">

            <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Mot de passe</label>
            <input [(ngModel)]="form.password" name="password" type="password" placeholder="••••••••" required
              style="width:100%;padding:12px 13px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14px;outline:none;background:#fff;">

            <label style="display:flex;align-items:flex-start;gap:9px;margin-top:16px;font-size:12.5px;color:#5A655F;cursor:pointer;line-height:1.4;">
              <input [(ngModel)]="acceptCgu" name="acceptCgu" type="checkbox" style="width:16px;height:16px;accent-color:#0E4F4A;margin-top:1px;flex:none;">
              J'accepte les conditions générales et la politique de confidentialité.
            </label>

            @if (error) { <p style="color:#C2563B;font-size:13px;margin:14px 0 0;">{{ error }}</p> }

            <button type="submit" [disabled]="loading"
              style="margin-top:20px;width:100%;padding:14px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;">
              {{ loading ? 'Création…' : 'Créer mon compte' }}
            </button>
          </form>

          <div style="display:flex;align-items:center;gap:12px;margin:20px 0;">
            <div style="flex:1;height:1px;background:#E4E7E2;"></div>
            <span style="font-size:12px;color:#9AA49E;">ou</span>
            <div style="flex:1;height:1px;background:#E4E7E2;"></div>
          </div>
          <app-google-signin text="signup_with" (credential)="onGoogle($event)"></app-google-signin>
          @if (googleError) { <p style="color:#C2563B;font-size:13px;margin:12px 0 0;text-align:center;">{{ googleError }}</p> }

          <p style="text-align:center;margin:22px 0 0;font-size:13.5px;color:#5A655F;">
            Déjà inscrit ?
            <a routerLink="/connexion" style="color:#2A9D8F;font-weight:700;text-decoration:none;">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class InscriptionComponent {
  form = { firstName: '', lastName: '', email: '', password: '', role: 'BAILLEUR' as 'BAILLEUR' | 'LOCATAIRE' };
  acceptCgu = false;
  loading = false;
  error = '';
  googleError = '';

  constructor(private auth: AuthService, private router: Router) {}

  /** Inscription via Google : crée (ou récupère) le compte, puis redirige selon le rôle. */
  onGoogle(idToken: string) {
    this.googleError = '';
    this.auth.loginWithGoogle(idToken).subscribe({
      next: (user) => this.router.navigate([user.role === 'LOCATAIRE' ? '/locataire' : '/bailleur']),
      error: (err) => {
        this.googleError = err?.error?.message || 'La connexion Google a échoué. Réessayez.';
      }
    });
  }

  register() {
    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.password) {
      this.error = 'Veuillez remplir tous les champs.';
      return;
    }
    if (!this.acceptCgu) {
      this.error = 'Veuillez accepter les conditions générales.';
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.register({ ...this.form, email: this.form.email.trim().toLowerCase() }).subscribe({
      next: (user) => {
        this.loading = false;
        this.router.navigate([user.role === 'LOCATAIRE' ? '/locataire' : '/bailleur']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || "Erreur lors de la création du compte.";
      }
    });
  }
}
