/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1656761753")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4085465703",
    "max": 0,
    "min": 0,
    "name": "transfer_number",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_739270338",
    "hidden": false,
    "id": "relation3709385491",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "source_fund",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_739270338",
    "hidden": false,
    "id": "relation2134095649",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "destination_fund",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(4, new Field({
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
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1001949196",
    "max": 0,
    "min": 0,
    "name": "reason",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation3379501080",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "authorized_by",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
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
  const collection = app.findCollectionByNameOrId("pbc_1656761753")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'",
    "viewRule": "@request.auth.role ?= 'admin,lead_pastor,finance_lead,auditor'"
  }, collection)

  // remove field
  collection.fields.removeById("text4085465703")

  // remove field
  collection.fields.removeById("relation3709385491")

  // remove field
  collection.fields.removeById("relation2134095649")

  // remove field
  collection.fields.removeById("number2392944706")

  // remove field
  collection.fields.removeById("text1001949196")

  // remove field
  collection.fields.removeById("relation3379501080")

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
