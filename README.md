# Plateforme de Gestion, Trésorerie & Fréquentation — Ministère Esprit & Vie

Bienvenue sur la plateforme officielle de gestion administrative, statistique et financière du **Ministère Esprit & Vie** (Yaoundé, Cameroun).

Ce système remplace intégralement les fiches physiques, les registres papier et les transmissions de rapports manuels par WhatsApp en centralisant l'intégralité des flux au sein d'une solution numérique traçable, auditée et sécurisée.

---

## 1. Principes Métier Fondamentaux & Règles d'Or

### 1.1 Caisse Physique Unique Consolidée & Compartiments Analytiques
- Le ministère dispose d'**une seule caisse physique consolidée** (totalité des espèces en coffre, comptes bancaires et comptes Mobile Money).
- La gestion interne maintient une **séparation analytique stricte** :
  - **Fonds Général** (Fonctionnement & charges courantes)
  - **Dîme des Dîmes** (10% réservé)
  - **Aide Sociale & Secours** (10% réservé)
  - **Construction Auditorium** (100% affecté)
  - **Amis de Jésus** (100% affecté)
  - **Offrandes Spéciales & Dons désignés**
- Tout transfert interne entre compartiments débite la source et crédite la destination sans modifier le solde global de la caisse physique.

### 1.2 Règle Fondamentale de Répartition des Dîmes et Offrandes
Pour toute recette ordinaire (Dîmes et Offrandes ordinaires), le prélèvement est calculé sur le **montant BRUT** dès l'encaissement :
$$\text{Dîme des dîmes} = 10\%$$
$$\text{Aide sociale} = 10\%$$
$$\text{Fonds général} = 80\%$$

> **Règle absolue :** Les charges courantes (électricité, eau, transport, entretien, honoraires) sont exclusivement financées par les 80% du Fonds Général. Aucun fonds affecté ne supporte de charge courante.

### 1.3 Fonds Spécifiques Affectés (0% Prélèvement)
Les dons pour la construction de l'auditorium, les cotisations Amis de Jésus et les offrandes à destination spéciale sont affectés à **100%** à leur compte cible, **sans aucun prélèvement**.

### 1.4 Workflow des Dépenses à 3 Niveaux Stricts
1. **Création comptable** : Saisie par les finances (`pending_approval`).
2. **Autorisation souveraine du Leader** : Approbation ou rejet avec motif (`approved` / `rejected`).
3. **Paiement effectif** : Décaissement physique par le caissier (`paid`).

> **Sécurité absolue :** Aucun décaissement physique ne peut être exécuté par la caisse sans approbation préalable du Leader Principal. L'auto-approbation d'une dépense par son auteur est strictement interdite.

### 1.5 Règle de Fréquentation du Protocole
Le décompte des participants au culte repose sur des catégories exclusives :
$$\text{TOTAL PARTICIPANTS} = \text{HOMMES} + \text{FEMMES} + \text{JEUNES} + \text{ENFANTS}$$

> **Indicateur complémentaire :** Les nouveaux visiteurs constituent un indicateur d'intégration spirituelle et **ne doivent JAMAIS être additionnés au total de fréquentation**.

---

## 2. Architecture Technique (Monorepo)

```
EEV-FINANCIAL/
├── apps/
│   ├── web/                     # Application React 19 / Vite / Tailwind / Recharts
│   ├── api/                     # Backend Fastify / OpenAPI / Zod / PocketBase SDK
│   └── mobile/                  # Application Flutter / Provider / SharedPreferences / OfflineSync
├── packages/
│   ├── shared-types/            # Définitions TypeScript (Enums, DTOs, Modèles)
│   ├── business-rules/          # Logique financière & arithmétique exacte FCFA
│   └── shared-validation/       # Schémas de validation Zod
├── pocketbase/
│   ├── pb_migrations/           # Migrations JS versionnées PocketBase
│   └── pb_hooks/                # Hooks serveur PocketBase
├── docker/                      # Dockerfile API, Web, Compose & Nginx
└── scripts/                     # Scripts d'automatisation (Backup, Restore)
```

---

## 3. Guide de Démarrage Rapide en Local

### Prérequis
- Node.js >= 20
- pnpm >= 10.18 (`corepack enable`)

