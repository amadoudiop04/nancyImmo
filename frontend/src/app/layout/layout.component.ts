import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastComponent } from '../shared/toast.component';
import { CookieConsentComponent } from '../shared/cookie-consent.component';

@Component({
  selector: 'app-site-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ToastComponent, CookieConsentComponent],
  template: `
    <div style="min-height:100vh;background:#F4F6F3;font-family:'Hanken Grotesk',sans-serif;">

      @if (!isAuthRoute) {
        <!-- Global Top Bar -->
        <header class="nm-topbar" style="position:sticky;top:0;z-index:50;height:64px;background:rgba(255,255,255,0.92);
          backdrop-filter:blur(10px);border-bottom:1px solid #E4E7E2;display:flex;align-items:center;
          gap:28px;padding:0 28px;">

          <a routerLink="/" style="display:flex;align-items:center;gap:11px;text-decoration:none;color:inherit;">
            <div style="width:30px;height:30px;border-radius:9px;background:#0E4F4A;display:flex;align-items:center;justify-content:center;">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" fill="#2A9D8F"/>
              </svg>
            </div>
            <span style="font-weight:800;font-size:18px;letter-spacing:-0.02em;">Nancy<span style="color:#2A9D8F;">Immo</span></span>
          </a>

          <nav class="nm-topnav" style="display:flex;gap:6px;margin-left:8px;">
            <a routerLink="/" routerLinkActive="nav-active" [routerLinkActiveOptions]="{exact:true}"
              style="padding:7px 14px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;color:#5A655F;transition:all .15s;"
              class="nav-btn">Accueil</a>
            <a routerLink="/recherche" routerLinkActive="nav-active"
              style="padding:7px 14px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;color:#5A655F;transition:all .15s;"
              class="nav-btn">Rechercher un bien</a>
            <a routerLink="/bailleur" routerLinkActive="nav-active"
              style="padding:7px 14px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;color:#5A655F;transition:all .15s;"
              class="nav-btn">Espace bailleur</a>
            <a routerLink="/locataire" routerLinkActive="nav-active"
              style="padding:7px 14px;border-radius:8px;font-size:14px;font-weight:500;text-decoration:none;color:#5A655F;transition:all .15s;"
              class="nav-btn">Espace locataire</a>
          </nav>

          <div class="nm-topactions" style="margin-left:auto;display:flex;align-items:center;gap:12px;">
            @if (user(); as u) {
              <a [routerLink]="homeLink(u)" title="Mon espace" class="nm-hide-sm"
                style="padding:8px 14px;border-radius:9px;font-size:13.5px;font-weight:600;text-decoration:none;color:#0E4F4A;background:#E7F1EF;">Mon espace</a>
              @if (u.role !== 'LOCATAIRE') {
                <a routerLink="/profil" title="Mon profil"
                  style="width:36px;height:36px;border-radius:50%;background:#E7F1EF;color:#0E4F4A;
                    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;
                    cursor:pointer;text-decoration:none;">{{ initials(u) }}</a>
              } @else {
                <span title="Mon espace"
                  style="width:36px;height:36px;border-radius:50%;background:#E7F1EF;color:#0E4F4A;
                    display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">{{ initials(u) }}</span>
              }
              <button (click)="logout()" title="Se déconnecter"
                style="display:flex;align-items:center;gap:7px;padding:8px 14px;border:1px solid #E4C8C0;border-radius:9px;background:#fff;color:#C2563B;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M14 17l5-5-5-5M19 12H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Déconnexion
              </button>
            } @else {
              <a routerLink="/connexion"
                style="padding:8px 16px;border-radius:9px;font-size:14px;font-weight:600;text-decoration:none;color:#5A655F;">Connexion</a>
              <a routerLink="/inscription"
                style="padding:8px 16px;border-radius:9px;font-size:14px;font-weight:700;text-decoration:none;color:#fff;background:#0E4F4A;">Inscription</a>
            }
          </div>
        </header>
      }

      <main>
        <router-outlet />
      </main>

      <app-toast />
      <app-cookie-consent />
    </div>

    <style>
      .nav-btn:hover { background:#F4F6F3; color:#16201D; }
      .nav-active { background:#E7F1EF !important; color:#0E4F4A !important; font-weight:600 !important; }
    </style>
  `
})
export class SiteLayoutComponent {
  constructor(private router: Router, private auth: AuthService) {}

  get isAuthRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/connexion' || url === '/inscription' || url === '/reset';
  }

  user = this.auth.currentUser;

  initials(u: { firstName: string; lastName: string }): string {
    return (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '');
  }

  /** Lien "Mon espace" adapté au rôle du compte connecté. */
  homeLink(u: { role: string }): string {
    return u.role === 'LOCATAIRE' ? '/locataire' : '/bailleur/dashboard';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/connexion']);
  }
}
