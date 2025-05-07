import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/threads/[id] - Get a specific thread
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
    
    // Get the thread
    const { data: thread, error } = await supabase
      .from('threads')
      .select('*')
      .eq('thread_id', params.id)
      .single();
    
    if (error) {
      console.error('Error fetching thread:', error);
      return NextResponse.json(
        { error: 'Failed to fetch thread' },
        { status: 500 }
      );
    }
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this thread
    if (thread.account_id !== user.id) {
      // Check if the thread is public
      if (!thread.is_public) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json({ thread });
    
  } catch (error) {
    console.error('Error fetching thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PATCH /api/threads/[id] - Update a specific thread
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
    
    // Get the request body
    const body = await request.json();
    
    // Get the thread to check ownership
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('account_id')
      .eq('thread_id', params.id)
      .single();
    
    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this thread
    if (thread.account_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Update the thread
    const { data: updatedThread, error } = await supabase
      .from('threads')
      .update(body)
      .eq('thread_id', params.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating thread:', error);
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      thread: updatedThread
    });
    
  } catch (error) {
    console.error('Error updating thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/threads/[id] - Delete a specific thread
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
    
    // Get the thread to check ownership
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('account_id')
      .eq('thread_id', params.id)
      .single();
    
    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Check if the user has access to this thread
    if (thread.account_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Delete all messages associated with the thread
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('thread_id', params.id);
    
    if (messagesError) {
      console.error('Error deleting messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to delete messages' },
        { status: 500 }
      );
    }
    
    // Delete the thread
    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('thread_id', params.id);
    
    if (error) {
      console.error('Error deleting thread:', error);
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true
    });
    
  } catch (error) {
    console.error('Error deleting thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
