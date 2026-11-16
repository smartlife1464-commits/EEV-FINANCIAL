/// <reference path="../pb_data/types.d.ts" />
/**
 * Le champ booléen `is_active` était « requis » : PocketBase rejette alors la valeur `false`,
 * ce qui rendait IMPOSSIBLE la désactivation d'un compte utilisateur depuis l'administration.
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId('users');
  const field = users.fields.getByName('is_active');
  if (field && field.required) {
    field.required = false;
    app.save(users);
  }
}, (app) => {
  /* pas de retour arrière : rendre le champ requis bloquerait à nouveau la désactivation */
});
