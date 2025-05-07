# Documentation Secrète de Déploiement - OrchestraConnect

## Contexte
Ce document contient les étapes, erreurs et solutions pour le déploiement et la personnalisation d'OrchestraConnect, basé sur le projet SUNA.

## Structure du projet
- Frontend: Accessible sur le port 3002 (développement) et 3003 (Docker)
- Backend: Accessible sur le port 8002
- Base de données: Supabase

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

3. **Différence entre les versions**
   - Problème: Deux versions du site en cours d'exécution (port 3002 et 3003) avec des comportements différents
   - Cause: La version sur le port 3002 est lancée manuellement, tandis que la version sur le port 3003 est lancée via Docker
   - Solution: S'assurer que les deux versions utilisent le même backend ou standardiser sur une seule version

4. **Problèmes de configuration du modèle d'IA**
   - Problème: Le modèle d'IA pourrait ne pas utiliser le prompt modifié
   - Causes possibles:
     * Le prompt est ignoré par le modèle
     * La configuration du modèle est définie ailleurs
     * Le modèle utilise un cache de prompt
   - Solutions potentielles:
     * Vérifier les fichiers de configuration du modèle d'IA
     * Rechercher d'autres fichiers qui pourraient définir le comportement de l'agent
     * Vérifier si le modèle Claude est correctement configuré

## Problèmes à résoudre
1. S'assurer que le prompt d'Alex est correctement chargé dans les deux versions
2. Vérifier si d'autres fichiers doivent être modifiés pour une cohérence complète
3. Assurer la stabilité du système après les modifications

### Références à Kortix et Suna restantes
Plusieurs fichiers contiennent encore des références à "Kortix" et "Suna" qui pourraient être modifiés pour une cohérence complète :

1. **Composants de l'interface utilisateur**
   - `frontend/src/components/sidebar/kortix-logo.tsx` - Le nom du fichier et certaines références internes
   - `frontend/src/components/sidebar/kortix-enterprise-modal.tsx` - Le nom du fichier et des références internes
   - `frontend/src/components/sidebar/sidebar-left.tsx` - Importation de KortixLogo
   - `frontend/src/components/home/sections/footer-section.tsx` - Références à "Kortix Logo" et liens GitHub/Twitter
   - `frontend/src/components/home/sections/navbar.tsx` - Références à "Kortix Logo" et "Suna"

2. **Ressources statiques**
   - `frontend/public/kortix-logo.svg` - Le nom du fichier et le contenu SVG
   - `frontend/public/kortix-logo-white.svg` - Le nom du fichier et le contenu SVG

3. **Configuration du site**
   - Certaines métadonnées dans `frontend/src/app/layout.tsx` font référence à OrchestraConnect mais d'autres pourraient nécessiter une mise à jour

### Approche recommandée pour les modifications restantes
Pour éviter de casser le système, il est recommandé de :

1. **Faire une sauvegarde complète** avant toute modification structurelle (renommage de fichiers)
2. **Modifier un composant à la fois** et tester après chaque modification
3. **Prioriser les changements visibles** pour l'utilisateur final
4. **Documenter chaque modification** dans ce fichier

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

## Recommandations pour les futurs déploiements
1. Toujours faire une sauvegarde avant de modifier des fichiers critiques
2. Tester les modifications sur un environnement de développement avant de les déployer en production
3. Documenter toutes les étapes et erreurs pour faciliter les futurs déploiements
4. Utiliser des variables d'environnement pour les configurations spécifiques à l'environnement
5. Créer un script de déploiement automatisé pour standardiser le processus
6. Mettre en place un système de versionnage pour faciliter les rollbacks en cas de problème
