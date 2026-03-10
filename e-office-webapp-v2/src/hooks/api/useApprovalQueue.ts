import { useState, useEffect } from 'react';
import { letterService, type QueueLetter } from '@/services';
import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/api';
import { withBasePath } from "@/lib/navigation";

export function useApprovalQueue() {
  const router = useRouter();
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
        const errorData = handleApiError(err);

        if (errorData.status === 401) {
          window.location.href = withBasePath("/login");
          return;
        }

        setError(errorData.message);
        console.error('Error fetching approval queue:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
  }, [user, router]);

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
        const errorData = handleApiError(err);
        if (errorData.status === 401) {
          window.location.href = withBasePath("/login");
          return;
        }
        setError(errorData.message);
      } finally {
        setIsLoading(false);
      }
    },
  };
}
