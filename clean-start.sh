#!/bin/bash

# Arrêter tous les processus Node.js
echo "Arrêt de tous les processus Node.js..."
pkill -f node || true

# Arrêter tous les processus sur les ports 3002, 3003 et 3004
echo "Arrêt des processus sur les ports 3002, 3003 et 3004..."
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
lsof -ti :3003 | xargs kill -9 2>/dev/null || true
lsof -ti :3004 | xargs kill -9 2>/dev/null || true

# Nettoyer le cache de Next.js
echo "Nettoyage du cache de Next.js..."
rm -rf frontend/.next || true

# Démarrer l'application en mode développement
echo "Démarrage de l'application en mode développement..."
cd frontend && PORT=3002 npm run dev
