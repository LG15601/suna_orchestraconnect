-- 1. Basejump setup
/**
      ____                 _
     |  _ \               (_)
     | |_) | __ _ ___  ___ _ _   _ _ __ ___  _ __
     |  _ < / _` / __|/ _ \ | | | | '_ ` _ \| '_      | |_) | (_| \__ \  __/ | |_| | | | | | | |_) |
     |____/ \__,_|___/\___|_|\__,_|_| |_| |_| .__/
                         _/ |               | |
                        |__/                |_|
*/

-- revoke execution by default from public
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA PUBLIC REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

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
VALUES (true, true, true);

-- enable select on the config table
GRANT SELECT ON basejump.config TO authenticated, service_role;

-- enable RLS on config
ALTER TABLE basejump.config
    ENABLE ROW LEVEL SECURITY;

create policy "Basejump settings can be read by authenticated users" on basejump.config
    for select
    to authenticated
    using (
    true
    );

-- Basejump utility functions
CREATE OR REPLACE FUNCTION basejump.get_config()
    RETURNS json AS
$$
DECLARE
    result RECORD;
BEGIN
    SELECT * from basejump.config limit 1 into result;
    return row_to_json(result);
END;
$$ LANGUAGE plpgsql;

grant execute on function basejump.get_config() to authenticated, service_role;

CREATE OR REPLACE FUNCTION basejump.is_set(field_name text)
    RETURNS boolean AS
$$
DECLARE
    result BOOLEAN;
BEGIN
    execute format('select %I from basejump.config limit 1', field_name) into result;
    return result;
END;
$$ LANGUAGE plpgsql;

grant execute on function basejump.is_set(text) to authenticated;

CREATE OR REPLACE FUNCTION basejump.trigger_set_timestamps()
    RETURNS TRIGGER AS
$$
BEGIN
    if TG_OP = 'INSERT' then
        NEW.created_at = now();
        NEW.updated_at = now();
    else
        NEW.updated_at = now();
        NEW.created_at = OLD.created_at;
    end if;
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION basejump.trigger_set_user_tracking()
    RETURNS TRIGGER AS
$$
BEGIN
    if TG_OP = 'INSERT' then
        NEW.created_by = auth.uid();
        NEW.updated_by = auth.uid();
    else
        NEW.updated_by = auth.uid();
        NEW.created_by = OLD.created_by;
    end if;
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION basejump.generate_token(length int)
    RETURNS text AS
