import { useState, useRef, useCallback } from 'react';
import { usePKLFormStore } from '@/stores/pklFormStore';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export function useFileUpload() {
  const { addAttachment, removeAttachment, updateAttachmentCategory } = usePKLFormStore();
  const [dragActive, setDragActive] = useState<{ proposal: boolean; ktm: boolean }>({ 
    proposal: false, 
    ktm: false 
  });
  const [error, setError] = useState<string | null>(null);
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const ktmInputRef = useRef<HTMLInputElement>(null);
  const tambahanInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} terlalu besar. Maksimal 5MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Format file ${file.name} tidak didukung. Hanya PDF, JPG, PNG.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback((file: File | null, category: 'proposal' | 'ktm' | 'tambahan') => {
    if (!file) return;

    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    addAttachment(file, category);
  }, [validateFile, addAttachment]);

  const handleFileSelectMultiple = useCallback((
    files: FileList | null, 
    category: 'proposal' | 'ktm' | 'tambahan'
  ) => {
    if (!files || files.length === 0) return;

    setError(null);
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        addAttachment(file, category);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
  }, [validateFile, addAttachment]);

  const handleDrag = useCallback((e: React.DragEvent, type: 'proposal' | 'ktm') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'proposal' | 'ktm') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file, type);
    }
  }, [handleFileSelect]);

  return {
    dragActive,
    error,
    setError,
    proposalInputRef,
    ktmInputRef,
    tambahanInputRef,
    handleFileSelect,
    handleFileSelectMultiple,
    handleDrag,
    handleDrop,
    removeAttachment,
    updateAttachmentCategory,
    validateFile,
  };
}
