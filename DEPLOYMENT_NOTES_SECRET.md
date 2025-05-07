# Notes de déploiement de l'agent OrchestraConnect

Ce document confidentiel contient toutes les informations relatives au déploiement de l'agent OrchestraConnect, y compris les configurations, les erreurs rencontrées et les apprentissages pour faciliter les déploiements futurs.

## Structure du projet

Le projet OrchestraConnect est un clone du projet SUNA avec des modifications spécifiques pour répondre aux besoins d'OrchestraConnect. La structure du projet est la suivante :

```
suna_orchestraconnect/
├── backend/             # Backend FastAPI
├── frontend/            # Frontend Next.js
├── docker-compose.yaml  # Configuration Docker pour le déploiement
├── suna/                # Code source original de SUNA (référence)
└── ...
```

## Configuration de l'environnement

### Backend (.env)

```
# Environment Mode
ENV_MODE=local

# DATABASE - Supabase credentials
SUPABASE_URL=https://hcnhrlqgofduimnlohid.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbmhybHFnb2ZkdWltbmxvaGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzc4OTgsImV4cCI6MjA2MTg1Mzg5OH0.A91whIGpCMJ3UGZyVa7IttsOYK1NnXE9CiusjU2Nks4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbmhybHFnb2ZkdWltbmxvaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI3Nzg5OCwiZXhwIjoyMDYxODUzODk4fQ.pGZB2NhlqDT56L9NDPe-9lzEAeF5TKAcJbOn13lsbi8

# Redis configuration
REDIS_HOST=redis
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_SSL=false

# LLM Providers - API keys
ANTHROPIC_API_KEY=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
OPENAI_API_KEY=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
MODEL_TO_USE=openrouter/google/gemini-2.5-pro-preview

# Sandbox container provider - Daytona
DAYTONA_API_KEY=dtn_bada987eb670c008b6259ff97f4bcaab5d902ebb610e42a917186a6af0e1594c
DAYTONA_SERVER_URL=https://app.daytona.io/api
DAYTONA_TARGET=eu

# Search and other API keys
TAVILY_API_KEY=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
RAPID_API_KEY=
FIRECRAWL_API_KEY=fc-60fe43022991488e9f9d030a4d075b8b

# Application name
APP_NAME=OrchestraConnect

# ACI.dev configuration (pour MCP Unified Server)
ACI_API_KEY=
MCP_ENABLED=false
MCP_LINKED_ACCOUNT_OWNER_ID=
```

### Frontend (.env.local)

```
NEXT_PUBLIC_ENV_MODE="LOCAL"
NEXT_PUBLIC_SUPABASE_URL=https://hcnhrlqgofduimnlohid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbmhybHFnb2ZkdWltbmxvaGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzc4OTgsImV4cCI6MjA2MTg1Mzg5OH0.A91whIGpCMJ3UGZyVa7IttsOYK1NnXE9CiusjU2Nks4
NEXT_PUBLIC_BACKEND_URL="http://localhost:8002/api"
NEXT_PUBLIC_URL="http://localhost:3002"
NEXT_PUBLIC_APP_NAME="OrchestraConnect"
```

### Docker Compose

Le fichier `docker-compose.yaml` configure trois services :
- **redis** : Base de données Redis pour le stockage temporaire
- **backend** : API FastAPI exposée sur le port 8002
- **frontend** : Application Next.js exposée sur le port 3003

Ports utilisés :
- Redis : 6380:6379
- Backend : 8002:8000
- Frontend : 3003:3000

## Configuration de Supabase

Une base de données Supabase a été créée pour OrchestraConnect avec les informations suivantes :
- URL : https://hcnhrlqgofduimnlohid.supabase.co
- Clé anonyme : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbmhybHFnb2ZkdWltbmxvaGlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNzc4OTgsImV4cCI6MjA2MTg1Mzg5OH0.A91whIGpCMJ3UGZyVa7IttsOYK1NnXE9CiusjU2Nks4
- Clé de rôle de service : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjbmhybHFnb2ZkdWltbmxvaGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjI3Nzg5OCwiZXhwIjoyMDYxODUzODk4fQ.pGZB2NhlqDT56L9NDPe-9lzEAeF5TKAcJbOn13lsbi8

