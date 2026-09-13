import { Component, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleSigninComponent } from '../../shared/google-signin.component';

@Component({
  selector: 'app-connexion',
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
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Bon retour</div>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Connexion</h1>
          <p style="margin:8px 0 0;color:#5A655F;font-size:14.5px;">Accédez à votre espace Nancy Immo.</p>

          <form (ngSubmit)="login()" style="margin-top:26px;">
            <label for="login-email" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Email</label>
            <input id="login-email" [(ngModel)]="email" name="email" type="email" placeholder="vous@email.fr" required
              style="width:100%;padding:13px 14px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14.5px;outline:none;background:#fff;margin-bottom:16px;">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label for="login-password" style="font-size:12.5px;font-weight:600;color:#5A655F;">Mot de passe</label>
              <button type="button" (click)="openReset()" style="background:none;border:none;padding:0;font-family:inherit;font-size:12.5px;color:#2A9D8F;font-weight:600;cursor:pointer;">Oublié ?</button>
            </div>
            <div style="position:relative;">
              <input id="login-password" [(ngModel)]="password" name="password" [type]="showPassword ? 'text' : 'password'" placeholder="••••••••" required
                style="width:100%;padding:13px 44px 13px 14px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14.5px;outline:none;background:#fff;">
              <button type="button" (click)="showPassword = !showPassword"
                [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:transparent;border:none;cursor:pointer;padding:8px;display:flex;align-items:center;color:#9AA49E;">
                @if (showPassword) {
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.9 3.4M6.3 6.3C3.9 7.7 3 9.8 3 12c0 0 2.7 5 9 5 1.2 0 2.3-.2 3.2-.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                } @else {
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.7"/></svg>
                }
              </button>
            </div>

            <label style="display:flex;align-items:center;gap:9px;margin-top:16px;font-size:13.5px;color:#5A655F;cursor:pointer;">
              <input [(ngModel)]="rememberMe" name="rememberMe" type="checkbox" style="width:16px;height:16px;accent-color:#0E4F4A;"> Rester connecté
            </label>

            @if (error) { <p style="color:#C2563B;font-size:13px;margin:14px 0 0;">{{ error }}</p> }

            <button type="submit" [disabled]="loading"
              style="margin-top:22px;width:100%;padding:14px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;">
              {{ loading ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>

          <div style="display:flex;align-items:center;gap:12px;margin:22px 0;">
            <div style="flex:1;height:1px;background:#E4E7E2;"></div>
            <span style="font-size:12px;color:#9AA49E;">ou</span>
            <div style="flex:1;height:1px;background:#E4E7E2;"></div>
          </div>
          <app-google-signin text="continue_with" (credential)="onGoogle($event)"></app-google-signin>
          @if (googleError) { <p style="color:#C2563B;font-size:13px;margin:12px 0 0;text-align:center;">{{ googleError }}</p> }

          <p style="text-align:center;margin:24px 0 0;font-size:13.5px;color:#5A655F;">
            Pas encore de compte ?
            <a routerLink="/inscription" style="color:#2A9D8F;font-weight:700;text-decoration:none;">Créer un compte</a>
          </p>
        </div>
      </div>

      <!-- Modale : mot de passe oublié -->
      @if (showReset) {
        <div (click)="onResetBackdropClick($event)" role="presentation"
          style="position:fixed;inset:0;background:rgba(14,40,37,0.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;">
          <div role="dialog" aria-modal="true"
            style="background:#fff;border-radius:18px;width:100%;max-width:420px;padding:30px 30px 26px;box-shadow:0 24px 60px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Réinitialisation</div>
                <h2 style="margin:6px 0 0;font-size:21px;font-weight:800;letter-spacing:-0.02em;">Mot de passe oublié</h2>
              </div>
              <button type="button" (click)="closeReset()" aria-label="Fermer"
                style="background:transparent;border:none;cursor:pointer;color:#9AA49E;font-size:22px;line-height:1;padding:2px 4px;">×</button>
            </div>

            @if (!resetSent) {
              <p style="margin:12px 0 0;color:#5A655F;font-size:14px;line-height:1.5;">Entrez l'email de votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
              <form (ngSubmit)="requestReset()" style="margin-top:18px;">
                <label for="reset-email" style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Email</label>
                <input id="reset-email" [(ngModel)]="resetEmail" name="resetEmail" type="email" placeholder="vous@email.fr" required
                  style="width:100%;padding:13px 14px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14.5px;outline:none;background:#fff;">
                @if (resetError) { <p style="color:#C2563B;font-size:13px;margin:14px 0 0;">{{ resetError }}</p> }
                <button type="submit" [disabled]="resetLoading"
                  style="margin-top:18px;width:100%;padding:13px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;">
                  {{ resetLoading ? 'Envoi…' : 'Envoyer le lien' }}
                </button>
              </form>
            } @else {
              <div style="margin-top:18px;text-align:center;">
                <div style="width:52px;height:52px;border-radius:50%;background:#E7F1EF;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 6h16v12H4z" stroke="#0E4F4A" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 7l8 6 8-6" stroke="#0E4F4A" stroke-width="1.8" stroke-linejoin="round"/></svg>
                </div>
                <p style="margin:0;color:#16201D;font-size:15px;font-weight:700;">Vérifiez votre boîte mail</p>
                <p style="margin:8px 0 0;color:#5A655F;font-size:13.5px;line-height:1.55;">{{ resetMsg }}</p>
                <button type="button" (click)="closeReset()"
                  style="margin-top:20px;width:100%;padding:13px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;">
                  J'ai compris
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modale : type de compte à créer (1re connexion Google, email inconnu) -->
      @if (showRoleChoice) {
        <div (click)="onRoleChoiceBackdropClick($event)" role="presentation"
          style="position:fixed;inset:0;background:rgba(14,40,37,0.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;">
          <div role="dialog" aria-modal="true"
            style="background:#fff;border-radius:18px;width:100%;max-width:440px;padding:30px 30px 26px;box-shadow:0 24px 60px rgba(0,0,0,0.25);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Nouveau compte</div>
                <h2 style="margin:6px 0 0;font-size:21px;font-weight:800;letter-spacing:-0.02em;">
                  {{ googleFirstName ? 'Bienvenue ' + googleFirstName + ' !' : 'Bienvenue !' }}
                </h2>
              </div>
              <button type="button" (click)="cancelRoleChoice()" aria-label="Fermer"
                style="background:transparent;border:none;cursor:pointer;color:#9AA49E;font-size:22px;line-height:1;padding:2px 4px;">×</button>
            </div>

            <p style="margin:12px 0 0;color:#5A655F;font-size:14px;line-height:1.5;">
              Aucun compte n'existe pour <strong style="color:#16201D;">{{ googleEmail }}</strong>.
              Choisissez le type de compte à créer.
            </p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;">
              <button type="button" (click)="googleRole = 'BAILLEUR'"
                [style.border]="googleRole === 'BAILLEUR' ? '2px solid #0E4F4A' : '1px solid #D6DED9'"
                [style.background]="googleRole === 'BAILLEUR' ? '#E7F1EF' : '#fff'"
                style="padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;">
                <div style="font-weight:700;font-size:14px;color:#16201D;">Bailleur</div>
                <div style="font-size:11.5px;color:#5A655F;margin-top:2px;">Je gère mes biens</div>
              </button>
              <button type="button" (click)="googleRole = 'LOCATAIRE'"
                [style.border]="googleRole === 'LOCATAIRE' ? '2px solid #0E4F4A' : '1px solid #D6DED9'"
                [style.background]="googleRole === 'LOCATAIRE' ? '#E7F1EF' : '#fff'"
                style="padding:12px;border-radius:12px;cursor:pointer;text-align:left;font-family:inherit;">
                <div style="font-weight:700;font-size:14px;color:#16201D;">Locataire</div>
                <div style="font-size:11.5px;color:#5A655F;margin-top:2px;">J'accède à mon logement</div>
              </button>
            </div>

            @if (roleError) { <p style="color:#C2563B;font-size:13px;margin:14px 0 0;">{{ roleError }}</p> }

            <button type="button" (click)="confirmRoleChoice()" [disabled]="googleLoading"
              style="margin-top:20px;width:100%;padding:13px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:14.5px;cursor:pointer;">
              {{ googleLoading ? 'Création…' : 'Créer mon compte' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class ConnexionComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPassword = false;
  rememberMe = true;
  loading = false;
  error = '';
  googleError = '';

  // Choix du type de compte à la 1re connexion Google (email inconnu du serveur)
  showRoleChoice = false;
  googleIdToken = '';
  googleEmail = '';
  googleFirstName = '';
  googleRole: 'BAILLEUR' | 'LOCATAIRE' = 'BAILLEUR';
  googleLoading = false;
  roleError = '';

  // Flux « mot de passe oublié » (envoi d'un email)
  showReset = false;
  resetSent = false;
  resetEmail = '';
  resetMsg = '';
  resetError = '';
  resetLoading = false;

  openReset() {
    this.showReset = true;
    this.resetSent = false;
    this.resetEmail = this.email;
    this.resetMsg = '';
    this.resetError = '';
  }

  closeReset() {
    this.showReset = false;
  }

  /** Ferme la modale au clic sur le fond, sans intercepter les clics du panneau. */
  onResetBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.closeReset();
  }

  onRoleChoiceBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) this.cancelRoleChoice();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showReset) this.closeReset();
    else if (this.showRoleChoice) this.cancelRoleChoice();
  }

  requestReset() {
    if (!this.resetEmail) {
      this.resetError = 'Veuillez renseigner votre email.';
      return;
    }
    this.resetLoading = true;
    this.resetError = '';
    this.auth.forgotPassword(this.resetEmail.trim().toLowerCase()).subscribe({
      next: (res) => {
        this.resetLoading = false;
        this.resetSent = true;
        this.resetMsg = res.message
          || "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.";
      },
      error: () => {
        this.resetLoading = false;
        this.resetError = "Une erreur est survenue. Veuillez réessayer.";
      }
    });
  }

  /**
   * Connexion via Google : échange l'ID token contre un JWT, puis redirige selon le rôle.
   * Si l'email n'a aucun compte, le serveur répond `requiresRole` → on demande le type de compte.
   */
  onGoogle(idToken: string) {
    this.googleError = '';
    this.googleIdToken = idToken;
    this.googleSignIn();
  }

  /** Valide le type de compte choisi et rejoue la connexion Google avec ce rôle. */
  confirmRoleChoice() {
    this.roleError = '';
    this.googleSignIn(this.googleRole);
  }

  cancelRoleChoice() {
    this.showRoleChoice = false;
    this.googleIdToken = '';
    this.roleError = '';
  }

  /** Appelle /auth/google (avec le rôle si l'utilisateur vient de le choisir) puis redirige. */
  private googleSignIn(role?: 'BAILLEUR' | 'LOCATAIRE') {
    this.googleLoading = true;
    this.auth.loginWithGoogle(this.googleIdToken, role).subscribe({
      next: (user) => {
        this.googleLoading = false;
        this.showRoleChoice = false;
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        if (redirect) {
          this.router.navigateByUrl(redirect);
        } else {
          this.router.navigate([user.role === 'LOCATAIRE' ? '/locataire' : '/bailleur']);
        }
      },
      error: (err) => {
        this.googleLoading = false;
        const message = err?.error?.message || 'La connexion Google a échoué. Réessayez.';
        if (err?.status === 409 && err?.error?.requiresRole) {
          // Email inconnu : on fait choisir le type de compte avant de le créer.
          this.googleEmail = err.error.email || '';
          this.googleFirstName = err.error.firstName || '';
          this.showRoleChoice = true;
          return;
        }
        if (this.showRoleChoice) {
          this.roleError = message;
        } else {
          this.googleError = message;
        }
      }
    });
  }

  login() {
    if (!this.email || !this.password) {
      this.error = 'Veuillez renseigner votre email et votre mot de passe.';
      return;
    }
    this.loading = true;
    this.error = '';

    this.auth.login(this.email.trim().toLowerCase(), this.password).subscribe({
      next: (user) => {
        this.loading = false;
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        if (redirect) {
          this.router.navigateByUrl(redirect);
        } else {
          this.router.navigate([user.role === 'LOCATAIRE' ? '/locataire' : '/bailleur']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Email ou mot de passe incorrect.';
      }
    });
  }
}
