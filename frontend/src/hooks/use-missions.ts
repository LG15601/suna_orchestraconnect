import useSWR from 'swr';
import { useState } from 'react';
import { toast } from 'sonner';

// Types
export type MissionStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  createdAt: string;
  dueDate?: string;
  type: string;
  accountId: string;
  results?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface MissionThread {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  linkId: string;
}

// API fetcher
const fetcher = async (url: string) => {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const data = await res.json().catch(() => null);
    (error as any).info = data;
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
};

// Hook to get all missions
export function useMissions() {
  return useSWR<{ missions: Mission[] }>('/api/missions', fetcher);
}

// Hook to get a specific mission
export function useMission(id: string | null) {
  return useSWR<{ mission: Mission }>(
    id ? `/api/missions/${id}` : null,
    fetcher
  );
}

// Hook to get threads linked to a mission
export function useMissionThreads(missionId: string | null) {
  return useSWR<{ threads: MissionThread[] }>(
    missionId ? `/api/missions/${missionId}/threads` : null,
    fetcher
  );
}

// Hook to create, update, and delete missions
export function useMissionActions() {
  const { mutate: mutateMissions } = useMissions();
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a new mission
  const createMission = async (missionData: Omit<Mission, 'id' | 'createdAt' | 'accountId'>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/missions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create mission');
      }
      
      const data = await response.json();
      
      // Refresh the missions list
      mutateMissions();
      
      toast.success('Mission créée avec succès');
      
      return data.mission;
    } catch (error) {
      console.error('Error creating mission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create mission');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a mission
  const updateMission = async (id: string, missionData: Partial<Omit<Mission, 'id' | 'createdAt' | 'accountId'>>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/missions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update mission');
      }
      
      const data = await response.json();
      
      // Refresh the missions list and the specific mission
      mutateMissions();
      
      toast.success('Mission mise à jour avec succès');
      
      return data.mission;
    } catch (error) {
      console.error('Error updating mission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update mission');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a mission
  const deleteMission = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/missions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete mission');
      }
      
      // Refresh the missions list
      mutateMissions();
      
      toast.success('Mission supprimée avec succès');
      
      return true;
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete mission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Link a thread to a mission
  const linkThreadToMission = async (missionId: string, threadId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/missions/${missionId}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to link thread to mission');
      }
      
      toast.success('Conversation liée à la mission avec succès');
      
      return true;
    } catch (error) {
      console.error('Error linking thread to mission:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to link thread to mission');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    createMission,
    updateMission,
    deleteMission,
    linkThreadToMission,
    isLoading,
  };
}
