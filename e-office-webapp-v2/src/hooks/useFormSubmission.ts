import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePKLFormStore } from '@/stores/pklFormStore';
import { letterService } from '@/services';
import { handleApiError } from '@/lib/api';

interface UseFormSubmissionOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFormSubmission(options?: UseFormSubmissionOptions) {
  const router = useRouter();
  const { formData, attachments, resetForm } = usePKLFormStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    // Validation
    if (!formData.programStudiId || !formData.dosenPembimbingId) {
      const errorMsg = 'Data tidak lengkap. Silakan kembali ke step sebelumnya.';
      setError(errorMsg);
      options?.onError?.(errorMsg);
      return;
    }

    const proposalFile = attachments.find(att => att.category === 'proposal');
    const ktmFile = attachments.find(att => att.category === 'ktm');
    
    if (!proposalFile || !ktmFile) {
      const errorMsg = 'File Proposal dan File KTM wajib diunggah.';
      setError(errorMsg);
      options?.onError?.(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitPayload = {
        prodiId: formData.programStudiId,
        dosenPembimbingUserId: formData.dosenPembimbingId,
        formData: {
          ...formData,
          // Remove IDs that shouldn't be in formData
          programStudiId: undefined,
          departemenId: undefined,
          dosenPembimbingId: undefined,
        },
      };

      // Submit letter first
      const result = await letterService.submitLetter({
        prodiId: submitPayload.prodiId,
        dosenPembimbingUserId: submitPayload.dosenPembimbingUserId,
        formData: submitPayload.formData,
      });

      // Upload attachments if any
      if (attachments.length > 0) {
        const proposalFiles = attachments.filter(att => att.category === 'proposal');
        const ktmFiles = attachments.filter(att => att.category === 'ktm');
        const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

        if (proposalFiles.length > 0) {
          await letterService.uploadAttachments(
            result.letterId,
            proposalFiles.map(att => att.file),
            'proposal',
            true
          );
        }

        if (ktmFiles.length > 0) {
          await letterService.uploadAttachments(
            result.letterId,
            ktmFiles.map(att => att.file),
            'ktm',
            true
          );
        }

        if (tambahanFiles.length > 0) {
          await letterService.uploadAttachments(
            result.letterId,
            tambahanFiles.map(att => att.file),
            'tambahan'
          );
        }
      }

      // Reset form on success
      resetForm();
      
      // Call success callback
      options?.onSuccess?.();
      
      // Redirect to status page
      router.push('/dashboard/pengajuan/pkl/status');
    } catch (err) {
      const apiError = handleApiError(err);
      const errorMessage = apiError.message || 'Gagal mengajukan surat. Silakan coba lagi.';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, attachments, resetForm, router, options]);

  return {
    submit,
    isSubmitting,
    error,
    setError,
  };
}
