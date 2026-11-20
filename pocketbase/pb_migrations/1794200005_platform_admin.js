/// <reference path="../pb_data/types.d.ts" />
/**
 * Administrateur de la plateforme : drapeau `is_platform_admin` sur les utilisateurs.
 * Il configure l'installation pour son église (identité, monnaie, ventilation, modules, référentiels).
 * Booléen non requis : PocketBase refuserait la valeur `false` sur un champ requis.
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId('users');
  if (!users.fields.getByName('is_platform_admin')) {
    users.fields.add(new BoolField({ name: 'is_platform_admin' }));
    app.save(users);
  }
}, (app) => {
  /* conservé : le retirer supprimerait l'accès à la console d'administration */
});
