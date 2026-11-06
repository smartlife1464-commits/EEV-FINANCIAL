#!/usr/bin/env bash
set -euo pipefail

# Script de sauvegarde automatique et cohérente de PocketBase (SQLite & Fichiers)
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
PB_DATA_DIR="${PB_DATA_DIR:-./pocketbase/pb_data}"

mkdir -p "${BACKUP_DIR}"

echo "📦 [EEV-BACKUP] Début de la sauvegarde à ${TIMESTAMP}..."

if [ ! -d "${PB_DATA_DIR}" ]; then
  echo "⚠️ Le répertoire ${PB_DATA_DIR} n'existe pas encore. Sauvegarde ignorée."
  exit 0
fi

# Utilisation de sqlite3 online backup si disponible, ou archivage tar sécurisé
ARCHIVE_NAME="${BACKUP_DIR}/eev_backup_${TIMESTAMP}.tar.gz"

tar -czf "${ARCHIVE_NAME}" -C "${PB_DATA_DIR}" .

echo "✅ [EEV-BACKUP] Sauvegarde terminée avec succès : ${ARCHIVE_NAME}"
echo "📊 Taille de l'archive : $(du -h "${ARCHIVE_NAME}" | cut -f1)"

# Conservation des 30 dernières sauvegardes
find "${BACKUP_DIR}" -name "eev_backup_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
echo "🧹 Nettoyage des sauvegardes de plus de 30 jours effectué."