$$
select regexp_replace(replace(
                              replace(replace(replace(encode(gen_random_bytes(length)::bytea, 'base64'), '/', ''), '+',
                                              ''), '\', ''),
                              '=',
                              ''), E'[\n\r]+', '', 'g');
$$ LANGUAGE sql;

grant execute on function basejump.generate_token(int) to authenticated;

-- 2. Basejump accounts setup
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

-- constraint for slugs
ALTER TABLE basejump.accounts
    ADD CONSTRAINT basejump_accounts_slug_null_if_personal_account_true CHECK (
            (personal_account = true AND slug is null)
            OR (personal_account = false AND slug is not null)
        );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE basejump.accounts TO authenticated, service_role;

-- Create protect_account_fields function
CREATE OR REPLACE FUNCTION basejump.protect_account_fields()
    RETURNS TRIGGER AS
$$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        if NEW.id <> OLD.id
            OR NEW.personal_account <> OLD.personal_account
            OR NEW.primary_owner_user_id <> OLD.primary_owner_user_id
        THEN
            RAISE EXCEPTION 'You do not have permission to update this field';
        end if;
    end if;

    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Add trigger
CREATE TRIGGER basejump_protect_account_fields
    BEFORE UPDATE
    ON basejump.accounts
    FOR EACH ROW
EXECUTE FUNCTION basejump.protect_account_fields();

-- Slugify function
CREATE OR REPLACE FUNCTION basejump.slugify_account_slug()
    RETURNS TRIGGER AS
$$
BEGIN
    if NEW.slug is not null then
        NEW.slug = lower(regexp_replace(NEW.slug, '[^a-zA-Z0-9-]+', '-', 'g'));
    end if;

    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Add slugify trigger
CREATE TRIGGER basejump_slugify_account_slug
    BEFORE INSERT OR UPDATE
    ON basejump.accounts
    FOR EACH ROW
EXECUTE FUNCTION basejump.slugify_account_slug();

-- Enable RLS
alter table basejump.accounts
    enable row level security;

-- Add timestamp trigger
CREATE TRIGGER basejump_set_accounts_timestamp
    BEFORE INSERT OR UPDATE
    ON basejump.accounts
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_timestamps();

-- Add user tracking trigger
CREATE TRIGGER basejump_set_accounts_user_tracking
    BEFORE INSERT OR UPDATE
    ON basejump.accounts
    FOR EACH ROW
EXECUTE PROCEDURE basejump.trigger_set_user_tracking();

-- Create account_user table
create table if not exists basejump.account_user
(
    user_id      uuid references auth.users on delete cascade        not null,
    account_id   uuid references basejump.accounts on delete cascade not null,
    account_role basejump.account_role                               not null,
    constraint account_user_pkey primary key (user_id, account_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE basejump.account_user TO authenticated, service_role;

-- Enable RLS
alter table basejump.account_user
    enable row level security;

-- Add user to new account function
create or replace function basejump.add_current_user_to_new_account()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as
$$
begin
    if new.primary_owner_user_id = auth.uid() then
        insert into basejump.account_user (account_id, user_id, account_role)
        values (NEW.id, auth.uid(), 'owner');
    end if;
    return NEW;
end;
$$;

-- Add trigger
CREATE TRIGGER basejump_add_current_user_to_new_account
    AFTER INSERT
    ON basejump.accounts
    FOR EACH ROW
EXECUTE FUNCTION basejump.add_current_user_to_new_account();

-- New user setup function
create or replace function basejump.run_new_user_setup()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
as
$$
declare
    first_account_id    uuid;
    generated_user_name text;
begin
    if new.email IS NOT NULL then
        generated_user_name := split_part(new.email, '@', 1);
    end if;
    insert into basejump.accounts (name, primary_owner_user_id, personal_account, id)
    values (generated_user_name, NEW.id, true, NEW.id)
    returning id into first_account_id;

    insert into basejump.account_user (account_id, user_id, account_role)
    values (first_account_id, NEW.id, 'owner');

    return NEW;
end;
$$;

-- Add trigger
create trigger on_auth_user_created
    after insert
    on auth.users
    for each row
execute procedure basejump.run_new_user_setup();

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

-- Add account user policies
create policy "users can view their own account_users" on basejump.account_user
    for select
    to authenticated
    using (
    user_id = auth.uid()
    );

create policy "users can view their teammates" on basejump.account_user
    for select
    to authenticated
    using (
    basejump.has_role_on_account(account_id) = true
    );

create policy "Account users can be deleted by owners except primary account owner" on basejump.account_user
    for delete
    to authenticated
    using (
        (basejump.has_role_on_account(account_id, 'owner') = true)
        AND
        user_id != (select primary_owner_user_id
                    from basejump.accounts
                    where account_id = accounts.id)
    );

-- Add accounts policies
create policy "Accounts are viewable by members" on basejump.accounts
    for select
    to authenticated
    using (
    basejump.has_role_on_account(id) = true
    );

create policy "Accounts are viewable by primary owner" on basejump.accounts
    for select
    to authenticated
    using (
    primary_owner_user_id = auth.uid()
    );

create policy "Team accounts can be created by any user" on basejump.accounts
    for insert
    to authenticated
    with check (
            basejump.is_set('enable_team_accounts') = true
        and personal_account = false
    );

create policy "Accounts can be edited by owners" on basejump.accounts
    for update
    to authenticated
    using (
    basejump.has_role_on_account(id, 'owner') = true
    );

-- 3. Configuration and schema updates
UPDATE basejump.config SET enable_team_accounts = TRUE;
UPDATE basejump.config SET enable_personal_account_billing = TRUE;
UPDATE basejump.config SET enable_team_account_billing = TRUE;

-- 4. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 5. Create Suna tables
-- Create devices table
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    name TEXT,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_online BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES basejump.accounts(id) ON DELETE CASCADE
);

-- Create recordings table
CREATE TABLE public.recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    device_id UUID NOT NULL,
    preprocessed_file_path TEXT,
    meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    name TEXT,
    ui_annotated BOOLEAN DEFAULT FALSE,
    a11y_file_path TEXT,
    audio_file_path TEXT,
    action_annotated BOOLEAN DEFAULT FALSE,
    raw_data_file_path TEXT,
    metadata_file_path TEXT,
    action_training_file_path TEXT,
    CONSTRAINT fk_account FOREIGN KEY (account_id) REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_device FOREIGN KEY (device_id) REFERENCES public.devices(id) ON DELETE CASCADE
);

-- Create indexes for foreign keys
CREATE INDEX idx_recordings_account_id ON public.recordings(account_id);
CREATE INDEX idx_recordings_device_id ON public.recordings(device_id);
CREATE INDEX idx_devices_account_id ON public.devices(account_id);

-- Add RLS policies
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for devices
CREATE POLICY "Account members can delete their own devices"
    ON public.devices FOR DELETE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can insert their own devices"
    ON public.devices FOR INSERT
    WITH CHECK (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can only access their own devices"
    ON public.devices FOR ALL
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can update their own devices"
    ON public.devices FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can view their own devices"
    ON public.devices FOR SELECT
    USING (basejump.has_role_on_account(account_id));

-- Create RLS policies for recordings
CREATE POLICY "Account members can delete their own recordings"
    ON public.recordings FOR DELETE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can insert their own recordings"
    ON public.recordings FOR INSERT
    WITH CHECK (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can only access their own recordings"
    ON public.recordings FOR ALL
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can update their own recordings"
    ON public.recordings FOR UPDATE
    USING (basejump.has_role_on_account(account_id));

CREATE POLICY "Account members can view their own recordings"
    ON public.recordings FOR SELECT
    USING (basejump.has_role_on_account(account_id));

-- Create transfer_device function
CREATE OR REPLACE FUNCTION transfer_device(
  device_id UUID,
  new_account_id UUID,
  device_name TEXT DEFAULT NULL
)
RETURNS SETOF devices AS $$
DECLARE
  device_exists BOOLEAN;
  updated_device devices;
BEGIN
  -- Check if a device with the specified UUID exists
  SELECT EXISTS (
    SELECT 1 FROM devices WHERE id = device_id
  ) INTO device_exists;

  IF device_exists THEN
    -- Device exists: update its account ownership and last_seen timestamp
    UPDATE devices
    SET
      account_id = new_account_id,
      name = COALESCE(device_name, name),
      last_seen = NOW()
    WHERE id = device_id
    RETURNING * INTO updated_device;

    RETURN NEXT updated_device;
  ELSE
    -- Device doesn't exist; return nothing so the caller can handle creation
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION transfer_device(UUID, UUID, TEXT) TO authenticated;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ui_grounding', 'ui_grounding', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('ui_grounding_trajs', 'ui_grounding_trajs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recordings', 'recordings', false, null, null)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for the 'recordings' bucket
CREATE POLICY "Account members can select recording files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'recordings' AND
        (storage.foldername(name))[1]::uuid IN (SELECT basejump.get_accounts_with_role())
    );

CREATE POLICY "Account members can insert recording files"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'recordings' AND
        (storage.foldername(name))[1]::uuid IN (SELECT basejump.get_accounts_with_role())
    );

CREATE POLICY "Account members can update recording files"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'recordings' AND
        (storage.foldername(name))[1]::uuid IN (SELECT basejump.get_accounts_with_role())
    );

