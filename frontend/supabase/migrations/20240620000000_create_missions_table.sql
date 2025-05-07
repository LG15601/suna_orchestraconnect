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
