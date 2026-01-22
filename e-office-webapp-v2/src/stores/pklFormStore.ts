import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LetterFormData } from '@/types';

interface PKLFormState {
  currentStep: number;
  formData: Partial<LetterFormData>;
  setCurrentStep: (step: number) => void;
  setFormData: (data: Partial<LetterFormData>) => void;
  resetForm: () => void;
}

export const usePKLFormStore = create<PKLFormState>()(
  persist(
    (set) => ({
      currentStep: 1,
      formData: {},
      setCurrentStep: (step) => set({ currentStep: step }),
      setFormData: (data) => set((state) => ({ 
        formData: { ...state.formData, ...data } 
      })),
      resetForm: () => set({ currentStep: 1, formData: {} }),
    }),
    {
      name: 'pkl-form-storage',
    }
  )
);
