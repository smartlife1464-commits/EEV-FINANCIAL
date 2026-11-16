/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1019204502",
        "hidden": false,
        "id": "relation1516833280",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "fixed_expense",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3866337329",
        "max": 0,
        "min": 0,
        "name": "due_date",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number3949381038",
        "max": null,
        "min": null,
        "name": "expected_amount",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_739270338",
        "hidden": false,
        "id": "relation2436005357",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "fund_account",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2063623452",
        "max": 0,
        "min": 0,
        "name": "status",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number856342068",
        "max": null,
        "min": null,
        "name": "reserved_amount",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number3844037968",
        "max": null,
        "min": null,
        "name": "paid_amount",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3540268236",
        "max": 0,
        "min": 0,
        "name": "coverage_status",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text632883702",
        "max": 0,
        "min": 0,
        "name": "generated_at",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation1319357245",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "approved_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text457172035",
        "max": 0,
        "min": 0,
        "name": "approved_at",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3735298188",
        "max": 0,
        "min": 0,
        "name": "paid_at",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2226902283",
        "max": 0,
        "min": 0,
        "name": "payment_transaction",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text18589324",
        "max": 0,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      }
    ],
    "id": "pbc_3791929718",
    "indexes": [],
    "listRule": "",
    "name": "fixed_expense_occurrences",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    "viewRule": ""
  });

  // Installation neuve : ce fichier s'exécute AVANT celui qui crée « fixed_expenses » (même horodatage,
  // ordre alphabétique). La relation est alors retirée ici et rétablie par 1794200004_fixed_expense_relation.js.
  // (Sans effet sur les bases existantes, où cette migration est déjà appliquée.)
  try {
    app.findCollectionByNameOrId("pbc_1019204502");
  } catch (_) {
    const relation = collection.fields.getByName("fixed_expense");
    if (relation) collection.fields.removeById(relation.id);
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3791929718");

  return app.delete(collection);
})