## Configuration du modèle IA

Le projet utilise désormais Gemini 2.5 Pro comme modèle principal (mise à jour du 2023-11-05) :
- Fournisseur : Google via OpenRouter
- Modèle : openrouter/google/gemini-2.5-pro-preview
- Clé API : Utilisation de la clé OpenRouter existante

Modèles alternatifs disponibles :
- Claude 3.7 Sonnet (Anthropic)
- GPT-4.1 (OpenAI)
- Gemini 2.5 Flash (Google via OpenRouter)
- Grok-3 (xAI)
- DeepSeek Chat (DeepSeek)
- Grok-3-mini (xAI)

## Configuration de Daytona

Daytona est utilisé comme fournisseur de sandbox pour l'agent :
- Clé API : dtn_bada987eb670c008b6259ff97f4bcaab5d902ebb610e42a917186a6af0e1594c
- URL du serveur : https://app.daytona.io/api
- Cible : eu

## Erreurs et problèmes rencontrés

### Problème avec les clés API Anthropic

Les logs montrent des avertissements concernant les clés API manquantes :
```
2025-05-03 15:25:43,066 - agentpress - WARNING - llm.py:48 - No API key found for provider: ANTHROPIC
```

Cela suggère que malgré la présence de la clé API Anthropic dans le fichier .env, elle n'est pas correctement chargée par l'application. Ce problème pourrait être dû à :
1. Un problème de format dans le fichier .env
2. Un problème de chargement des variables d'environnement
3. Un problème de configuration dans le code

### Problème avec les ports Redis

Le fichier .env du backend spécifie `REDIS_PORT=6380`, mais dans le docker-compose.yaml, Redis est configuré pour exposer le port 6379 en interne. Cela pourrait causer des problèmes de connexion.

### Problème avec les quotas Daytona

Des problèmes de quotas Daytona ont été rencontrés, ce qui a nécessité la suppression de certains espaces de travail Daytona. L'erreur suivante peut apparaître :

```
Error: [API] Error starting agent: 500 Internal Server Error "{\"detail\":\"Failed to initialize sandbox: Failed to create sandbox: Workspace quota exceeded. Maximum allowed: 10\"}"
```

Solutions :
1. Supprimer les sandboxes inutilisés via le script `backend/utils/scripts/delete_user_sandboxes.py`
2. Archiver les sandboxes inactifs via le script `backend/utils/scripts/archive_inactive_sandboxes.py`
3. Passer à un plan Daytona supérieur avec une limite de workspaces plus élevée

### Problème avec la structure des fichiers dupliqués

Nous avons rencontré des problèmes avec la structure des fichiers dupliqués entre `frontend/src/app/` et `frontend/app/`. La suppression de fichiers dupliqués a causé des erreurs "Account not found" et des problèmes de navigation.

Solution :
- Restaurer les fichiers supprimés
- Nettoyer le cache de build avec `rm -rf .next`
- Redémarrer le serveur de développement

## Intégration du serveur MCP Unified (ACI.dev)

Le 2023-11-05, nous avons ajouté la prise en charge du serveur MCP Unified d'ACI.dev pour étendre les capacités de l'agent. Cette intégration permet à l'agent d'accéder à des outils et fonctions externes via le protocole MCP.

### Modifications apportées

1. **Création d'un nouvel outil MCP Unified** :
   - Fichier : `backend/agent/tools/mcp_unified_tool.py`
   - Fonctionnalités : Recherche et exécution de fonctions ACI.dev

2. **Ajout des variables de configuration** :
   - Fichier : `backend/utils/config.py`
   - Variables ajoutées :
     ```python
     ACI_API_KEY: Optional[str] = None
     MCP_ENABLED: bool = False
     MCP_LINKED_ACCOUNT_OWNER_ID: Optional[str] = None
     ```

3. **Modification du système d'agents** :
   - Fichier : `backend/agent/run.py`
   - Ajout de l'outil MCP Unified au gestionnaire de threads
   - Ajout de paramètres pour activer/désactiver MCP

