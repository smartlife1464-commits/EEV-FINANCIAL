# Mise en production

Une installation = une église. Pour une autre église, répétez cette procédure sur un autre serveur
(ou un autre dossier / domaine), puis importez éventuellement un profil d’église.

## 1. Variables d’environnement

Copiez [`.env.example`](../.env.example) en `.env` à la racine et remplissez :

| Variable | Rôle |
|---|---|
| `POCKETBASE_ENCRYPTION_KEY` | 32 caractères (`openssl rand -hex 16`) |
| `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD` | superutilisateur PocketBase utilisé par l’API (12 caractères minimum) |
| `SETUP_TOKEN` | jeton de l’assistant d’installation (16 caractères minimum) |
| `CORS_ORIGIN` | domaine public, ex. `https://gestion.mon-eglise.org` (jamais `*`) |
| `SMTP_*` | facultatif : envoi des codes de réinitialisation du mot de passe |

L’API **refuse de démarrer** en production si un secret manque, est trop court ou si `CORS_ORIGIN` vaut `*`.
Aucun mot de passe par défaut n’existe dans le code.

## 2. Démarrage

```bash
cd docker
docker compose --env-file ../.env up -d --build
```

Créez ensuite le superutilisateur PocketBase avec **les mêmes** identifiants que dans `.env` :

```bash
docker compose exec pocketbase pocketbase superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD" --dir /pb_data
```

(Le chemin du binaire peut varier selon l’image ; hors Docker : `./bin/pocketbase superuser upsert EMAIL MOT_DE_PASSE`.)

Les migrations s’appliquent automatiquement au démarrage de PocketBase. Une base neuve contient uniquement des
référentiels génériques (fonds général, dîme des dîmes, aide sociale, offrandes spéciales, catégories,
types de culte) — aucune donnée fictive, aucun compte.

## 3. Installation de l’église

Ouvrez le domaine : l’assistant demande le `SETUP_TOKEN`, l’identité de l’église, la monnaie et crée
l’administrateur de la plateforme. Voir [ADMIN-PLATEFORME.md](ADMIN-PLATEFORME.md).

## 4. Base existante contenant des données de test

```bash
node --env-file=apps/api/.env scripts/purge-demo-data.mjs --yes
```

Le script sauvegarde la base (`pb_data/backups/avant_mise_en_production_*.zip`) puis supprime toutes les
écritures, les quêtes, les comptes utilisateurs et remet les soldes à 0, en conservant la structure.
Depuis l’application, la console propose aussi **Données & système → Remise à zéro**.

## 5. Application mobile

L’adresse du serveur se règle dans l’application (**Configuration du serveur**). Le nom, le logo, la monnaie,
la ventilation, les libellés des rôles et les modules sont lus depuis le serveur. L’icône et le nom affichés
sur l’écran d’accueil du téléphone sont ceux de la compilation : pour une autre église, remplacez
`apps/mobile/assets/images/logo.png`, lancez `dart run flutter_launcher_icons` puis recompilez.

## 6. Avant d’ouvrir l’accès

- [ ] HTTPS devant Nginx (certificat valide)
- [ ] `SETUP_TOKEN` fort, installation effectuée
- [ ] Au moins deux administrateurs de la plateforme
- [ ] Sauvegarde quotidienne planifiée (`scripts/backup/backup.sh`) et restauration testée (`scripts/restore/restore.sh`)
- [ ] Console PocketBase (`/_pb/`) non exposée sur Internet (restreinte au réseau local dans `docker/nginx.conf`)
- [ ] Messagerie configurée, ou procédure de réinitialisation par l’administrateur connue des utilisateurs

## 7. Déploiement sur Coolify (images précompilées)

Le serveur Coolify ne compile pas l’application : GitHub Actions ([`images.yml`](../.github/workflows/images.yml))
compile les images `pocketbase`, `api` et `web` à chaque push sur `main` et les publie sur GHCR
(`ghcr.io/smartlife1464-commits/eev-financial-*`, étiquettes `latest` et `sha-<commit>`).

- Application Coolify : build pack **Docker Compose**, fichier `/docker-compose.coolify.yml`, domaine sur le service `web`.
- Le dépôt étant privé, le serveur doit être connecté à GHCR une fois (terminal Coolify du serveur) :
  `docker login ghcr.io -u <compte GitHub>` avec un jeton GitHub (classic) limité à `read:packages`.
- Secrets générés par Coolify : `SERVICE_PASSWORD_64_PBADMIN` (superutilisateur PocketBase) et
  `SERVICE_PASSWORD_SETUPTOKEN` (jeton de l’assistant d’installation), onglet *Environment Variables*.
- Redéploiement automatique après publication des images : secrets du dépôt `COOLIFY_DEPLOY_URL` et `COOLIFY_TOKEN`.
- Revenir à une version précise : variable `EEV_IMAGE_TAG=sha-<commit>` dans Coolify, puis redéployer.
