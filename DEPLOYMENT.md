# Déploiement de Nancy Immo (gratuit & sécurisé)

L'application se compose de **3 briques** déployées séparément :

| Brique | Hébergeur gratuit | HTTPS |
|--------|-------------------|-------|
| Base PostgreSQL | **Neon** (neon.tech) | ✅ |
| Backend Spring Boot | **Render** (Docker) | ✅ auto |
| Frontend Angular | **Netlify** | ✅ auto |

> ⚠️ Limite du plan gratuit Render : le backend s'endort après 15 min d'inactivité
> et met ~50 s à se réveiller à la 1ʳᵉ requête. Acceptable pour une démo / projet d'études.

---

## Étape 1 — Base de données (Neon)

1. Crée un compte sur https://neon.tech et un projet « nancy-immo ».
2. Neon te donne une chaîne **au format libpq**, du type :
   ```
   postgresql://neondb_owner:MON_PASS@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   ⚠️ **Cette chaîne n'est PAS une URL JDBC.** Il faut la convertir :
   - ajoute le préfixe **`jdbc:`** devant `postgresql://` ;
   - **retire** `&channel_binding=require` (paramètre libpq non géré par le driver JDBC) ;
   - **sors** le user et le mot de passe de l'URL (ils iront dans leurs propres variables).

   Tu obtiens donc, séparément :

   | Variable | Valeur |
   |----------|--------|
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | `neondb_owner` |
   | `SPRING_DATASOURCE_PASSWORD` | `MON_PASS` |

Le schéma se crée tout seul au 1ᵉʳ démarrage (`hibernate.ddl-auto=update`).

---

## Étape 2 — Backend (Render)

1. Pousse ton code sur GitHub (branche `main`).
2. Sur https://render.com → **New > Blueprint**, sélectionne ton dépôt.
   Render détecte automatiquement [`render.yaml`](render.yaml).
3. Renseigne les variables d'environnement demandées :

   | Variable | Valeur |
   |----------|--------|
   | `SPRING_DATASOURCE_URL` | la chaîne JDBC Neon (avec `?sslmode=require`) |
   | `SPRING_DATASOURCE_USERNAME` | user Neon |
   | `SPRING_DATASOURCE_PASSWORD` | mot de passe Neon |
   | `SECURITY_JWT_SECRET` | **généré automatiquement** par Render (ne pas toucher) |
   | `APP_CORS_ALLOWED_ORIGINS` | l'URL Netlify (étape 3), ex. `https://nancy-immo.netlify.app` |
   | `APP_FRONTEND_URL` | l'URL Netlify (lien de réinitialisation dans les emails) |

   Variables **optionnelles** (fonctionnalités connexion Google / emails) :

   | Variable | Valeur |
   |----------|--------|
   | `GOOGLE_CLIENT_ID` | Client ID OAuth Google (ajoute l'URL Netlify aux origines autorisées) |
   | `MAIL_USERNAME` / `MAIL_PASSWORD` | Adresse Gmail + *mot de passe d'application* (envoi des emails) |
   | `MAIL_FROM` | Adresse expéditrice (défaut = `MAIL_USERNAME`) |

   > Sans ces variables optionnelles : le bouton Google est masqué et le lien de réinitialisation
   > est écrit dans les logs Render au lieu d'être envoyé par email. L'app reste fonctionnelle.

4. Déploie. Note l'URL obtenue, `https://nancy-immo-api.onrender.com`.

---

## Étape 3 — Frontend (Netlify)

1. Dans [`netlify.toml`](netlify.toml), remplace `REMPLACER-PAR-TON-BACKEND.onrender.com`
   par le domaine Render de l'étape 2.
2. Sur https://netlify.com → **Add new site > Import from GitHub**, sélectionne le dépôt.
   La config est lue depuis `netlify.toml` (base `frontend`, build `npm run build`,
   publication `dist/frontend-app/browser`).
3. Déploie. Note l'URL, `https://nancy-immo.netlify.app`.
4. Reviens sur Render et mets `APP_CORS_ALLOWED_ORIGINS` = cette URL Netlify, puis redéploie.

Grâce au proxy Netlify (`/api/*` → backend), le navigateur ne fait que des appels
**same-origin** : aucun problème de CORS, et le code Angular reste inchangé.

---

## Sécurité — checklist avant la mise en ligne

- [x] **Secret JWT** injecté par variable d'env (jamais celui en dur du code).
- [x] **Identifiants BDD** en variables d'env, connexion Neon en **SSL**.
- [x] **CORS** restreint au seul domaine du frontend (`APP_CORS_ALLOWED_ORIGINS`).
- [x] **HTTPS** automatique sur les 3 hébergeurs.
- [x] `.env` ignoré par git (voir `backend/.gitignore`).
- [ ] **Vérifie les endpoints publics** dans `SecurityConfig` :
      `/api/dashboard` et `/api/properties/available` sont en accès libre.
      Si ces données ne doivent pas être publiques, retire-les des `permitAll()`.
- [ ] (Plus tard) Passer `ddl-auto` de `update` à `validate` + migrations Flyway/Liquibase
      pour un contrôle strict du schéma en production.

---

## Développement local

```bash
# Backend
cd backend
cp .env.example .env   # puis ajuste les valeurs
mvn spring-boot:run

# Frontend (proxy /api -> localhost:8080 via proxy.conf.json)
cd frontend
npm install
npm start
```