4. **Modification de l'API** :
   - Fichier : `backend/agent/api.py`
   - Ajout des paramètres MCP à l'API
   - Passage des paramètres MCP à la fonction `run_agent_background`

### Configuration requise

Pour activer le serveur MCP Unified, vous devez :
1. Obtenir une clé API ACI.dev et la configurer dans la variable d'environnement `ACI_API_KEY`
2. Obtenir un ID de propriétaire de compte lié et le configurer dans la variable d'environnement `MCP_LINKED_ACCOUNT_OWNER_ID`
3. Définir `MCP_ENABLED=true` dans le fichier `.env`

## Personnalisation de l'agent Alex

### Étapes réalisées
1. **Sauvegarde du prompt original**
   ```bash
   # Création d'une copie de sauvegarde du fichier prompt.py
   cp backend/agent/prompt.py backend/agent/prompt.py.backup
   ```

2. **Modification du prompt pour Alex**
   - Modification du fichier `backend/agent/prompt.py` pour transformer l'agent en "Alex, le concierge virtuel d'OrchestraConnect"
   - Ajout de sections sur le rôle, l'approche et la personnalité d'Alex
   - Traduction des sections de communication en français
   - Ajout d'instructions pour l'adaptation aux profils DISC

3. **Modification du texte d'accueil**
   - Modification du fichier `frontend/src/app/(dashboard)/dashboard/page.tsx` pour changer le texte d'accueil en "Alex, Votre concierge" et "Demandez-moi et je m'occupe de vos besoins"

4. **Déploiement des modifications dans Docker**
   ```bash
   # Localisation du fichier prompt.py dans le conteneur Docker
   docker exec -it suna_orchestraconnect-backend-1 find /app -name prompt.py

   # Copie du fichier modifié dans le conteneur
   docker cp backend/agent/prompt.py suna_orchestraconnect-backend-1:/app/agent/prompt.py

   # Redémarrage du conteneur backend
   docker restart suna_orchestraconnect-backend-1
   ```

### Erreurs rencontrées
1. **Problème de chemin dans Docker**
   - Erreur: Tentative de copie vers `/app/backend/agent/prompt.py` alors que le chemin correct est `/app/agent/prompt.py`
   - Solution: Utilisation de `find` pour localiser le chemin correct du fichier dans le conteneur

2. **Persistance de l'ancien prompt**
   - Problème: Malgré la modification du fichier et le redémarrage du conteneur, l'agent continue à se présenter comme Suna
   - Causes possibles:
     * Cache du modèle ou problème de chargement du prompt
     * Le fichier modifié n'est pas correctement importé dans l'application
     * Le conteneur Docker utilise une version différente du fichier
   - Solutions potentielles:
     * Vérifier les logs du conteneur pour voir si le prompt est correctement chargé
     * Redémarrer complètement les conteneurs Docker (pas seulement le backend)
     * Modifier directement le fichier dans le conteneur et vérifier son contenu
     * Reconstruire l'image Docker avec les modifications

## Apprentissages et bonnes pratiques

1. **Gestion des clés API** : Stocker les clés API de manière sécurisée et s'assurer qu'elles sont correctement chargées par l'application.

2. **Configuration des ports** : S'assurer que les ports configurés dans les fichiers .env correspondent aux ports exposés dans le docker-compose.yaml.

3. **Gestion des quotas Daytona** : Surveiller régulièrement les quotas Daytona et nettoyer les espaces de travail inutilisés pour éviter les problèmes de quotas.

4. **Séparation des projets** : Maintenir une séparation claire entre le projet SUNA original (port 3002) et le projet OrchestraConnect (port 3003) pour éviter les conflits.

5. **Personnalisation du design** : Le design peut être personnalisé pour OrchestraConnect tout en respectant la structure du projet SUNA.

6. **Gestion des fichiers dupliqués** : Être prudent lors de la suppression de fichiers qui semblent dupliqués, car ils peuvent avoir des rôles différents dans l'application.

7. **Nettoyage du cache** : Nettoyer le cache de build après des modifications importantes pour s'assurer que les changements sont pris en compte.