CREATE POLICY "Account members can delete recording files"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'recordings' AND
        (storage.foldername(name))[1]::uuid IN (SELECT basejump.get_accounts_with_role())
    );

-- 6. Create Suna AgentPress tables
-- Create projects table
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    sandbox JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create threads table
CREATE TABLE threads (
    thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(project_id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create messages table
CREATE TABLE messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    is_llm_message BOOLEAN NOT NULL DEFAULT TRUE,
    content JSONB NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create agent_runs table
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(thread_id),
    status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    responses JSONB NOT NULL DEFAULT '[]'::jsonb,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_runs_updated_at
    BEFORE UPDATE ON agent_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_threads_created_at ON threads(created_at);
CREATE INDEX idx_threads_account_id ON threads(account_id);
CREATE INDEX idx_threads_project_id ON threads(project_id);
CREATE INDEX idx_agent_runs_thread_id ON agent_runs(thread_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at);
CREATE INDEX idx_projects_account_id ON projects(account_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project policies
CREATE POLICY project_select_policy ON projects
    FOR SELECT
    USING (
        is_public = TRUE OR
        basejump.has_role_on_account(account_id) = true
    );

CREATE POLICY project_insert_policy ON projects
    FOR INSERT
    WITH CHECK (basejump.has_role_on_account(account_id) = true);

CREATE POLICY project_update_policy ON projects
    FOR UPDATE
    USING (basejump.has_role_on_account(account_id) = true);

CREATE POLICY project_delete_policy ON projects
    FOR DELETE
    USING (basejump.has_role_on_account(account_id) = true);

-- Thread policies based on project and account ownership
CREATE POLICY thread_select_policy ON threads
    FOR SELECT
    USING (
        basejump.has_role_on_account(account_id) = true OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = threads.project_id
            AND (
                projects.is_public = TRUE OR
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY thread_insert_policy ON threads
    FOR INSERT
    WITH CHECK (
        basejump.has_role_on_account(account_id) = true OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = threads.project_id
            AND basejump.has_role_on_account(projects.account_id) = true
        )
    );

CREATE POLICY thread_update_policy ON threads
    FOR UPDATE
    USING (
        basejump.has_role_on_account(account_id) = true OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = threads.project_id
            AND basejump.has_role_on_account(projects.account_id) = true
        )
    );

CREATE POLICY thread_delete_policy ON threads
    FOR DELETE
    USING (
        basejump.has_role_on_account(account_id) = true OR 
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.project_id = threads.project_id
            AND basejump.has_role_on_account(projects.account_id) = true
        )
    );

-- Create policies for agent_runs based on thread ownership
CREATE POLICY agent_run_select_policy ON agent_runs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                projects.is_public = TRUE OR
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY agent_run_insert_policy ON agent_runs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY agent_run_update_policy ON agent_runs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY agent_run_delete_policy ON agent_runs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = agent_runs.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

-- Create message policies based on thread ownership
CREATE POLICY message_select_policy ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = messages.thread_id
            AND (
                projects.is_public = TRUE OR
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY message_insert_policy ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = messages.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY message_update_policy ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = messages.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

CREATE POLICY message_delete_policy ON messages
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM threads
            LEFT JOIN projects ON threads.project_id = projects.project_id
            WHERE threads.thread_id = messages.thread_id
            AND (
                basejump.has_role_on_account(threads.account_id) = true OR 
                basejump.has_role_on_account(projects.account_id) = true
            )
        )
    );

-- Grant permissions to roles
GRANT ALL PRIVILEGES ON TABLE projects TO authenticated, service_role;
GRANT SELECT ON TABLE projects TO anon;
GRANT SELECT ON TABLE threads TO authenticated, anon, service_role;
GRANT SELECT ON TABLE messages TO authenticated, anon, service_role;
GRANT ALL PRIVILEGES ON TABLE agent_runs TO authenticated, service_role;

-- Create a function that matches the Python get_messages behavior
CREATE OR REPLACE FUNCTION get_llm_formatted_messages(p_thread_id UUID)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    messages_array JSONB := '[]'::JSONB;
    has_access BOOLEAN;
    current_role TEXT;
    latest_summary_id UUID;
    latest_summary_time TIMESTAMP WITH TIME ZONE;
    is_project_public BOOLEAN;
BEGIN
    -- Get current role
    SELECT current_user INTO current_role;
    
    -- Check if associated project is public
    SELECT p.is_public INTO is_project_public
    FROM threads t
    LEFT JOIN projects p ON t.project_id = p.project_id
    WHERE t.thread_id = p_thread_id;
    
    -- Skip access check for service_role or public projects
    IF current_role = 'authenticated' AND NOT is_project_public THEN
        -- Check if thread exists and user has access
        SELECT EXISTS (
            SELECT 1 FROM threads t
            LEFT JOIN projects p ON t.project_id = p.project_id
            WHERE t.thread_id = p_thread_id
            AND (
                basejump.has_role_on_account(t.account_id) = true OR 
                basejump.has_role_on_account(p.account_id) = true
            )
        ) INTO has_access;
        
        IF NOT has_access THEN
            RAISE EXCEPTION 'Thread not found or access denied';
        END IF;
    END IF;

    -- Find the latest summary message if it exists
    SELECT message_id, created_at
    INTO latest_summary_id, latest_summary_time
    FROM messages
    WHERE thread_id = p_thread_id
    AND type = 'summary'
    AND is_llm_message = TRUE
    ORDER BY created_at DESC
    LIMIT 1;

    -- Parse content if it's stored as a string and return proper JSON objects
    WITH parsed_messages AS (
        SELECT 
            message_id,
            CASE 
                WHEN jsonb_typeof(content) = 'string' THEN content::text::jsonb
                ELSE content
            END AS parsed_content,
            created_at,
            type
        FROM messages
        WHERE thread_id = p_thread_id
        AND is_llm_message = TRUE
        AND (
            -- Include the latest summary and all messages after it,
            -- or all messages if no summary exists
            latest_summary_id IS NULL 
            OR message_id = latest_summary_id 
            OR created_at > latest_summary_time
        )
        ORDER BY created_at
    )
    SELECT JSONB_AGG(parsed_content)
    INTO messages_array
    FROM parsed_messages;
    
    -- Handle the case when no messages are found
    IF messages_array IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;
    
    RETURN messages_array;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_llm_formatted_messages TO authenticated, anon, service_role;