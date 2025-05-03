import requests
import os
import json
from dotenv import load_dotenv
import time

# Charger les variables d'environnement du backend
load_dotenv('suna/backend/.env')

# Configuration Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY]):
    print("Erreur: Variables d'environnement manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    exit(1)

# Diviser le script SQL en parties plus petites pour éviter les problèmes de taille
part1 = """
-- Create basejump schema
CREATE SCHEMA IF NOT EXISTS basejump;
GRANT USAGE ON SCHEMA basejump to authenticated;
GRANT USAGE ON SCHEMA basejump to service_role;

-- Create invitation type enum
DO
$$
    BEGIN
        -- check it account_role already exists on basejump schema
        IF NOT EXISTS(SELECT 1
                      FROM pg_type t
                               JOIN pg_namespace n ON n.oid = t.typnamespace
                      WHERE t.typname = 'invitation_type'
                        AND n.nspname = 'basejump') THEN
            CREATE TYPE basejump.invitation_type AS ENUM ('one_time', '24_hour');
        end if;
    end;
$$;
"""

part2 = """
-- Create account_role enum
DO
$$
    BEGIN
        IF NOT EXISTS(SELECT 1
                      FROM pg_type t
                               JOIN pg_namespace n ON n.oid = t.typnamespace
                      WHERE t.typname = 'account_role'
                        AND n.nspname = 'basejump') THEN
            CREATE TYPE basejump.account_role AS ENUM ('owner', 'member');
        end if;
    end;
$$;
"""

part3 = """
-- Create basejump config
CREATE TABLE IF NOT EXISTS basejump.config
(
    enable_team_accounts            boolean default true,
    enable_personal_account_billing boolean default true,
    enable_team_account_billing     boolean default true,
    billing_provider                text    default 'stripe'
);

-- create config row
INSERT INTO basejump.config (enable_team_accounts, enable_personal_account_billing, enable_team_account_billing)
VALUES (true, true, true) ON CONFLICT DO NOTHING;

-- enable select on the config table
GRANT SELECT ON basejump.config TO authenticated, service_role;

-- enable RLS on config
ALTER TABLE basejump.config
    ENABLE ROW LEVEL SECURITY;

create policy IF NOT EXISTS "Basejump settings can be read by authenticated users" on basejump.config
    for select
    to authenticated
    using (
    true
    );
"""

part4 = """
-- Create accounts table
CREATE TABLE IF NOT EXISTS basejump.accounts
(
    id                    uuid unique                NOT NULL DEFAULT extensions.uuid_generate_v4(),
    primary_owner_user_id uuid references auth.users not null default auth.uid(),
    name                  text,
    slug                  text unique,
    personal_account      boolean                             default false not null,
    updated_at            timestamp with time zone,
    created_at            timestamp with time zone,
    created_by            uuid references auth.users,
    updated_by            uuid references auth.users,
    private_metadata      jsonb                               default '{}'::jsonb,
    public_metadata       jsonb                               default '{}'::jsonb,
    PRIMARY KEY (id)
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE basejump.accounts TO authenticated, service_role;
"""

part5 = """
-- Create account_user table
create table if not exists basejump.account_user
(
    user_id      uuid references auth.users on delete cascade        not null,
    account_id   uuid references basejump.accounts on delete cascade not null,
    account_role basejump.account_role                               not null,
    constraint account_user_pkey primary key (user_id, account_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE basejump.account_user TO authenticated, service_role;
"""

# Fonctions nécessaires pour le schema basejump
part6 = """
-- has_role_on_account function
create or replace function basejump.has_role_on_account(account_id uuid, account_role basejump.account_role default null)
    returns boolean
    language sql
    security definer
    set search_path = public
as
$$
select exists(
               select 1
               from basejump.account_user wu
               where wu.user_id = auth.uid()
                 and wu.account_id = has_role_on_account.account_id
                 and (
                           wu.account_role = has_role_on_account.account_role
                       or has_role_on_account.account_role is null
                   )
           );
$$;

grant execute on function basejump.has_role_on_account(uuid, basejump.account_role) to authenticated, anon, public, service_role;

-- get_accounts_with_role function
create or replace function basejump.get_accounts_with_role(passed_in_role basejump.account_role default null)
    returns setof uuid
    language sql
    security definer
    set search_path = public
as
$$
select account_id
from basejump.account_user wu
where wu.user_id = auth.uid()
  and (
            wu.account_role = passed_in_role
        or passed_in_role is null
    );
$$;

grant execute on function basejump.get_accounts_with_role(basejump.account_role) to authenticated;
"""

# Modifier la fonction d'authentification pour utiliser public au lieu de basejump
part7 = """
-- Modifier la fonction verify_thread_access pour ne plus utiliser le schéma basejump
CREATE OR REPLACE FUNCTION public.verify_thread_access(thread_id uuid, user_id uuid)
RETURNS boolean AS $$
DECLARE
    account_id uuid;
    has_access boolean := false;
BEGIN
    -- Récupérer l'account_id associé au thread
    SELECT t.account_id INTO account_id
    FROM threads t
    WHERE t.thread_id = thread_id;
    
    -- Vérifier si l'utilisateur a accès au thread via son compte personnel
    IF account_id = user_id THEN
        has_access := true;
    ELSE
        -- Vérifier si l'utilisateur a accès au thread via son appartenance à un compte
        SELECT EXISTS(
            SELECT 1
            FROM account_user au
            WHERE au.user_id = user_id
            AND au.account_id = account_id
        ) INTO has_access;
    END IF;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.verify_thread_access(uuid, uuid) TO authenticated, service_role;

-- Créer table account_user dans le schéma public pour faciliter la migration
CREATE TABLE IF NOT EXISTS public.account_user
(
    user_id      uuid references auth.users on delete cascade,
    account_id   uuid,
    account_role text,
    PRIMARY KEY (user_id, account_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_user TO authenticated, service_role;
"""

def execute_sql(sql):
    """Exécute le script SQL via l'API REST de Supabase"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_ANON_KEY if SUPABASE_ANON_KEY else SUPABASE_SERVICE_ROLE_KEY
    }
    
    url = f"{SUPABASE_URL}/rest/v1/sql"
    
    try:
        response = requests.post(url, headers=headers, json={"query": sql})
        if response.status_code >= 400:
            print(f"Erreur {response.status_code} lors de l'exécution du SQL: {response.text}")
            return False
        else:
            print(f"SQL exécuté avec succès. Réponse: {response.text[:100] if response.text else 'Pas de réponse'}")
            return True
    except Exception as e:
        print(f"Exception lors de l'exécution du SQL: {str(e)}")
        return False

def main():
    parts = [part1, part2, part3, part4, part5, part6, part7]
    
    for i, part in enumerate(parts):
        print(f"Exécution de la partie {i+1}/{len(parts)}...")
        success = execute_sql(part)
        if not success:
            print(f"Échec lors de l'exécution de la partie {i+1}. Tentative de continuer...")
        # Petite pause entre les requêtes pour éviter les limitations de rate
        time.sleep(1)
    
    print("\nInitialisation de basejump terminée!")
    
    # Vérifier que le schéma basejump a été créé
    check_sql = """SELECT exists(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'basejump');"""
    if execute_sql(check_sql):
        print("Le schéma basejump existe bien dans la base de données.")
    else:
        print("ATTENTION: Le schéma basejump n'a pas été créé correctement!")

if __name__ == "__main__":
    main()