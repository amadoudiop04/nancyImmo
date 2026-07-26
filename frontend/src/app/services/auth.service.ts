import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

export interface AuthUser {
  token?: string;
  email: string;
  role: 'BAILLEUR' | 'LOCATAIRE' | string;
  firstName: string;
  lastName: string;
}

const TOKEN_KEY = 'nancyimmo_token';
const USER_KEY = 'nancyimmo_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = '/api/auth';

  // Signal réactif de l'utilisateur courant.
  readonly currentUser = signal<AuthUser | null>(this.readStoredUser());

  // Cache de la configuration publique (Client ID Google).
  private config$?: Observable<{ googleClientId: string }>;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.api}/login`, { email, password }).pipe(
      tap(res => this.persist(res))
    );
  }

  register(payload: {
    firstName: string; lastName: string; email: string; password: string; role: string;
  }): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.api}/register`, payload).pipe(
      tap(res => this.persist(res))
    );
  }

  /** Connexion / inscription via Google (ID token vérifié côté serveur). Persiste le JWT. */
  loginWithGoogle(idToken: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.api}/google`, { idToken }).pipe(
      tap(res => this.persist(res))
    );
  }

  /** Configuration publique (Client ID Google). Mise en cache après le 1er appel. */
  getAuthConfig(): Observable<{ googleClientId: string }> {
    if (!this.config$) {
      this.config$ = this.http.get<{ googleClientId: string }>(`${this.api}/config`).pipe(
        shareReplay(1)
      );
    }
    return this.config$;
  }

  /** Demande l'envoi d'un email de réinitialisation. Message générique (pas de fuite d'info). */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/forgot-password`, { email });
  }

  /** Réinitialise le mot de passe via le jeton, puis connecte l'utilisateur (persiste le JWT). */
  resetPassword(token: string, newPassword: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.api}/reset-password`, { token, newPassword }).pipe(
      tap(res => this.persist(res))
    );
  }

  /** Rafraîchit les infos du compte connecté depuis le serveur (token sécurisé). */
  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.api}/me`).pipe(
      tap(user => {
        const token = this.getToken();
        const merged = { ...user, token: token ?? undefined };
        localStorage.setItem(USER_KEY, JSON.stringify(merged));
        this.currentUser.set(merged);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get user(): AuthUser | null {
    return this.currentUser();
  }

  private persist(res: AuthUser): void {
    if (res.token) localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res));
    this.currentUser.set(res);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as AuthUser; } catch { return null; }
  }
}
