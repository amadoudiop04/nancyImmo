import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Page de réinitialisation atteinte via le lien reçu par email : /reset?token=...
 * L'utilisateur choisit un nouveau mot de passe, puis est connecté automatiquement.
 */
@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
          <h2 style="font-size:38px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;margin:0;">Un nouveau départ,<br>en toute sécurité.</h2>
          <p style="font-size:16px;color:#BFE0D9;line-height:1.6;margin:18px 0 0;max-width:380px;">Choisissez un nouveau mot de passe pour retrouver l'accès à votre espace Nancy Immo.</p>
        </div>
        <div style="font-size:12.5px;color:#5E9991;position:relative;z-index:2;">© 2026 Nancy Immo</div>
        <div style="position:absolute;right:-120px;bottom:-120px;width:380px;height:380px;border-radius:50%;background:rgba(42,157,143,0.25);"></div>
        <div style="position:absolute;right:60px;top:-90px;width:220px;height:220px;border-radius:50%;background:rgba(42,157,143,0.16);"></div>
      </div>

      <!-- Right form panel -->
      <div style="background:#F4F6F3;display:flex;align-items:center;justify-content:center;padding:48px 32px;">
        <div style="width:100%;max-width:400px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Réinitialisation</div>
          <h1 style="margin:8px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Nouveau mot de passe</h1>

          @if (!token) {
            <p style="margin:14px 0 0;color:#C2563B;font-size:14.5px;line-height:1.5;">Lien invalide : aucun jeton de réinitialisation trouvé. Refaites une demande depuis la page de connexion.</p>
            <a routerLink="/connexion"
              style="margin-top:22px;display:block;text-align:center;padding:13px;border-radius:12px;background:#0E4F4A;color:#fff;font-weight:700;font-size:14.5px;text-decoration:none;">
              Retour à la connexion
            </a>
          } @else {
            <p style="margin:8px 0 0;color:#5A655F;font-size:14.5px;">Choisissez un nouveau mot de passe (6 caractères minimum).</p>

            <form (ngSubmit)="submit()" style="margin-top:24px;">
              <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Nouveau mot de passe</label>
              <div style="position:relative;margin-bottom:16px;">
                <input [(ngModel)]="newPassword" name="newPassword" [type]="show ? 'text' : 'password'" placeholder="••••••••" required
                  style="width:100%;padding:13px 44px 13px 14px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14.5px;outline:none;background:#fff;">
                <button type="button" (click)="show = !show"
                  [attr.aria-label]="show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                  style="position:absolute;right:6px;top:50%;transform:translateY(-50%);background:transparent;border:none;cursor:pointer;padding:8px;display:flex;align-items:center;color:#9AA49E;">
                  @if (show) {
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 9 7 0 .9-.7 2.2-1.9 3.4M6.3 6.3C3.9 7.7 3 9.8 3 12c0 0 2.7 5 9 5 1.2 0 2.3-.2 3.2-.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                  } @else {
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.7"/></svg>
                  }
                </button>
              </div>

              <label style="font-size:12.5px;font-weight:600;color:#5A655F;margin-bottom:6px;display:block;">Confirmer le mot de passe</label>
              <input [(ngModel)]="confirm" name="confirm" [type]="show ? 'text' : 'password'" placeholder="••••••••" required
                style="width:100%;padding:13px 14px;border:1px solid #D6DED9;border-radius:11px;font-family:inherit;font-size:14.5px;outline:none;background:#fff;">

              @if (error) { <p style="color:#C2563B;font-size:13px;margin:14px 0 0;">{{ error }}</p> }

              <button type="submit" [disabled]="loading"
                style="margin-top:22px;width:100%;padding:14px;border:none;border-radius:12px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:700;font-size:15px;cursor:pointer;">
                {{ loading ? 'Enregistrement…' : 'Réinitialiser et se connecter' }}
              </button>
            </form>

            <p style="text-align:center;margin:22px 0 0;font-size:13.5px;color:#5A655F;">
              <a routerLink="/connexion" style="color:#2A9D8F;font-weight:700;text-decoration:none;">Retour à la connexion</a>
            </p>
          }
        </div>
      </div>
    </div>
  `
})
export class ResetComponent implements OnInit {
  token = '';
  newPassword = '';
  confirm = '';
  show = false;
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  submit() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.error = 'Mot de passe trop court (6 caractères minimum).';
      return;
    }
    if (this.newPassword !== this.confirm) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: (user) => {
        this.loading = false;
        this.router.navigate([user.role === 'LOCATAIRE' ? '/locataire' : '/bailleur']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Lien invalide ou expiré. Refaites une demande.';
      }
    });
  }
}
