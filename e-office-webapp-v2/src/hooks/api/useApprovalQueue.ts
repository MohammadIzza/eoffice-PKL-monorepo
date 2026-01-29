import { useState, useEffect } from 'react';
import { letterService, type QueueLetter } from '@/services';
import { useAuthStore } from '@/stores';

export function useApprovalQueue() {
  const { user } = useAuthStore();
  const [letters, setLetters] = useState<QueueLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine active role from user roles
  const getActiveRole = (): string | null => {
    if (!user?.roles) return null;
    
    const approverRoles = [
      'dosen_pembimbing',
      'dosen_koordinator',
      'ketua_program_studi',
      'admin_fakultas',
      'supervisor_akademik',
      'manajer_tu',
      'wakil_dekan_1',
      'upa'
    ];
    
    // Get first approver role from user
    const userRoleNames = user.roles.map(r => r.name);
    return userRoleNames.find(role => approverRoles.includes(role)) || null;
  };

  useEffect(() => {
    const activeRole = getActiveRole();
    
    if (!activeRole) {
      setIsLoading(false);
      setLetters([]);
      return;
    }

    const fetchQueue = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await letterService.getQueue(activeRole);
        setLetters(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat antrian approval';
        setError(errorMessage);
        console.error('Error fetching approval queue:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [user]);

  return {
    letters,
    isLoading,
    error,
    activeRole: getActiveRole(),
    refetch: async () => {
      const activeRole = getActiveRole();
      if (!activeRole) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await letterService.getQueue(activeRole);
        setLetters(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat antrian approval';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
  };
}
