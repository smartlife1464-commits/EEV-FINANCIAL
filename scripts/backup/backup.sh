#!/usr/bin/env bash
set -euo pipefail

# Sauvegarde cohérente de PocketBase (bases SQLite + fichiers téléversés).
# Les bases sont copiées avec l'API « online backup » de SQLite (aucune corruption même si
# PocketBase est en cours d'écriture) ; à défaut de sqlite3, archivage simple du dossier.
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/pb_data}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"
echo "📦 [EEV-BACKUP] Début de la sauvegarde à ${TIMESTAMP}..."

if [ ! -d "${PB_DATA_DIR}" ]; then
  echo "⚠️ Le répertoire ${PB_DATA_DIR} n'existe pas encore. Sauvegarde ignorée."
  exit 0
fi

ARCHIVE_NAME="${BACKUP_DIR}/eev_backup_${TIMESTAMP}.tar.gz"
STAGING="$(mktemp -d)"
trap 'rm -rf "${STAGING}"' EXIT

if command -v sqlite3 >/dev/null 2>&1; then
  for db in data.db auxiliary.db; do
    if [ -f "${PB_DATA_DIR}/${db}" ]; then
      sqlite3 "${PB_DATA_DIR}/${db}" ".backup '${STAGING}/${db}'"
    fi
  done
  [ -d "${PB_DATA_DIR}/storage" ] && cp -R "${PB_DATA_DIR}/storage" "${STAGING}/storage"
  tar -czf "${ARCHIVE_NAME}" -C "${STAGING}" .
else
  echo "ℹ️ sqlite3 absent : archivage direct du dossier (arrêter PocketBase est recommandé)."
  tar -czf "${ARCHIVE_NAME}" -C "${PB_DATA_DIR}" --exclude='./backups' .
fi

echo "✅ [EEV-BACKUP] Sauvegarde terminée : ${ARCHIVE_NAME} ($(du -h "${ARCHIVE_NAME}" | cut -f1))"

find "${BACKUP_DIR}" -name "eev_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
echo "🧹 Sauvegardes de plus de ${RETENTION_DAYS} jours supprimées."
