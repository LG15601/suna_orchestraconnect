import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/missions - Get all missions for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's account
    const { data: accounts } = await supabase
      .from('basejump.accounts')
      .select('id')
      .eq('primary_owner_user_id', user.id)
      .single();

    if (!accounts) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Query the missions table
    const { data: missions, error } = await supabase
      .from('missions')
      .select('*')
      .eq('account_id', accounts.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching missions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch missions' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const formattedMissions = missions.map(mission => ({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      status: mission.status,
      createdAt: mission.created_at,
      dueDate: mission.due_date,
      type: mission.type,
      accountId: mission.account_id,
      results: mission.results || {},
      metadata: mission.metadata || {}
    }));

    return NextResponse.json({ missions: formattedMissions });

  } catch (error) {
    console.error('Error fetching missions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/missions - Create a new mission
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's account
    const { data: accounts } = await supabase
      .from('basejump.accounts')
      .select('id')
      .eq('primary_owner_user_id', user.id)
      .single();

    if (!accounts) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Get the mission data from the request
    const missionData = await request.json();

    // Validate the mission data
    if (!missionData.title || !missionData.description || !missionData.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the mission into the database
    const { data: mission, error } = await supabase
      .from('missions')
      .insert({
        title: missionData.title,
        description: missionData.description,
        status: 'pending',
        account_id: accounts.id,
        due_date: missionData.dueDate || null,
        type: missionData.type,
        metadata: missionData.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating mission:', error);
      return NextResponse.json(
        { error: 'Failed to create mission' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    return NextResponse.json({
      mission: {
        id: mission.id,
        title: mission.title,
        description: mission.description,
        status: mission.status,
        createdAt: mission.created_at,
        dueDate: mission.due_date,
        type: mission.type,
        accountId: mission.account_id,
        results: mission.results || {},
        metadata: mission.metadata || {}
      }
    });

  } catch (error) {
    console.error('Error creating mission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
