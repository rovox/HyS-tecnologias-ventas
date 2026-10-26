#!/usr/bin/env bash
# Recreates the production database on Hostinger Cloud Startup from config/hostinger-db.local.sql (made by
# `node apps/api/scripts/build-hostinger-sql.mjs --users`), over SSH (`ssh hostinger-hs`), in one session:
#   1. reads DATABASE_URL from the API site's env on the server (hPanel stores it there); never printed or copied
#   2. full backup with mysqldump to ~/backups/<db>-<date>.sql.gz on the server
#   3. drops every table of that database and imports the SQL (same database and user: DATABASE_URL does not change)
#   4. checks tables, users and migration history, and restarts the API (Passenger restart.txt)
# It deletes all data of that database: it refuses to run without --yes.
#
#   scripts/hostinger-recreate-db.sh --yes

set -euo pipefail
SQL=config/hostinger-db.local.sql
HOST=hostinger-hs
SITE=lime-chamois-337700.hostingersite.com

[ "${1:-}" = "--yes" ] || { echo "Borra todos los datos de la base de producción (con respaldo previo). Para confirmar: $0 --yes"; exit 1; }
[ -f "$SQL" ] || { echo "Falta $SQL: node apps/api/scripts/build-hostinger-sql.mjs --users"; exit 1; }
grep -q "INSERT INTO \`users\`" "$SQL" || { echo "$SQL no tiene usuarios: genera con --users"; exit 1; }

scp -q "$SQL" "$HOST:hs-erp-db.sql"
ssh "$HOST" "SITE=$SITE bash -s" <<'REMOTE'
set -euo pipefail
umask 077
CNF=$(mktemp)
trap 'rm -f "$CNF" ~/hs-erp-db.sql' EXIT
ENV_FILE=~/domains/$SITE/hbuilds/config/.env
URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
[ -n "$URL" ] || { echo "No hay DATABASE_URL en el entorno del sitio"; exit 1; }
DB=$(python3 - "$URL" "$CNF" <<'PY'
import sys, urllib.parse as u
p = u.urlparse(sys.argv[1])
with open(sys.argv[2], 'w') as f:
    f.write(f"[client]\nuser={u.unquote(p.username)}\npassword={u.unquote(p.password or '')}\nhost={p.hostname or 'localhost'}\nport={p.port or 3306}\n")
print(p.path.lstrip('/'))
PY
)
SQL_CMD() { mysql --defaults-extra-file="$CNF" "$@"; }
echo "Base: $DB"

mkdir -p ~/backups
BACKUP=~/backups/$DB-$(date +%Y%m%d-%H%M%S).sql.gz
mysqldump --defaults-extra-file="$CNF" --single-transaction --no-tablespaces "$DB" | gzip > "$BACKUP"
echo "Respaldo: $BACKUP ($(du -h "$BACKUP" | cut -f1))"

TABLES=$(SQL_CMD -N -e "SELECT GROUP_CONCAT(CONCAT('\`', table_name, '\`')) FROM information_schema.tables WHERE table_schema = '$DB'")
if [ -n "$TABLES" ] && [ "$TABLES" != "NULL" ]; then
  SQL_CMD "$DB" -e "SET FOREIGN_KEY_CHECKS = 0; DROP TABLE $TABLES; SET FOREIGN_KEY_CHECKS = 1;"
  echo "Tablas anteriores eliminadas"
fi
SQL_CMD "$DB" < ~/hs-erp-db.sql
echo "Importado"
SQL_CMD -N "$DB" -e "SELECT CONCAT('tablas: ', COUNT(*)) FROM information_schema.tables WHERE table_schema = '$DB';
  SELECT CONCAT('usuarios: ', COUNT(*)) FROM users; SELECT CONCAT('migraciones: ', COUNT(*)) FROM _prisma_migrations;
  SELECT CONCAT('sucursales: ', COUNT(*)) FROM sucursales; SELECT CONCAT('cajas: ', COUNT(*)) FROM cash_boxes;"

touch ~/domains/$SITE/hbuilds/current/nodejs/tmp/restart.txt
echo "API reiniciada"
REMOTE

for i in $(seq 1 30); do
  if curl -sf "https://$SITE/api/health/db" | grep -q '"db":true'; then echo "API: base conectada"; exit 0; fi
  sleep 2
done
echo "La API no respondió con db:true; revisar en hPanel"
exit 1
