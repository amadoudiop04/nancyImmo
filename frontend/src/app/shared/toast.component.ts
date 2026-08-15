import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div style="position:fixed;top:78px;right:22px;z-index:1000;display:flex;flex-direction:column;gap:10px;pointer-events:none;">
      @for (t of toast.toasts(); track t.id) {
        <button type="button" (click)="toast.dismiss(t.id)" aria-label="Fermer la notification"
          [style.border-left]="'4px solid ' + accent(t.type)"
          style="pointer-events:auto;cursor:pointer;min-width:240px;max-width:340px;background:#fff;font-family:inherit;text-align:left;
            border:1px solid #E4E7E2;border-radius:12px;padding:13px 16px;display:flex;align-items:center;gap:11px;
            box-shadow:0 12px 30px rgba(14,79,74,0.16);animation:nm-toast .28s cubic-bezier(.2,.8,.2,1);">
          <div [style.background]="bg(t.type)" [style.color]="accent(t.type)"
            style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none;">
            {{ icon(t.type) }}
          </div>
          <span style="font-size:13.5px;font-weight:600;color:#16201D;line-height:1.35;">{{ t.message }}</span>
        </button>
      }
    </div>

    <style>
      @keyframes nm-toast {
        from { opacity:0; transform: translateX(24px) scale(0.96); }
        to   { opacity:1; transform: none; }
      }
    </style>
  `
})
export class ToastComponent {
  toast = inject(ToastService);

  accent(type: string): string {
    return type === 'error' ? '#C2563B' : type === 'info' ? '#2A9D8F' : '#0E4F4A';
  }
  bg(type: string): string {
    return type === 'error' ? '#FBE7DF' : type === 'info' ? '#E7F1EF' : '#D1FAE5';
  }
  icon(type: string): string {
    return type === 'error' ? '!' : '✓';
  }
}