### Installation des dépendances
```bash
pnpm install
```

### Exécution des tests automatisés (Règles financières & API)
```bash
pnpm test
```

### Lancement des services
```bash
# Terminal 1 : PocketBase (serveur de données & auth) — applique automatiquement les migrations
pnpm dev:pb
# équivalent : ./bin/pocketbase serve --dir=./pocketbase/pb_data --migrationsDir=./pocketbase/pb_migrations --hooksDir=./pocketbase/pb_hooks --http=127.0.0.1:8090

# Terminal 2 : API Fastify Node.js (Port 4000)
pnpm dev:api

# Terminal 3 : Application Web React (Port 5173)
pnpm dev:web

# Terminal 4 : Application Mobile Flutter (Android / iOS / Web / macOS)
cd apps/mobile && flutter run
```

Documentation Swagger interactive disponible sur : `http://localhost:4000/docs`.

---

> ⚠️ Toujours passer `--migrationsDir` : sans lui, PocketBase cherche les migrations dans `bin/pb_migrations`
> et les réparations de schéma (`pocketbase/pb_migrations/17942000*`) ne sont pas appliquées.

### Vérifications avant livraison
```bash
pnpm typecheck   # types partagés + API + Web
pnpm test        # règles métier + moteur statistique + API
```

## 4. Déploiement en Production (VPS Linux & Docker)

Le dossier `docker/` contient la configuration de production. Variables **obligatoires** (fichier `.env` à la racine, jamais commité) :
`POCKETBASE_ENCRYPTION_KEY` (32 caractères), `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`.

```bash
cd docker
docker compose --env-file ../.env up -d --build
```

> En production (`NODE_ENV=production`), les jetons et identifiants de démonstration sont désactivés,
> la page de connexion n'est plus pré-remplie et le sélecteur de comptes de démo est masqué.

Services déployés :
- **PocketBase** (`eev-pocketbase`) : SQLite avec volume persistant sécurisé.
- **API Node.js** (`eev-api`) : Moteur Fastify avec logs structurés Pino.
- **Frontend Nginx** (`eev-web`) : Sert l'application web React optimisée et assure le proxy inverse.

### Paramètres institutionnels
Le nom, l'adresse, la boîte postale, le téléphone et l'email du ministère se règlent dans **Paramètres** (rôles Admin / Leader).
Ils alimentent tous les documents officiels (reçus de don, bons de caisse, PV de clôture, rapports, registre de fréquentation).

### Sauvegarde et Restauration Automatisées
```bash
# Sauvegarde instantanée (à planifier en cron quotidien)
./scripts/backup/backup.sh

# Restauration d'une archive (crée d'abord une copie de sécurité de la base actuelle)
./scripts/restore/restore.sh backups/eev_backup_20261106_220000.tar.gz
```
Une sauvegarde instantanée peut aussi être lancée depuis **Paramètres → Sauvegarder maintenant** (visible dans la console PocketBase).

---

## 5. Matrice des Rôles et Permissions (RBAC)

| Rôle | Profil Métier | Consultation Trésorerie | Saisie Recettes | Demande Dépense | Approbation Dépense | Décaissement | Fréquentation | Audit |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `lead_pastor` | **Leader Principal** | ✅ Totale | ✅ | ✅ | **✅ Souveraine** | ❌ (Finances) | ✅ Totale | ✅ |
| `finance_lead` | **Resp. Finances** | ✅ Totale | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `cashier` | **Caissier** | ✅ Opérations | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `protocol_lead` | **Resp. Protocole** | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Validation** | ❌ |
| `protocol_agent` | **Agent Protocole** | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ Saisie** | ❌ |
| `auditor` | **Auditeur** | ✅ Totale | ❌ | ❌ | ❌ | ❌ | ✅ Consultation | **✅ Totale** |
| `admin` | **Administrateur** | ✅ Totale | ✅ | ✅ | ❌ | ❌ | ✅ Totale | ✅ |



## 6. Audit & corrections de novembre 2026
Le détail des dysfonctionnements corrigés et la feuille de route des améliorations figurent dans
[`docs/AUDIT-2026-11.md`](docs/AUDIT-2026-11.md).
