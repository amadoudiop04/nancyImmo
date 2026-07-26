import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Fourni par le script Google Identity Services chargé dans index.html.
declare const google: any;

/**
 * Bouton « Continuer avec Google ».
 *
 * Récupère le Client ID depuis l'API (`/api/auth/config`), initialise Google Identity Services
 * et rend le bouton officiel. À la sélection d'un compte, émet l'ID token via `(credential)`.
 * Si aucun Client ID n'est configuré côté serveur, le composant reste vide (bouton masqué).
 */
@Component({
  selector: 'app-google-signin',
  standalone: true,
  template: `<div #btn style="display:flex;justify-content:center;min-height:0;"></div>`,
})
export class GoogleSigninComponent implements AfterViewInit {
  /** Libellé du bouton Google. */
  @Input() text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';
  /** Émet l'ID token Google à la connexion. */
  @Output() credential = new EventEmitter<string>();

  @ViewChild('btn', { static: true }) btn!: ElementRef<HTMLDivElement>;

  constructor(private auth: AuthService) {}

  ngAfterViewInit(): void {
    this.auth.getAuthConfig().subscribe({
      next: (cfg) => {
        const clientId = cfg?.googleClientId?.trim();
        if (!clientId) return; // Google non configuré → rien à afficher.
        this.waitForGoogle().then((ready) => {
          if (ready) this.render(clientId);
        });
      },
      error: () => {},
    });
  }

  /** Attend que le script GSI soit chargé (jusqu'à 8s), sinon abandonne silencieusement. */
  private waitForGoogle(): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        if (typeof google !== 'undefined' && google?.accounts?.id) return resolve(true);
        if (Date.now() - start > 8000) return resolve(false);
        setTimeout(tick, 120);
      };
      tick();
    });
  }

  private render(clientId: string): void {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (resp: { credential: string }) => this.credential.emit(resp.credential),
    });
    google.accounts.id.renderButton(this.btn.nativeElement, {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: this.text,
      shape: 'pill',
      logo_alignment: 'center',
      width: 336,
    });
  }
}
