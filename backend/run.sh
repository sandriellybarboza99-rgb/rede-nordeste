#!/usr/bin/env bash
# ============================================================
#  Rede Nordeste - Backend
#  Sobe o Spring Boot em modo dev.
#  Uso: dentro da pasta backend/, execute "./run.sh"
# ============================================================

set -e
cd "$(dirname "$0")"

echo
echo "[Rede Nordeste] Iniciando backend Spring Boot..."
echo "[Rede Nordeste] URL: http://localhost:8080"
echo

./mvnw spring-boot:run
