# Nancy Immo — Plateforme de gestion locative

Application web **full-stack** de gestion locative pour bailleurs et locataires : suivi des biens,
des baux, des paiements (avec **Stripe**), génération de documents **PDF** (baux, quittances),
candidatures en ligne et espaces cloisonnés par rôle.

<p>
  <img alt="Spring Boot" src="https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?logo=springboot&logoColor=white">
  <img alt="Java" src="https://img.shields.io/badge/Java-21-007396?logo=openjdk&logoColor=white">
  <img alt="Angular" src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white">
  <img alt="Stripe" src="https://img.shields.io/badge/Stripe-Checkout-635BFF?logo=stripe&logoColor=white">
</p>

---

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Pile technique](#pile-technique)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Prérequis](#prérequis)
- [Démarrage rapide (local)](#démarrage-rapide-local)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Configuration](#configuration)
- [API REST](#api-rest)
- [Sécurité](#sécurité)
- [Déploiement](#déploiement)
- [Structure du dépôt](#structure-du-dépôt)
- [Documentation complémentaire](#documentation-complémentaire)

---

## Aperçu

Nancy Immo est une application de gestion immobilière destinée à deux profils d'utilisateurs :

- **Le bailleur** administre son portefeuille (immeubles, biens, locataires, baux), encaisse les
  loyers, génère les documents contractuels et traite les candidatures reçues en ligne.
- **Le locataire** accède à un espace personnel où il consulte son bien, son relevé de compte,
  ses documents, et règle ses loyers (y compris la régularisation des arriérés) par carte bancaire.

L'isolation des données est stricte : **chaque bailleur ne voit que ses propres données**, et chaque
locataire n'accède qu'à son propre bail. Cette séparation est garantie côté serveur (rôles Spring
Security + filtrage par propriétaire dans chaque service).

---

## Fonctionnalités

### Espace bailleur
- **Tableau de bord** avec indicateurs clés (biens, locataires actifs, revenus mensuels, taux d'occupation) et animation des compteurs.
- **Gestion des biens** : création/édition/suppression, rattachement à un immeuble, photo (URL), mise en location.
- **Gestion des locataires** et des **baux** (avec relevé de compte débit/crédit et historique de paiement annuel sur 12 mois).
- **Paiements** : suivi par statut (payé / en attente / en retard), statistiques, encaissement en ligne via Stripe.
- **Documents PDF réels** : génération de **contrats de bail** et de **quittances** (mensuelles ou individuelles), import de pièces justificatives, téléchargement.
- **Candidatures** : réception des dossiers déposés en ligne, tri par statut, acceptation / refus.
- **Compte** : profil éditable, préférences de notification, suppression de compte (RGPD, cascade complète).

### Espace locataire
- Consultation de **son bien**, de son **relevé de compte** et de ses **documents**.
- **Paiement en ligne** du loyer par carte (Stripe Checkout), avec **régularisation des arriérés** avant le mois courant.

### Public (sans compte)
- **Landing page** et **recherche de biens disponibles** (filtres budget / surface / type).
- **Dépôt de candidature** en ligne pour un logement, sans création de compte.

### Transverse
- **Authentification JWT** cloisonnée par rôle (bailleur / locataire), **mot de passe oublié** (réinitialisation).
- **Design responsive** (mobile → desktop), notifications *toast*, bandeau de consentement cookies (RGPD).

---

## Pile technique

| Couche        | Technologies |
|---------------|--------------|
| **Backend**   | Spring Boot 4.0, Java 21, Spring Web MVC, Spring Data JPA / Hibernate, Spring Security, JWT (jjwt 0.12.6), Bean Validation |
| **Base de données** | PostgreSQL (schéma auto-géré par Hibernate `ddl-auto=update`) |
| **PDF**       | OpenPDF 1.3.43 (`com.lowagie.text`) |
| **Paiements** | Stripe Java 28.4.0 (Checkout + webhook) |
| **Frontend**  | Angular 21 (composants *standalone*, syntaxe `@if`/`@for`), TypeScript 5.9, RxJS, Tailwind CSS 3.4 |
| **Build**     | Maven (wrapper `mvnw`) · Angular CLI / npm |
| **Déploiement** | Docker (backend) · Render · Netlify · Neon (PostgreSQL) |

---

## Architecture

L'application se compose de **trois briques** déployables indépendamment :

```
┌──────────────────────┐        HTTPS         ┌───────────────────────┐        JDBC/SSL       ┌────────────────┐
│   Frontend Angular    │  ───────────────▶   │   Backend Spring Boot  │  ─────────────────▶  │   PostgreSQL    │
│   (Netlify)           │   /api/* (proxy)     │   API REST + JWT (Render)│                     │   (Neon)        │
└──────────────────────┘                      └───────────────────────┘                       └────────────────┘
                                                        │
                                                        ▼
                                                 Stripe Checkout (paiements)
```

- Le **frontend** ne communique avec le backend que via `/api/*`. En production, un proxy Netlify relaie
  ces appels vers le backend Render : le navigateur ne fait que des requêtes *same-origin* (pas de CORS côté client).
- Le **backend** expose une API REST sécurisée par jetons JWT et applique l'isolation des données par rôle.
- La **base** PostgreSQL est provisionnée à distance (Neon) en SSL ; le schéma est généré au premier démarrage.

---

## Modèle de données

Le domaine repose sur **8 entités** JPA. Les relations complètes (mappings, clés étrangères, cardinalités)
sont documentées dans [`backend/RELATIONS_ENTITES.md`](backend/RELATIONS_ENTITES.md).

```
Building (1) ──< (N) Property
Landlord (1) ──< (N) Property / Building / Tenant / Document
Property (1) ──── (0..1) Lease
Tenant   (1) ──< (N) Lease
Lease    (1) ──< (N) Payment
Property (1) ──< (N) Application
Document      >── Landlord / Property? / Tenant?
```

- `Property` porte les clés étrangères vers `Building` et `Landlord`.
- `Tenant` porte la clé vers `Landlord` (**isolation par bailleur**).
- `Lease` référence `Property` (unique) et `Tenant`.
- `Payment` référence `Lease` ; `Application` référence `Property`.
- `Document` référence `Landlord`, et optionnellement `Property` et/ou `Tenant`.

---

## Prérequis

- **Java 21** (JDK)
- **Maven** — ou le wrapper fourni (`mvnw` / `mvnw.cmd`)
- **Node.js** (LTS récent) et **npm**
- **PostgreSQL** (une base locale nommée `nancyImmo` par défaut)
- *(optionnel)* une **clé Stripe test** (`sk_test_…`) pour activer les paiements en ligne

---

## Démarrage rapide (local)

### 1. Base de données

Créez une base PostgreSQL locale (nom par défaut : `nancyImmo`) :

```sql
CREATE DATABASE "nancyImmo";
```

### 2. Backend (port 8080)

```bash
cd backend
cp .env.example .env          # ajustez les identifiants BDD / le secret JWT
./mvnw spring-boot:run        # Windows : mvnw.cmd spring-boot:run
```

Au premier démarrage sur une base vide, un **jeu de données de démonstration** est inséré
automatiquement (2 immeubles, 6 biens, 3 locataires, baux, paiements, candidatures…).

### 3. Frontend (port 4200)

```bash
cd frontend
npm install
npm start                     # ng serve, avec proxy /api → http://localhost:8080
```

Ouvrez ensuite **http://localhost:4200**.

---

## Comptes de démonstration

Insérés automatiquement sur une base fraîche :

| Rôle       | Identifiant                     | Mot de passe  |
|------------|---------------------------------|---------------|
| Bailleur   | `nancy@nancyimmo.fr`            | `password123` |
| Locataire  | `thomas.bernard@email.fr`       | `password123` |

---

## Configuration

Le backend lit sa configuration depuis les variables d'environnement (fichier `backend/.env` en local,
variables du PaaS en production). Voir [`backend/.env.example`](backend/.env.example).

| Variable | Rôle | Défaut (local) |
|----------|------|----------------|
| `db_host` / `db_port` / `db_name` | Connexion PostgreSQL locale | `localhost` / `5432` / `nancyImmo` |
| `db_username` / `db_password` | Identifiants PostgreSQL | `postgres` / `root` |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | Surcharge complète de la datasource (prod / Neon) | — |
| `SECURITY_JWT_SECRET` | Secret de signature des jetons JWT (HS256) | *à définir* |
| `APP_CORS_ALLOWED_ORIGINS` | Origines autorisées (CORS), séparées par des virgules | `http://localhost:4200` |
| `APP_FRONTEND_URL` | URL du frontend (redirections Stripe + lien de réinitialisation email) | `http://localhost:4200` |
| `MAIL_HOST` / `MAIL_PORT` | Serveur SMTP (email de réinitialisation) | `smtp.gmail.com` / `587` |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Identifiants SMTP (Gmail : *mot de passe d'application*) — vides = envoi désactivé (lien loggé) | *(vide)* |
| `MAIL_FROM` | Adresse expéditrice affichée | `MAIL_USERNAME` |
| `GOOGLE_CLIENT_ID` | Client ID OAuth 2.0 Google — vide = bouton Google masqué | *(vide)* |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_test_…`) — sinon les paiements renvoient 503 | *(vide)* |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe (`whsec_…`), optionnel | *(vide)* |
| `PORT` | Port d'écoute du serveur (injecté par le PaaS) | `8080` |

### Connexion Google & emails de réinitialisation

Ces deux fonctionnalités sont **optionnelles** : sans configuration, l'app reste pleinement
utilisable (le bouton Google est masqué, et le lien de réinitialisation est écrit dans les logs
du backend au lieu d'être envoyé par email).

**Connexion Google** — dans la [console Google Cloud](https://console.cloud.google.com/apis/credentials),
créez un identifiant OAuth 2.0 de type *Application Web*, ajoutez votre origine
(`http://localhost:4200` en local) dans **Origines JavaScript autorisées**, puis renseignez
`GOOGLE_CLIENT_ID`. Un compte Google inconnu crée un **bailleur** ; un email déjà connu se
connecte avec son rôle existant.

**Emails (Gmail)** — activez la double authentification sur le compte Google, générez un
[mot de passe d'application](https://myaccount.google.com/apppasswords), puis renseignez
`MAIL_USERNAME` (votre adresse Gmail) et `MAIL_PASSWORD` (le mot de passe d'application à 16
caractères). Le lien de réinitialisation pointe vers `APP_FRONTEND_URL/reset?token=…` (valable 30 min).

> ⚠️ Ne committez **jamais** de `.env` réel ni de secret. Générez un secret JWT fort, par ex. `openssl rand -base64 48`.

---

## API REST

Base : `/api`. Toutes les réponses sont en JSON. Les endpoints protégés attendent un en-tête
`Authorization: Bearer <JWT>`.

### Authentification — `/api/auth` *(public sauf `/me`)*
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET  | `/config` | Configuration publique (Client ID Google) |
| POST | `/register` | Inscription (rôle bailleur ou locataire) |
| POST | `/login` | Connexion → renvoie un JWT |
| POST | `/google` | Connexion / inscription via Google (ID token vérifié côté serveur) |
| POST | `/forgot-password` | Envoie un email de réinitialisation (message générique) |
| POST | `/reset-password` | Réinitialisation via jeton + auto-login |
| GET  | `/me` | Profil de l'utilisateur connecté |
| DELETE | `/me` | Suppression du compte (cascade) |

### Biens — `/api/properties`
| Méthode | Chemin | Accès |
|---------|--------|-------|
| GET | `/available` | **Public** — biens disponibles (recherche) |
| GET · POST | `/` | Authentifié (scopé bailleur) |
| GET | `/details` · `/{id}` · `/{id}/details` | Authentifié |
| PUT · DELETE | `/{id}` | Authentifié |

### Locataires · Immeubles · Bailleurs · Baux
| Ressource | Endpoints |
|-----------|-----------|
| `/api/tenants` | `GET` · `POST` · `GET/PUT/DELETE {id}` |
| `/api/buildings` | `GET` · `POST` · `GET/PUT/DELETE {id}` |
| `/api/landlords` | `GET` · `POST` · `GET/PUT/DELETE {id}` |
| `/api/leases` | `GET` · `POST` · `GET/PUT/DELETE {id}` · `GET {id}/statement` (relevé) |

### Paiements — `/api/payments`
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET · POST | `/` | Liste / création |
| GET | `/stats` | Totaux par statut |
| POST | `/checkout` · `/confirm` | Paiement Stripe (bailleur) |
| GET | `/tenant/{id}/history` | Historique annuel (12 mois) |
| GET · PUT · DELETE | `/{id}` | Détail / maj / suppression |

### Documents — `/api/documents`
| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/generate-bail` | Génère un contrat de bail (PDF) |
| POST | `/generate-quittances` · `/generate-quittance` | Génère les quittances (groupées / individuelle) |
| POST | `/upload` | Import d'une pièce justificative (multipart) |
| GET | `/{id}/download` | Téléchargement du fichier |
| GET · DELETE | `/` · `/{id}` | Liste / détail / suppression |

### Candidatures — `/api/applications`
| Méthode | Chemin | Accès |
|---------|--------|-------|
| POST | `/` | **Public** — dépôt d'un dossier |
| GET | `/` | Authentifié (bailleur) |
| PUT | `/{id}/status` · DELETE `/{id}` | Authentifié |

### Tableau de bord — `/api/dashboard`
| Méthode | Chemin | Accès |
|---------|--------|-------|
| GET | `/` | **Public** — statistiques globales |
| GET | `/me` | Authentifié — statistiques du bailleur connecté |

### Espace locataire — `/api/portal` *(rôle `LOCATAIRE`)*
| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/property` | Son bien |
| GET | `/statement` · `/dues` | Relevé de compte / arriérés à régulariser |
| GET | `/documents` · `/documents/{id}/download` | Ses documents |
| POST | `/checkout` · `/confirm` | Paiement en ligne (scopé locataire) |

### Divers
| Méthode | Chemin | Accès |
|---------|--------|-------|
| POST | `/api/stripe/webhook` | **Public** (signé) — événements Stripe |
| GET | `/` | **Public** — *health check* |

---

## Sécurité

- **Authentification stateless par JWT** (HS256, expiration 24 h) ; mots de passe hachés avec **BCrypt**.
- **Deux rôles** : `BAILLEUR` et `LOCATAIRE`. L'espace locataire (`/api/portal/**`) est réservé au rôle `LOCATAIRE`.
- **Isolation des données** : chaque service filtre par propriétaire (le bailleur connecté) ; tout `landlordId`
  envoyé par le client est ignoré. Un locataire n'accède qu'aux données rattachées à ses propres baux.
- **CORS** restreint aux origines déclarées (`APP_CORS_ALLOWED_ORIGINS`).
- **Endpoints publics** volontairement ouverts : landing / *health check* (`/`), authentification (`/api/auth/**`),
  biens disponibles (`GET /api/properties/available`), statistiques globales (`GET /api/dashboard`),
  dépôt de candidature (`POST /api/applications`), webhook Stripe (`POST /api/stripe/webhook`).

---

## Déploiement

Le déploiement complet (gratuit et sécurisé) est décrit pas à pas dans **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.

En résumé :

| Brique | Hébergeur | Configuration |
|--------|-----------|---------------|
| Base PostgreSQL | **Neon** | chaîne JDBC SSL |
| Backend Spring Boot | **Render** (Docker) | [`render.yaml`](render.yaml) + [`backend/Dockerfile`](backend/Dockerfile) |
| Frontend Angular | **Netlify** | [`netlify.toml`](netlify.toml) (proxy `/api/*` + fallback SPA) |

---

## Structure du dépôt

```
nancy-SpringBoot/
├── backend/                     # API Spring Boot (Java 21, Maven)
│   ├── src/main/java/com/nancyimmo/bailleur/
│   │   ├── controllers/         # Endpoints REST
│   │   ├── services/            # Logique métier (isolation par bailleur, PDF, Stripe)
│   │   ├── repositories/        # Spring Data JPA
│   │   ├── models/              # Entités JPA (8 entités)
│   │   ├── dto/                 # Objets de transfert (dont dto/auth)
│   │   ├── security/            # JWT, filtres, config Spring Security, CurrentUser
│   │   └── config/              # DataSeeder (démo), backfill d'appartenance
│   ├── Dockerfile               # Build multi-étapes (Maven → JRE)
│   ├── RELATIONS_ENTITES.md     # Documentation du modèle de données
│   └── .env.example
├── frontend/                    # Application Angular 21 + Tailwind
│   └── src/app/
│       ├── pages/               # accueil, auth, bailleur/*, locataire, recherche, profil
│       ├── services/            # api, auth, guards, interceptor, toast
│       ├── shared/              # toast, bandeau cookies
│       └── layout/              # en-tête global
├── DEPLOYMENT.md                # Guide de déploiement (Neon + Render + Netlify)
├── render.yaml                  # Blueprint Render (backend)
└── netlify.toml                 # Configuration Netlify (frontend)
```

---

## Documentation complémentaire

- [`DEPLOYMENT.md`](DEPLOYMENT.md) — guide de mise en ligne (Neon + Render + Netlify) et checklist sécurité.
- [`backend/RELATIONS_ENTITES.md`](backend/RELATIONS_ENTITES.md) — relations JPA entre entités.
- [`frontend/README.md`](frontend/README.md) — commandes Angular CLI (serve, build, test).
