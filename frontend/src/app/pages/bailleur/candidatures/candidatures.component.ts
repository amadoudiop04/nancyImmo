import { Component, OnInit, inject } from '@angular/core';
import { ApiService, Application } from '../../../services/api.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-candidatures',
  standalone: true,
  imports: [],
  template: `
    <div>
      <div style="margin-bottom:24px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9AA49E;">Recrutement locataires</div>
        <h1 style="margin:6px 0 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;">Candidatures</h1>
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;">
        @for (t of tabs; track t.value) {
          <button (click)="activeTab=t.value"
            [style.background]="activeTab===t.value ? '#0E4F4A' : '#fff'"
            [style.color]="activeTab===t.value ? '#fff' : '#5A655F'"
            [style.border]="activeTab===t.value ? '1px solid #0E4F4A' : '1px solid #E4E7E2'"
            style="padding:8px 15px;border-radius:999px;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;">
            {{ t.label }} <span style="opacity:0.7;">· {{ countFor(t.value) }}</span>
          </button>
        }
      </div>

      @if (loading) {
        <div style="text-align:center;padding:48px;color:#9AA49E;">Chargement…</div>
      } @else if (visible.length === 0) {
        <div style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:48px;text-align:center;color:#9AA49E;">
          Aucune candidature dans cette catégorie.
        </div>
      } @else {
        <div style="display:flex;flex-direction:column;gap:14px;">
          @for (a of visible; track a.id) {
            <div class="nm-card"
              [style.opacity]="removingId === a.id ? '0' : '1'"
              [style.transform]="removingId === a.id ? 'translateX(22px)' : 'none'"
              style="background:#fff;border:1px solid #E4E7E2;border-radius:16px;padding:20px 22px;display:flex;gap:18px;align-items:flex-start;transition:opacity .28s ease,transform .28s ease,box-shadow .18s ease;">

              <div [style.background]="colorFor(a.id)"
                style="width:46px;height:46px;border-radius:13px;flex:none;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">
                {{ initials(a) }}
              </div>

              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <span style="font-weight:700;font-size:15px;">{{ a.firstName }} {{ a.lastName }}</span>
                  <span [style.background]="badgeBg(a.status)" [style.color]="badgeFg(a.status)"
                    style="padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:700;">{{ statusLabel(a.status) }}</span>
                </div>
                <div style="font-size:13px;color:#5A655F;margin-top:4px;">
                  Candidate pour <strong>{{ a.propertyName ?? 'un bien' }}</strong> · {{ a.createdAt }}
                </div>
                <div style="display:flex;gap:16px;margin-top:8px;font-size:12.5px;color:#8A938E;flex-wrap:wrap;">
                  <span>✉ {{ a.email }}</span>
                  @if (a.phone) { <span>☎ {{ a.phone }}</span> }
                </div>
                @if (a.message) {
                  <div style="margin-top:10px;background:#F7F9F6;border-radius:10px;padding:11px 13px;font-size:13px;color:#5A655F;line-height:1.5;">{{ a.message }}</div>
                }
              </div>

              <div style="display:flex;flex-direction:column;gap:8px;flex:none;">
                @if (a.status === 'PENDING') {
                  <button (click)="setStatus(a, 'ACCEPTED')" class="nm-accept"
                    style="padding:8px 16px;border:none;border-radius:9px;background:#0E4F4A;color:#fff;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;">Accepter</button>
                  <button (click)="setStatus(a, 'REJECTED')" class="nm-reject"
                    style="padding:8px 16px;border:1px solid #E4C8C0;border-radius:9px;background:#fff;color:#C2563B;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;transition:all .15s;">Refuser</button>
                } @else {
                  <button (click)="setStatus(a, 'PENDING')"
                    style="padding:8px 16px;border:1px solid #D6DED9;border-radius:9px;background:#fff;color:#5A655F;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;">Réétudier</button>
                  <button (click)="remove(a)"
                    style="padding:8px 16px;border:none;border-radius:9px;background:transparent;color:#9AA49E;font-family:inherit;font-weight:600;font-size:12px;cursor:pointer;">Supprimer</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <style>
      .nm-card:hover { box-shadow:0 14px 30px rgba(14,79,74,0.10); }
      .nm-accept:hover { filter:brightness(1.12); }
      .nm-reject:hover { background:#FBE7DF; }
    </style>
  `
})
export class CandidaturesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  applications: Application[] = [];
  loading = true;
  activeTab = 'ALL';
  removingId: number | null = null;

  tabs = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'ACCEPTED', label: 'Acceptées' },
    { value: 'REJECTED', label: 'Refusées' },
  ];

  private colors = ['#0E4F4A', '#2A9D8F', '#264653', '#E76F51', '#E9C46A'];

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getApplications().subscribe({
      next: a => { this.applications = a; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get visible(): Application[] {
    if (this.activeTab === 'ALL') return this.applications;
    return this.applications.filter(a => a.status === this.activeTab);
  }

  countFor(tab: string): number {
    if (tab === 'ALL') return this.applications.length;
    return this.applications.filter(a => a.status === tab).length;
  }

  setStatus(a: Application, status: string) {
    this.api.updateApplicationStatus(a.id, status).subscribe({
      next: (updated) => {
        a.status = updated.status;
        this.toast.success(status === 'ACCEPTED' ? 'Candidature acceptée' : status === 'REJECTED' ? 'Candidature refusée' : 'Candidature remise en attente');
      },
      error: () => this.toast.error('Action impossible')
    });
  }

  remove(a: Application) {
    this.removingId = a.id;
    this.api.deleteApplication(a.id).subscribe({
      next: () => { this.toast.success('Candidature supprimée'); setTimeout(() => { this.removingId = null; this.load(); }, 280); },
      error: () => { this.removingId = null; this.toast.error('Suppression impossible'); }
    });
  }

  initials(a: Application): string {
    return (a.firstName?.[0] ?? '') + (a.lastName?.[0] ?? '');
  }
  colorFor(id: number): string { return this.colors[id % this.colors.length]; }
  statusLabel(s: string): string { return s === 'ACCEPTED' ? 'Acceptée' : s === 'REJECTED' ? 'Refusée' : 'En attente'; }
  badgeBg(s: string): string { return s === 'ACCEPTED' ? '#D1FAE5' : s === 'REJECTED' ? '#FBE7DF' : '#FBF1D9'; }
  badgeFg(s: string): string { return s === 'ACCEPTED' ? '#065F46' : s === 'REJECTED' ? '#C2563B' : '#8A6A18'; }
}
