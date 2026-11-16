# Esprit & Vie — Application mobile (Flutter)

Application mobile premium du Ministère Esprit & Vie : tableaux de bord par rôle, trésorerie, recettes,
dépenses avec circuit d'approbation, fiches de présence et alertes, en mode clair et sombre.

## Démarrage

```bash
# depuis la racine du dépôt : PocketBase + API (voir README principal)
pnpm dev:pb
pnpm dev:api

# puis l'application
cd apps/mobile
flutter pub get
flutter run            # émulateur Android, iPhone, Chrome ou macOS
```

L'adresse de l'API se règle dans l'application (écran de connexion → **Configuration du serveur**, ou Profil) :

| Cible | Adresse par défaut |
|---|---|
| Émulateur Android | `http://10.0.2.2:4000/api` |
| Web, simulateur iOS, macOS | `http://localhost:4000/api` |
| Téléphone réel | `http://<IP-de-l-ordinateur>:4000/api` ou le domaine de production |

## Architecture

```
lib/
├── core/            thème (charte or #FFBC00 / bleu nuit #091338), formats FCFA & dates, règles métier, modèles
├── data/            client API (erreurs explicites), stockage local, file hors-ligne
├── state/           session, préférences (thème, période), centre de notifications
└── ui/
    ├── kit/         composants premium : cartes, verre dépoli, boutons, compteurs animés, graphiques, états
    └── screens/     démarrage, présentation, connexion, mot de passe oublié, coquille de navigation,
                     tableaux de bord (Pasteur, Finances, Protocole), finances, approbations,
                     formulaires, fréquentation, alertes, profil
```

## Navigation par rôle

| Rôle | Onglets | Bouton « + » |
|---|---|---|
| Pasteur, Admin, Auditeur | Accueil · Finances · Cultes · Profil | Recette, dépense, fiche, arbitrage (selon droits) |
| Responsable Finances, Caissier | Accueil · Finances · Alertes · Profil | Recette, dépense |
| Protocole | Accueil · Fiches · Alertes · Profil | Fiche de présence |

Les droits affichés suivent la matrice de permissions renvoyée par l'API ; le serveur reste l'autorité finale.

## Points clés

- **Aucune donnée fictive** : chaque chiffre vient de l'API ; une erreur réseau affiche un état « Réessayer ».
- **Hors-ligne** : recettes, dépenses et fiches saisies sans réseau sont conservées et envoyées au retour de la
  connexion. Un refus métier reste visible (Profil) avec son motif au lieu d'être supprimé en silence.
- **Règles d'or** : ventilation 80/10/10 calculée en direct, total de fréquentation = H + F + J + E,
  auto-approbation impossible, motif de rejet obligatoire.
- **Comptes de démonstration** sur l'écran de connexion : uniquement dans les versions de développement.

## Tests

```bash
flutter analyze
flutter test
```
