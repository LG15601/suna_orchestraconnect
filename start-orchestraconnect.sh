#!/bin/bash

# Script de démarrage pour OrchestraConnect
# Ce script arrête tous les processus existants, nettoie le cache et démarre l'application

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Démarrage d'OrchestraConnect ===${NC}"

# Arrêter tous les processus Node.js
echo -e "${YELLOW}Arrêt de tous les processus Node.js...${NC}"
pkill -f node || true

# Arrêter tous les processus Python
echo -e "${YELLOW}Arrêt de tous les processus Python...${NC}"
pkill -f python || true

# Arrêter tous les processus sur les ports 3002, 3003 et 3004
echo -e "${YELLOW}Arrêt des processus sur les ports 3002, 3003 et 3004...${NC}"
lsof -ti :3002 | xargs kill -9 2>/dev/null || true
lsof -ti :3003 | xargs kill -9 2>/dev/null || true
lsof -ti :3004 | xargs kill -9 2>/dev/null || true

# Nettoyer le cache de Next.js
echo -e "${YELLOW}Nettoyage du cache de Next.js...${NC}"
rm -rf frontend/.next || true

# Démarrer le backend en arrière-plan
echo -e "${YELLOW}Démarrage du backend...${NC}"
cd backend && python -m main &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
echo -e "${YELLOW}Attente du démarrage du backend...${NC}"
sleep 5

# Démarrer le frontend
echo -e "${YELLOW}Démarrage du frontend...${NC}"
cd frontend && PORT=3002 npm run dev &
FRONTEND_PID=$!
cd ..

# Afficher les informations de démarrage
echo -e "${GREEN}=== OrchestraConnect démarré ===${NC}"
echo -e "${GREEN}Backend PID: ${BACKEND_PID}${NC}"
echo -e "${GREEN}Frontend PID: ${FRONTEND_PID}${NC}"
echo -e "${GREEN}Frontend URL: http://localhost:3002${NC}"
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter l'application${NC}"

# Attendre que l'utilisateur appuie sur Ctrl+C
trap "echo -e '${RED}Arrêt d'OrchestraConnect...${NC}'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
