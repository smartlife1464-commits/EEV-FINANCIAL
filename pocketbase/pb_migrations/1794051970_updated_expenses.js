/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1691921218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    "listRule": "",
    "updateRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier'",
    "viewRule": ""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1346358849",
    "max": 0,
    "min": 0,
    "name": "expense_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text947460427",
    "max": 0,
    "min": 0,
    "name": "expense_type",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3771372939",
    "hidden": false,
    "id": "relation105650625",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3585606721",
    "max": 0,
    "min": 0,
    "name": "category_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(5, new Field({
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
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1019204502",
    "hidden": false,
    "id": "relation1516833280",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "fixed_expense",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3791929718",
    "hidden": false,
    "id": "relation3853037204",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "fixed_occurrence",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2392944706",
    "max": null,
    "min": null,
    "name": "amount",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2059355242",
    "max": 0,
    "min": 0,
    "name": "beneficiary",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3095901163",
    "max": 0,
    "min": 0,
    "name": "purpose",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text507083032",
    "max": 0,
    "min": 0,
    "name": "expense_date",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2263173092",
    "max": 0,
    "min": 0,
    "name": "receipt_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
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
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation415535525",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "requested_by",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(15, new Field({
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
  }))

  // add field
  collection.fields.addAt(16, new Field({
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
  }))

  // add field
  collection.fields.addAt(17, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2909529734",
    "max": 0,
    "min": 0,
    "name": "rejection_reason",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(18, new Field({
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
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation2335707122",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "paid_by",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2069996022",
    "max": 0,
    "min": 0,
    "name": "payment_method",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3985270331",
    "max": 0,
    "min": 0,
    "name": "payment_reference",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
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
  }))

  // update field
  collection.fields.addAt(0, new Field({
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
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1691921218")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role ?= 'admin,finance_lead,cashier'",
    "listRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'",
    "updateRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead'",
    "viewRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,cashier,auditor'"
  }, collection)

  // remove field
  collection.fields.removeById("text1346358849")

  // remove field
  collection.fields.removeById("text947460427")

  // remove field
  collection.fields.removeById("relation105650625")

  // remove field
  collection.fields.removeById("text3585606721")

  // remove field
  collection.fields.removeById("relation2436005357")

  // remove field
  collection.fields.removeById("relation1516833280")

  // remove field
  collection.fields.removeById("relation3853037204")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("text2059355242")

  // remove field
  collection.fields.removeById("text3095901163")

  // remove field
  collection.fields.removeById("text507083032")

  // remove field
  collection.fields.removeById("text2263173092")

  // remove field
  collection.fields.removeById("text2063623452")

  // remove field
  collection.fields.removeById("relation415535525")

  // remove field
  collection.fields.removeById("relation1319357245")

  // remove field
  collection.fields.removeById("text457172035")

  // remove field
  collection.fields.removeById("text2909529734")

  // remove field
  collection.fields.removeById("text3735298188")

  // remove field
  collection.fields.removeById("relation2335707122")

  // remove field
  collection.fields.removeById("text2069996022")

  // remove field
  collection.fields.removeById("text3985270331")

  // remove field
  collection.fields.removeById("text18589324")

  // update field
  collection.fields.addAt(0, new Field({
    "autogeneratePattern": "[a-z0-9]{15}",
    "hidden": false,
    "id": "text3208210256",
    "max": 15,
    "min": 15,
    "name": "id",
    "pattern": "^[a-z0-9]+$",
    "presentable": false,
    "primaryKey": true,
    "required": true,
    "system": true,
    "type": "text"
  }))

  return app.save(collection)
})
