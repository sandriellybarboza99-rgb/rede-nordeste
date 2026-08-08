#!/usr/bin/env bash
# ============================================================
#  Rede Nordeste - Backend
#  Compila o projeto e gera o JAR em backend/target/
# ============================================================

set -e
cd "$(dirname "$0")"

echo
echo "[Rede Nordeste] Compilando backend..."
echo

./mvnw clean package -DskipTests

echo
echo "[Rede Nordeste] Build OK. JAR em backend/target/"
