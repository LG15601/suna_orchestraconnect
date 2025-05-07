import { useState, useEffect, useRef, useCallback } from 'react';
import { streamAgent, getAgentStatus, stopAgent } from '@/lib/api';
import { toast } from 'sonner';

// Define the callbacks the hook consumer can provide
export interface MissionPlannerAgentCallbacks {
  onMessage: (content: string) => void; // Simplified callback for content
  onError?: (error: Error | string) => void; // Optional: Notify on errors
  onClose?: () => void; // Optional: Notify when streaming definitively ends
}

// Simplified version of useAgentStream for MissionPlannerDialog
export function useMissionPlannerAgent({
  agentRunId,
  onMessage,
  onError,
  onClose
}: {
  agentRunId: string | null;
  onMessage: (content: string) => void;
  onError?: (error: Error | string) => void;
  onClose?: () => void;
}) {
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const currentRunIdRef = useRef<string | null>(null);

  // Effect to start streaming when agentRunId changes
  useEffect(() => {
    if (!agentRunId) return;
    
    // Clean up any previous stream
    if (streamCleanupRef.current) {
      streamCleanupRef.current();
      streamCleanupRef.current = null;
    }
    
    currentRunIdRef.current = agentRunId;
    
    // Start streaming
    const cleanup = streamAgent(agentRunId, {
      onMessage: (rawData) => {
        if (!isMountedRef.current) return;
        
        try {
          // Process the raw data
          let processedData = rawData;
          if (processedData.startsWith('data: ')) {
            processedData = processedData.substring(6).trim();
          }
          if (!processedData) return;
          
          // Pass the content to the callback
          onMessage(processedData);
        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
      onError: (error) => {
        if (!isMountedRef.current) return;
        console.error('Stream error:', error);
        if (onError) onError(error);
      },
      onClose: () => {
        if (!isMountedRef.current) return;
        console.log('Stream closed');
        
        // Clean up
        if (streamCleanupRef.current) {
          streamCleanupRef.current();
          streamCleanupRef.current = null;
        }
        
        if (onClose) onClose();
      }
    });
    
    streamCleanupRef.current = cleanup;
    
    // Cleanup function
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, [agentRunId, onMessage, onError, onClose]);
  
  // Effect to clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, []);
}
