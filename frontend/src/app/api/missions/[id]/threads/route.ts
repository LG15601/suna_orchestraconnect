import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/missions/[id]/threads - Link a thread to a mission
export async function POST(
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
    
    // Get the thread ID from the request
    const { threadId } = await request.json();
    
    if (!threadId) {
      return NextResponse.json(
        { error: 'Thread ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the mission exists and belongs to the user
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('account_id')
      .eq('id', params.id)
      .single();
    
    if (missionError || !mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      );
    }
    
    // Check if the thread exists
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('account_id')
      .eq('thread_id', threadId)
      .single();
    
    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Check if the mission and thread belong to the same account
    if (mission.account_id !== thread.account_id) {
      return NextResponse.json(
        { error: 'Mission and thread must belong to the same account' },
        { status: 403 }
      );
    }
    
    // Link the thread to the mission
    const { data: missionThread, error } = await supabase
      .from('mission_threads')
      .insert({
        mission_id: params.id,
        thread_id: threadId
      })
      .select()
      .single();
    
    if (error) {
      // Check if it's a unique constraint violation (thread already linked)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Thread is already linked to this mission' },
          { status: 409 }
        );
      }
      
      console.error('Error linking thread to mission:', error);
      return NextResponse.json(
        { error: 'Failed to link thread to mission' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      missionThread
    });
    
  } catch (error) {
    console.error('Error linking thread to mission:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET /api/missions/[id]/threads - Get all threads linked to a mission
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
    
    // Check if the mission exists and belongs to the user
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select('account_id')
      .eq('id', params.id)
      .single();
    
    if (missionError || !mission) {
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
    if (!accountIds.includes(mission.account_id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get all threads linked to the mission
    const { data: missionThreads, error } = await supabase
      .from('mission_threads')
      .select('*, threads(*)')
      .eq('mission_id', params.id);
    
    if (error) {
      console.error('Error fetching mission threads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mission threads' },
        { status: 500 }
      );
    }
    
    // Transform the data to match the expected format
    const threads = missionThreads.map(mt => ({
      id: mt.threads.thread_id,
      name: mt.threads.name,
      createdAt: mt.threads.created_at,
      updatedAt: mt.threads.updated_at,
      linkId: mt.id
    }));
    
    return NextResponse.json({ threads });
    
  } catch (error) {
    console.error('Error fetching mission threads:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
