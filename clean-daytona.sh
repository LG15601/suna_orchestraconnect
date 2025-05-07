#!/bin/bash

# Script pour nettoyer les sandboxes Daytona inutilisées
# Ce script doit être exécuté avec les variables d'environnement DAYTONA_API_KEY et DAYTONA_SERVER_URL définies

echo "Nettoyage des sandboxes Daytona inutilisées..."

# Vérifier que les variables d'environnement nécessaires sont définies
if [ -z "$DAYTONA_API_KEY" ] || [ -z "$DAYTONA_SERVER_URL" ]; then
    echo "Erreur: Les variables d'environnement DAYTONA_API_KEY et DAYTONA_SERVER_URL doivent être définies."
    echo "Vous pouvez les définir en exécutant:"
    echo "export DAYTONA_API_KEY=votre_clé_api"
    echo "export DAYTONA_SERVER_URL=votre_url_serveur"
    exit 1
fi

# Récupérer la liste des sandboxes
echo "Récupération de la liste des sandboxes..."
SANDBOXES=$(curl -s -H "Authorization: Bearer $DAYTONA_API_KEY" "$DAYTONA_SERVER_URL/workspaces")

# Vérifier si la requête a réussi
if [ $? -ne 0 ]; then
    echo "Erreur: Impossible de récupérer la liste des sandboxes."
    exit 1
fi

# Extraire les IDs des sandboxes
SANDBOX_IDS=$(echo $SANDBOXES | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Compter le nombre de sandboxes
SANDBOX_COUNT=$(echo "$SANDBOX_IDS" | wc -l)
echo "Nombre de sandboxes trouvées: $SANDBOX_COUNT"

# Demander confirmation avant de supprimer
echo "Voulez-vous supprimer toutes ces sandboxes? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "Opération annulée."
    exit 0
fi

# Supprimer chaque sandbox
for ID in $SANDBOX_IDS; do
    echo "Suppression de la sandbox $ID..."
    curl -s -X DELETE -H "Authorization: Bearer $DAYTONA_API_KEY" "$DAYTONA_SERVER_URL/workspaces/$ID"
    if [ $? -eq 0 ]; then
        echo "Sandbox $ID supprimée avec succès."
    else
        echo "Erreur lors de la suppression de la sandbox $ID."
    fi
done

echo "Nettoyage terminé."
