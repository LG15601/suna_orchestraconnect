#!/bin/bash

# Arrêter tous les processus Node.js
echo "Arrêt de tous les processus Node.js..."
pkill -f node || true

# Nettoyer le cache de Next.js
echo "Nettoyage du cache de Next.js..."
rm -rf frontend/.next || true

# Démarrer l'application avec une configuration minimale
echo "Démarrage de l'application avec une configuration minimale..."
cd frontend && NODE_OPTIONS="--max-old-space-size=4096" PORT=3002 npm run dev
