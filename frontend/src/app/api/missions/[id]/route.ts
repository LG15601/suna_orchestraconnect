import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/missions/[id] - Get a specific mission
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the mission
    const { data: mission, error } = await supabase
      .from('missions')
      .select('*, mission_threads(thread_id)')
      .eq('id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching mission:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mission' },
        { status: 500 }
      );
    }
    
    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
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
        metadata: mission.metadata || {},
        threads: mission.mission_threads || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching mission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/missions/[id] - Update a mission
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the update data from the request
    const updateData = await request.json();
    
    // Get the mission to check if it exists and belongs to the user
    const { data: existingMission, error: fetchError } = await supabase
      .from('missions')
      .select('account_id')
      .eq('id', params.id)
      .single();
    
    if (fetchError || !existingMission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Get the user's accounts
    const { data: accounts } = await supabase
      .from('basejump.accounts')
      .select('id')
      .eq('primary_owner_user_id', user.id);
    
    // Check if the mission belongs to one of the user's accounts
    const accountIds = accounts?.map(account => account.id) || [];
    if (!accountIds.includes(existingMission.account_id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update the mission
    const { data: mission, error } = await supabase
      .from('missions')
      .update({
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        due_date: updateData.dueDate,
        type: updateData.type,
        results: updateData.results,
        metadata: updateData.metadata
      })
      .eq('id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating mission:', error);
      return NextResponse.json(
        { error: 'Failed to update mission' },
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
    console.error('Error updating mission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/missions/[id] - Delete a mission
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get the mission to check if it exists and belongs to the user
    const { data: existingMission, error: fetchError } = await supabase
      .from('missions')
      .select('account_id')
      .eq('id', params.id)
      .single();
    
    if (fetchError || !existingMission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Get the user's accounts
    const { data: accounts } = await supabase
      .from('basejump.accounts')
      .select('id')
      .eq('primary_owner_user_id', user.id);
    
    // Check if the mission belongs to one of the user's accounts
    const accountIds = accounts?.map(account => account.id) || [];
    if (!accountIds.includes(existingMission.account_id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete the mission
    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', params.id);
    
    if (error) {
      console.error('Error deleting mission:', error);
      return NextResponse.json(
        { error: 'Failed to delete mission' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting mission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
