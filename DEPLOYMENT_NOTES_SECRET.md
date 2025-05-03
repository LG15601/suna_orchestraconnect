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
MODEL_TO_USE=anthropic/claude-3-7-sonnet-latest

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

Le projet utilise Claude 3.7 Sonnet comme modèle principal :
- Fournisseur : Anthropic
- Modèle : claude-3-7-sonnet-latest
- Clé API : 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

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

Des problèmes de quotas Daytona ont été rencontrés, ce qui a nécessité la suppression de certains espaces de travail Daytona.

## Apprentissages et bonnes pratiques

1. **Gestion des clés API** : Stocker les clés API de manière sécurisée et s'assurer qu'elles sont correctement chargées par l'application.

2. **Configuration des ports** : S'assurer que les ports configurés dans les fichiers .env correspondent aux ports exposés dans le docker-compose.yaml.

3. **Gestion des quotas Daytona** : Surveiller régulièrement les quotas Daytona et nettoyer les espaces de travail inutilisés pour éviter les problèmes de quotas.

4. **Séparation des projets** : Maintenir une séparation claire entre le projet SUNA original (port 3002) et le projet OrchestraConnect (port 3003) pour éviter les conflits.

5. **Personnalisation du design** : Le design peut être personnalisé pour OrchestraConnect tout en respectant la structure du projet SUNA.

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

## Conclusion

Le déploiement de l'agent OrchestraConnect a été réalisé avec succès en clonant le projet SUNA et en le configurant pour répondre aux besoins spécifiques d'OrchestraConnect. Quelques problèmes ont été rencontrés, notamment avec les clés API et les quotas Daytona, mais ils ont été résolus. Pour les déploiements futurs, il est recommandé d'automatiser le processus et d'ajouter des outils de monitoring et de sauvegarde.
