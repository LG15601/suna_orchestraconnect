# Configuration de la Conciergerie OrchestraConnect

Ce document contient les instructions et le code nécessaires pour intégrer la fonctionnalité de Conciergerie avec l'agent intermédiaire dans OrchestraConnect.

## Structure de base de données

Voici le script SQL pour créer les tables nécessaires dans Supabase :

```sql
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create missions table
CREATE TABLE public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    type TEXT NOT NULL,
    assigned_agent_id UUID,
    results JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add comment to the table
COMMENT ON TABLE public.missions IS 'Stores missions created by users for the OrchestraConnect agent';

-- Add comments to the columns
COMMENT ON COLUMN public.missions.id IS 'Unique identifier for the mission';
COMMENT ON COLUMN public.missions.title IS 'Title of the mission';
COMMENT ON COLUMN public.missions.description IS 'Detailed description of the mission';
COMMENT ON COLUMN public.missions.status IS 'Current status of the mission (pending, in-progress, completed, failed)';
COMMENT ON COLUMN public.missions.account_id IS 'Reference to the account that owns this mission';
COMMENT ON COLUMN public.missions.created_at IS 'When the mission was created';
COMMENT ON COLUMN public.missions.updated_at IS 'When the mission was last updated';
COMMENT ON COLUMN public.missions.due_date IS 'Optional deadline for the mission';
COMMENT ON COLUMN public.missions.type IS 'Type of mission (prospection, analyse, veille, etc.)';
COMMENT ON COLUMN public.missions.assigned_agent_id IS 'Optional reference to the agent assigned to this mission';
COMMENT ON COLUMN public.missions.results IS 'JSON data containing the results of the mission';
COMMENT ON COLUMN public.missions.metadata IS 'Additional metadata for the mission';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_missions_account_id ON missions(account_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_created_at ON missions(created_at);
CREATE INDEX idx_missions_type ON missions(type);

-- Create mission_threads table to link missions with threads
CREATE TABLE public.mission_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(mission_id, thread_id)
);

-- Add comment to the table
COMMENT ON TABLE public.mission_threads IS 'Links missions to conversation threads';

-- Create trigger for updated_at
CREATE TRIGGER update_mission_threads_updated_at
    BEFORE UPDATE ON mission_threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_mission_threads_mission_id ON mission_threads(mission_id);
CREATE INDEX idx_mission_threads_thread_id ON mission_threads(thread_id);

-- Create mission_activities table to track activities related to missions
CREATE TABLE public.mission_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add comment to the table
COMMENT ON TABLE public.mission_activities IS 'Tracks activities related to missions';

-- Create indexes for better query performance
CREATE INDEX idx_mission_activities_mission_id ON mission_activities(mission_id);
CREATE INDEX idx_mission_activities_account_id ON mission_activities(account_id);
CREATE INDEX idx_mission_activities_created_at ON mission_activities(created_at);
```

## Fichiers à créer

### 1. Composant MissionPlannerDialog

Ce composant est l'agent intermédiaire qui guide l'utilisateur dans la création d'une mission.

Chemin : `frontend/src/components/mission-planner/mission-planner-dialog.tsx`

### 2. Hook useMissions

Ce hook permet d'interagir avec l'API des missions.

Chemin : `frontend/src/hooks/use-missions.ts`

### 3. API Routes

Créer les routes API suivantes :

- `frontend/src/app/api/missions/route.ts`
- `frontend/src/app/api/missions/[id]/route.ts`
- `frontend/src/app/api/missions/[id]/threads/route.ts`

### 4. Page Conciergerie

Créer une page Conciergerie qui intègre l'agent intermédiaire.

Chemin : `frontend/src/app/conciergerie/page.tsx`
Chemin : `frontend/src/app/conciergerie/layout.tsx`

## Intégration dans la navigation

Mettre à jour la barre latérale pour inclure un lien vers la page Conciergerie.

Chemin : `frontend/src/components/sidebar/nav-missions.tsx`

## Prompt de l'agent intermédiaire

L'agent intermédiaire utilise un prompt spécifique pour guider l'utilisateur dans la création d'une mission. Voici les étapes du processus :

1. Demander l'objectif principal de la mission
2. Demander le type de mission (prospection, analyse, veille, etc.)
3. Demander les objectifs spécifiques
4. Demander les contraintes et la date limite
5. Présenter un récapitulatif pour confirmation
6. Créer la mission dans la base de données
7. Proposer de commencer à travailler sur la mission avec le super agent

## Prompt du super agent

Lorsqu'une mission est transmise au super agent, celui-ci reçoit un prompt enrichi avec les détails de la mission :

```
Tu es Alex, le concierge d'OrchestraConnect. Tu travailles sur la mission suivante:

Titre: [Titre de la mission]
Description: [Description de la mission]
Type: [Type de mission]

Objectifs:
- [Objectif 1]
- [Objectif 2]
...

Contraintes:
- [Contrainte 1]
- [Contrainte 2]
...

Ton objectif est d'aider l'utilisateur à accomplir cette mission. Commence par te présenter et demander comment tu peux aider avec cette mission spécifique.
```

## Instructions d'intégration

1. Exécuter le script SQL dans la console Supabase pour créer les tables nécessaires
2. Ajouter les fichiers de composants, hooks et API routes au projet
3. Mettre à jour la navigation pour inclure un lien vers la page Conciergerie
4. Redémarrer le serveur pour prendre en compte les modifications

## Notes importantes

- L'agent intermédiaire et le super agent sont deux agents distincts, même s'ils portent le même nom (Alex)
- L'agent intermédiaire est intégré dans la page Conciergerie et aide à définir les missions
- Le super agent est l'agent existant qui exécute les missions
- Les missions créées par l'agent intermédiaire sont enregistrées dans la base de données et peuvent être transmises au super agent
