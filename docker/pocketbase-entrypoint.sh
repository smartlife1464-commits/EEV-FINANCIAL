#!/bin/sh
set -e
ARGS="--dir=/pb_data --migrationsDir=/pb_migrations --hooksDir=/pb_hooks"
if [ -n "$POCKETBASE_ADMIN_EMAIL" ] && [ -n "$POCKETBASE_ADMIN_PASSWORD" ]; then
  # Applique les migrations puis crée / met à jour le superutilisateur de l'API
  pocketbase superuser upsert "$POCKETBASE_ADMIN_EMAIL" "$POCKETBASE_ADMIN_PASSWORD" $ARGS
fi
exec pocketbase serve --http=0.0.0.0:8090 $ARGS
