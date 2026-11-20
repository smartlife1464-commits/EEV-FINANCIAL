# Administration de la plateforme

La plateforme s’installe **une fois par église** : chaque église a son serveur, sa base de données et ses
comptes. L’**administrateur de la plateforme** adapte l’installation à son église depuis la console web
(menu **Console plateforme**), sans toucher au code.

## Première installation

1. Déployez le serveur (voir [DEPLOIEMENT-PRODUCTION.md](DEPLOIEMENT-PRODUCTION.md)).
2. Ouvrez l’application web : tant qu’aucun administrateur de la plateforme n’existe, toutes les pages mènent
   à l’**assistant d’installation**.
3. Saisissez le **jeton d’installation** (`SETUP_TOKEN` de l’API), puis l’identité de l’église, la monnaie et
   le compte administrateur (10 caractères minimum pour le mot de passe).
4. Connectez-vous avec ce compte : le menu **Console plateforme** apparaît.

L’assistant n’est plus accessible dès qu’un administrateur de la plateforme existe (réponse 409).
Sur l’application mobile, un serveur non configuré affiche « Installation à finaliser ».

## La console, section par section

| Section | Ce qu’on y règle |
|---|---|
| Identité & apparence | Nom officiel, nom court, slogan, coordonnées (reçus, bons, PV, rapports), capacité de la salle, logo (400 Ko max), couleur principale (toute l’interface web) et couleur secondaire (fonds sombres) |
| Monnaie & ventilation | Code ISO, symbole, monnaie en toutes lettres (montant en lettres des reçus) ; règle de ventilation des recettes ordinaires avec simulation en direct |
| Référentiels | Compartiments de caisse, catégories de recettes (ventilation standard ou affectation directe 100 %), catégories de dépenses, types de culte |
| Rôles & accès | Libellés des 7 rôles (les droits restent fixes : séparation des fonctions) ; désignation d’autres administrateurs de la plateforme |
| Modules | Fréquentation, finances, quêtes, charges fixes, budgets, transferts, clôture de caisse, analyses. Un module désactivé disparaît des menus web et mobile ; aucune donnée n’est supprimée |
| Profil d’église | Export / import JSON de la configuration et des référentiels (sans données financières ni personnelles) |
| Données & système | État du serveur, sauvegarde à la demande, remise à zéro des données |

### Règle de ventilation

- Les pourcentages sont des entiers dont le total doit faire **100 %**.
- Chaque compartiment reçoit sa part arrondie à l’inférieur ; le compartiment marqué **Reliquat** reçoit le
  complément, si bien que la somme est toujours exactement le montant encaissé.
- La règle s’applique aux recettes **enregistrées après** la modification ; l’historique n’est jamais recalculé.
- Un compartiment utilisé dans la ventilation ne peut pas être désactivé.
- Le compartiment `GENERAL` est le compartiment de **fonctionnement** : il reçoit par défaut les dépenses
  courantes et ne peut pas être désactivé.

### Profil d’église (dupliquer une configuration)

1. Dans l’église A : **Profil d’église → Télécharger le profil**.
2. Dans l’installation neuve de l’église B : **Profil d’église → Importer**. Laissez « Importer aussi
   l’identité » désactivé.

L’import ajoute ou met à jour les éléments **par code** ; il ne supprime rien et ne touche jamais aux écritures.
Un modèle prêt à l’emploi est fourni : [`profils/eglise-generique.json`](profils/eglise-generique.json).

### Remise à zéro des données

À utiliser après une formation ou des essais, avant la mise en service réelle. Une sauvegarde complète est
créée juste avant. Sont supprimés : recettes, dépenses, transferts, charges fixes, budgets, clôtures, fiches
de culte, quêtes spontanées et journal d’audit ; tous les soldes reviennent à 0. La configuration et les
référentiels sont conservés. En option, les comptes utilisateurs sont supprimés (les administrateurs de la
plateforme restent). La confirmation exige de saisir le nom exact de l’église.

## Mots de passe

- **Messagerie configurée** (`SMTP_*`) : « Mot de passe oublié » envoie un code à 6 chiffres valable
  15 minutes (5 essais maximum).
- **Sans messagerie** : l’administrateur définit un mot de passe provisoire depuis **Utilisateurs →
  Mot de passe**. Seul un administrateur de la plateforme peut modifier le compte d’un autre administrateur
  de la plateforme.

## API (référence)

| Méthode | Route | Accès |
|---|---|---|
| GET | `/api/platform/public` | public (nom, logo, couleurs, monnaie, modules, libellés, `setupRequired`) |
| GET | `/api/platform/setup/status` | public |
| POST | `/api/platform/setup` | public, une seule fois, jeton requis en production |
| GET | `/api/platform/config` | utilisateur connecté |
| PUT | `/api/platform/config` | admin plateforme |
| GET | `/api/platform/reference` | admin plateforme |
| POST / PATCH | `/api/platform/{funds,revenue-categories,expense-categories,service-types}` | admin plateforme |
| PATCH | `/api/platform/admins/:id` | admin plateforme |
| GET / POST | `/api/platform/profile` | admin plateforme (export / import) |
| POST | `/api/platform/reset-data` | admin plateforme |
| POST | `/api/users/:id/password` | administrateur, pasteur principal |
