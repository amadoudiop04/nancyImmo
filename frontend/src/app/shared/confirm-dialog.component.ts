import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

/**
 * Boîte de confirmation de l'application, en remplacement de `confirm()` natif.
 *
 * Le `confirm()` du navigateur affiche une barre grise en haut de la fenêtre :
 * elle ignore la charte graphique et bloque le rendu (aucune animation ne peut
 * se jouer tant qu'elle est ouverte). Ce composant fait la même chose en HTML,
 * sans bloquer la page.
 *
 * Le composant reste monté pendant l'animation de sortie : `open` déclenche
 * l'entrée, et la fermeture attend la fin de `nm-cd-out` avant de démonter.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (rendered) {
      <div class="nm-cd" [class.nm-cd-leaving]="leaving">
        <!-- Fond cliquable : un <button> plutôt qu'un <div> pour rester accessible au clavier. -->
        <button type="button" class="nm-cd-backdrop" (click)="onCancel()" [attr.aria-label]="cancelLabel"></button>

        <div class="nm-cd-panel" role="dialog" aria-modal="true"
          [attr.aria-labelledby]="titleId" [attr.aria-describedby]="message ? messageId : null">

          <div class="nm-cd-icon" [class.nm-cd-icon-danger]="tone === 'danger'">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              @if (tone === 'danger') {
                <path d="M4 7h16" />
                <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
                <path d="M6.4 7l.8 12a1.6 1.6 0 0 0 1.6 1.5h6.4a1.6 1.6 0 0 0 1.6-1.5l.8-12" />
                <path d="M10.3 11v6M13.7 11v6" />
              } @else {
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 8.2v4.4M12 15.6v.2" />
              }
            </svg>
          </div>

          <h2 class="nm-cd-title" [id]="titleId">{{ title }}</h2>
          @if (message) { <p class="nm-cd-message" [id]="messageId">{{ message }}</p> }

          <div class="nm-cd-actions">
            <button type="button" class="nm-cd-btn nm-cd-btn-ghost" (click)="onCancel()" [disabled]="busy">
              {{ cancelLabel }}
            </button>
            <button type="button" #confirmBtn class="nm-cd-btn"
              [class.nm-cd-btn-danger]="tone === 'danger'" (click)="onConfirm()" [disabled]="busy">
              {{ busy ? busyLabel : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }

    <style>
      .nm-cd { position:fixed; inset:0; z-index:1200; padding:20px;
        display:flex; align-items:center; justify-content:center; }
      .nm-cd-backdrop { position:absolute; inset:0; border:0; padding:0; cursor:pointer;
        background:rgba(16,32,29,.44); backdrop-filter:blur(2px); animation:nm-cd-fade .22s ease both; }
      .nm-cd-panel { position:relative; width:100%; max-width:400px; padding:26px; text-align:center;
        background:#fff; border:1px solid #E4E7E2; border-radius:18px; box-shadow:0 26px 60px rgba(14,79,74,.24);
        animation:nm-cd-in .3s cubic-bezier(.2,.9,.25,1.06) both; }
      .nm-cd-leaving .nm-cd-backdrop { animation:nm-cd-fade .17s ease reverse both; }
      .nm-cd-leaving .nm-cd-panel { animation:nm-cd-out .17s cubic-bezier(.4,0,.8,.4) both; }
      .nm-cd-icon { width:46px; height:46px; margin:0 auto 14px; border-radius:50%;
        display:flex; align-items:center; justify-content:center; background:#E7F1EF; color:#0E4F4A; }
      .nm-cd-icon-danger { background:#FBE7DF; color:#C2563B; }
      .nm-cd-title { margin:0; font-size:17px; font-weight:700; color:#16201D; letter-spacing:-0.01em; }
      .nm-cd-message { margin:8px 0 0; font-size:13.5px; line-height:1.55; color:#8A938E; }
      .nm-cd-actions { display:flex; gap:10px; margin-top:22px; }
      .nm-cd-btn { flex:1; padding:11px 18px; border:1px solid transparent; border-radius:11px;
        background:#0E4F4A; color:#fff; font-family:inherit; font-weight:600; font-size:14px; cursor:pointer;
        transition:background .15s ease; }
      .nm-cd-btn:disabled { opacity:.6; cursor:default; }
      .nm-cd-btn:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(14,79,74,.22); }
      .nm-cd-btn-ghost { background:#fff; border-color:#D6DED9; color:#16201D; }
      .nm-cd-btn-ghost:hover { background:#F1F4F0; }
      .nm-cd-btn-danger { background:#C2563B; }
      .nm-cd-btn-danger:hover { background:#A8462E; }
      @keyframes nm-cd-fade { from { opacity:0; } to { opacity:1; } }
      @keyframes nm-cd-in { from { opacity:0; transform:translateY(14px) scale(.94); } to { opacity:1; transform:none; } }
      @keyframes nm-cd-out { from { opacity:1; transform:none; } to { opacity:0; transform:translateY(6px) scale(.97); } }
      @media (prefers-reduced-motion:reduce) { .nm-cd * { animation-duration:.01ms; } }
    </style>
  `
})
export class ConfirmDialogComponent {
  /** Titre de la boîte (question principale). */
  @Input() title = 'Confirmer';
  /** Texte explicatif sous le titre. Optionnel. */
  @Input() message = '';
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';
  /** Libellé du bouton de confirmation pendant le traitement. */
  @Input() busyLabel = 'Suppression…';
  /** Habillage : `danger` pour une action destructrice. */
  @Input() tone: 'danger' | 'primary' = 'danger';
  /** Verrouille les deux boutons pendant l'appel réseau. */
  @Input() busy = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('confirmBtn') confirmBtn?: ElementRef<HTMLButtonElement>;

  /** Rendu effectif : reste vrai pendant l'animation de sortie. */
  rendered = false;
  /** Vrai le temps de l'animation de fermeture. */
  leaving = false;

  /** Doit rester aligné sur la durée des keyframes `nm-cd-out`. */
  private static readonly EXIT_MS = 170;
  private static seq = 0;

  private readonly uid = `nm-cd-${++ConfirmDialogComponent.seq}`;
  readonly titleId = `${this.uid}-title`;
  readonly messageId = `${this.uid}-message`;

  @Input() set open(value: boolean) {
    if (value) {
      this.leaving = false;
      this.rendered = true;
      // Le bouton de confirmation prend le focus : Entrée valide, Échap annule.
      setTimeout(() => this.confirmBtn?.nativeElement.focus(), 0);
      return;
    }
    if (!this.rendered || this.leaving) return;
    this.leaving = true;
    setTimeout(() => {
      this.rendered = false;
      this.leaving = false;
    }, ConfirmDialogComponent.EXIT_MS);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.rendered && !this.leaving) this.onCancel();
  }

  onConfirm() {
    if (!this.busy) this.confirmed.emit();
  }

  onCancel() {
    if (!this.busy) this.cancelled.emit();
  }
}
