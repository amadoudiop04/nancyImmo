import { Routes } from '@angular/router';

import { AccueilComponent } from './pages/accueil/accueil.component';
import { BailleurLayoutComponent } from './pages/bailleur/bailleur-layout.component';
import { DashboardComponent } from './pages/bailleur/dashboard/dashboard.component';
import { BiensComponent } from './pages/bailleur/biens/biens.component';
import { BiensDetailComponent } from './pages/bailleur/bien-detail/bien-detail.component';
import { LocatairesComponent } from './pages/bailleur/locataires/locataires.component';
import { PaiementsComponent } from './pages/bailleur/paiements/paiements.component';
import { DocumentsComponent } from './pages/bailleur/documents/documents.component';
import { CandidaturesComponent } from './pages/bailleur/candidatures/candidatures.component';
import { LocataireComponent } from './pages/locataire/locataire.component';
import { RechercheComponent } from './pages/recherche/recherche.component';
import { ProfilComponent } from './pages/profil/profil.component';
import { ConnexionComponent } from './pages/auth/connexion.component';
import { InscriptionComponent } from './pages/auth/inscription.component';
import { ResetComponent } from './pages/auth/reset.component';
import { roleGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', component: AccueilComponent },
  { path: 'connexion', component: ConnexionComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'reset', component: ResetComponent },
  { path: 'recherche', component: RechercheComponent },
  {
    path: 'bailleur',
    component: BailleurLayoutComponent,
    canActivate: [roleGuard('BAILLEUR')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'biens', component: BiensComponent },
      { path: 'biens/:id', component: BiensDetailComponent },
      { path: 'locataires', component: LocatairesComponent },
      { path: 'candidatures', component: CandidaturesComponent },
      { path: 'paiements', component: PaiementsComponent },
      { path: 'documents', component: DocumentsComponent },
    ]
  },
  { path: 'locataire', component: LocataireComponent, canActivate: [roleGuard('LOCATAIRE')] },
  { path: 'profil', component: ProfilComponent, canActivate: [roleGuard('BAILLEUR')] },
  { path: '**', redirectTo: '' }
];
