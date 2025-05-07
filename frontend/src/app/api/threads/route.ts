import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/threads - Create a new thread with optional system prompt
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

    // Get the request body
    const body = await request.json();
    const { name, systemPrompt } = body;

    // Create a new thread using the user ID directly
    const { data: thread, error } = await supabase
      .from('threads')
      .insert({
        account_id: user.id, // Use the user ID directly
        project_id: null, // No project for mission threads
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating thread:', error);
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      );
    }

    // If a system prompt is provided, store it in the thread metadata
    if (systemPrompt) {
      const { error: updateError } = await supabase
        .from('threads')
        .update({
          metadata: {
            name: name || 'New Thread',
            systemPrompt
          }
        })
        .eq('thread_id', thread.thread_id);

      if (updateError) {
        console.error('Error updating thread metadata:', updateError);
        return NextResponse.json(
          { error: 'Failed to update thread metadata' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      thread
    });

  } catch (error) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// GET /api/threads - Get all threads for the current user
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

    // Query the threads table using the user ID directly
    const { data: threads, error } = await supabase
      .from('threads')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching threads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ threads });

  } catch (error) {
    console.error('Error fetching threads:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
