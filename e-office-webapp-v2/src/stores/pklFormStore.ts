import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AttachmentFile {
  file: File;
  category: 'file' | 'foto' | 'tambahan';
  preview?: string;
}

interface PKLFormState {
  currentStep: number;
  formData: Record<string, any>;
  attachments: AttachmentFile[];
  setCurrentStep: (step: number) => void;
  setFormData: (data: Record<string, any>) => void;
  addAttachment: (file: File, category: 'file' | 'foto' | 'tambahan') => void;
  removeAttachment: (index: number) => void;
  updateAttachmentCategory: (index: number, category: 'file' | 'foto' | 'tambahan') => void;
  resetForm: () => void;
}

export const usePKLFormStore = create<PKLFormState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formData: {},
      attachments: [],
      setCurrentStep: (step) => set({ currentStep: step }),
      setFormData: (data) => set((state) => ({ 
        formData: { ...state.formData, ...data } 
      })),
      addAttachment: (file, category) => {
        // Create preview for images and PDFs
        const preview = file.type.startsWith('image/') || file.type === 'application/pdf' 
          ? URL.createObjectURL(file) 
          : undefined;
        set((state) => ({
          attachments: [...state.attachments, { file, category, preview }]
        }));
      },
      removeAttachment: (index) => {
        set((state) => {
          const newAttachments = [...state.attachments];
          if (newAttachments[index]?.preview) {
            URL.revokeObjectURL(newAttachments[index].preview!);
          }
          newAttachments.splice(index, 1);
          return { attachments: newAttachments };
        });
      },
      updateAttachmentCategory: (index, category) => {
        set((state) => {
          const newAttachments = [...state.attachments];
          newAttachments[index] = { ...newAttachments[index], category };
          return { attachments: newAttachments };
        });
      },
      resetForm: () => {
        set((state) => {
          state.attachments.forEach(att => {
            if (att.preview) {
              URL.revokeObjectURL(att.preview);
            }
          });
          return { currentStep: 1, formData: {}, attachments: [] };
        });
      },
    }),
    {
      name: 'pkl-form-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
        attachments: [], // Don't persist File objects
      }),
    }
  )
);
