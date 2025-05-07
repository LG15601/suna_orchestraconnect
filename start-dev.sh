#!/bin/bash

# Arrêter tous les processus en cours d'exécution sur les ports 3002, 3003 et 3004
echo "Arrêt des processus en cours d'exécution..."
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
lsof -ti :3003 | xargs kill -9 2>/dev/null || true
lsof -ti :3004 | xargs kill -9 2>/dev/null || true

# Arrêter les conteneurs Docker
echo "Arrêt des conteneurs Docker..."
docker-compose down 2>/dev/null || true

# Démarrer l'application en mode développement
echo "Démarrage de l'application en mode développement..."
cd frontend && PORT=3002 npm run dev