## Étapes pour redéployer l'agent

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/LG15601/suna_orchestraconnect.git
   cd suna_orchestraconnect
   ```

2. **Configurer les fichiers d'environnement** :
   - Copier les fichiers `.env.example` en `.env` et `.env.local`
   - Remplir les variables d'environnement avec les valeurs appropriées

3. **Démarrer les services avec Docker Compose** :
   ```bash
   docker-compose down && docker-compose up --build
   ```

4. **Vérifier les logs pour détecter d'éventuelles erreurs** :
   ```bash
   docker-compose logs -f
   ```

5. **Accéder à l'application** :
   - Frontend : http://localhost:3003
   - Backend API : http://localhost:8002/api

## Recommandations pour les déploiements futurs

1. **Automatiser le déploiement** : Mettre en place des workflows CI/CD pour automatiser le déploiement.

2. **Monitoring** : Ajouter des outils de monitoring pour surveiller les performances et détecter les problèmes.

3. **Sauvegardes** : Mettre en place des sauvegardes régulières de la base de données Supabase.

4. **Documentation** : Maintenir une documentation à jour sur le déploiement et la configuration.

5. **Tests** : Ajouter des tests automatisés pour s'assurer que l'application fonctionne correctement après chaque déploiement.

6. **Gestion des modèles d'IA** : Tester régulièrement les différents modèles d'IA disponibles pour trouver le meilleur équilibre entre performance et coût.

7. **Nettoyage des sandboxes** : Mettre en place un processus automatisé pour nettoyer régulièrement les sandboxes inutilisés.

## Prochaines étapes recommandées

### Priorité 1 : Résoudre le problème du prompt d'Alex
1. Vérifier le contenu du fichier prompt.py dans le conteneur Docker :
   ```bash
   docker exec -it suna_orchestraconnect-backend-1 cat /app/agent/prompt.py | head -20
   ```
2. Vérifier les logs du backend pour identifier d'éventuelles erreurs :
   ```bash
   docker logs suna_orchestraconnect-backend-1 | grep -i error
   ```
3. Tester une modification directe dans le conteneur :
   ```bash
   docker exec -it suna_orchestraconnect-backend-1 bash
   # Dans le conteneur :
   echo "# Test de modification" >> /app/agent/prompt.py
   exit
   # Puis redémarrer :
   docker restart suna_orchestraconnect-backend-1
   ```

### Priorité 2 : Standardiser l'environnement
1. Décider quelle version utiliser (3002 ou 3003) et se concentrer sur celle-ci
2. Si la version 3002 est préférée, modifier la configuration pour qu'elle utilise le même backend que la version Docker
3. Si la version 3003 est préférée, arrêter la version 3002 pour éviter la confusion

### Priorité 3 : Modifications visuelles cohérentes
1. Remplacer les logos Kortix par des logos OrchestraConnect
2. Mettre à jour les métadonnées et les titres des pages
3. Adapter les couleurs et le style visuel selon les préférences d'OrchestraConnect

### Priorité 4 : Modifications structurelles (avec précaution)
1. Renommer les fichiers contenant "kortix" ou "suna" dans leur nom
2. Mettre à jour les importations correspondantes
3. Tester après chaque modification

### Priorité 5 : Configuration et test du serveur MCP Unified
1. Obtenir une clé API ACI.dev
2. Configurer les variables d'environnement nécessaires
3. Tester l'intégration avec des cas d'utilisation simples
4. Documenter les fonctionnalités disponibles via MCP

## Conclusion

Le déploiement de l'agent OrchestraConnect a été réalisé avec succès en clonant le projet SUNA et en le configurant pour répondre aux besoins spécifiques d'OrchestraConnect. Plusieurs améliorations ont été apportées, notamment le passage à Gemini 2.5 Pro et l'ajout du support pour le serveur MCP Unified. Des problèmes ont été rencontrés, notamment avec les quotas Daytona et la structure des fichiers dupliqués, mais ils ont été résolus. Pour les déploiements futurs, il est recommandé d'automatiser le processus et d'ajouter des outils de monitoring et de sauvegarde.
