import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as IndexedDB from '@/lib/storage/indexedDB';

export interface AttachmentFile {
  id: string;
  file: File;
  category: 'proposal' | 'ktm' | 'tambahan';
  preview?: string;
}

interface AttachmentMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  category: 'proposal' | 'ktm' | 'tambahan';
  lastModified: number;
  dataUrl: string;
  storedInIndexedDB?: boolean;
}

interface PKLFormState {
  currentStep: number;
  formData: Record<string, any>;
  attachments: AttachmentFile[];
  _hasHydrated: boolean;
  setCurrentStep: (step: number) => void;
  setFormData: (data: Record<string, any>) => void;
  addAttachment: (file: File, category: 'proposal' | 'ktm' | 'tambahan') => Promise<void>;
  removeAttachment: (id: string) => void;
  updateAttachmentCategory: (id: string, category: 'proposal' | 'ktm' | 'tambahan') => void;
  resetForm: () => void;
  restoreAttachments: () => Promise<void>;
  cleanupOldAttachments: () => void;
  fileToBase64: (file: File) => Promise<string>;
  base64ToFile: (base64: string, filename: string, mimeType: string) => File;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const usePKLFormStore = create<PKLFormState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      formData: {},
      attachments: [],
      _hasHydrated: false,
      setCurrentStep: (step) => set({ currentStep: step }),
      setFormData: (data) => set((state) => ({ 
        formData: { ...state.formData, ...data } 
      })),
      addAttachment: async (file, category) => {
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const preview = file.type.startsWith('image/') || file.type === 'application/pdf' 
          ? URL.createObjectURL(file) 
          : undefined;
        const isReplaceCategory = category === 'proposal' || category === 'ktm';
        
        set((state) => {
          let newAttachments = [...state.attachments];
          
          if (isReplaceCategory) {
            const existingIndex = newAttachments.findIndex(att => att.category === category);
            if (existingIndex !== -1) {
              const existing = newAttachments[existingIndex];
              if (existing.preview) {
                URL.revokeObjectURL(existing.preview);
              }
              newAttachments.splice(existingIndex, 1);
              
              try {
                const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
                const filteredMetadata = storedMetadata.filter(meta => meta.id !== existing.id);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(filteredMetadata));
              } catch (error) {
                console.error('[PKL Store] Error removing old metadata:', error);
              }
            }
          }
          
          newAttachments.push({ id, file, category, preview });
          
          return { attachments: newAttachments };
        });
        
        const MAX_BASE64_SIZE = 1024 * 1024;
        const isSmallFile = file.size < MAX_BASE64_SIZE;
        
        try {
          let dataUrl: string | undefined;
          
          if (isSmallFile) {
            try {
              dataUrl = await fileToBase64(file);
            } catch (error) {
              console.warn(`[PKL Store] Failed to convert file to base64: ${file.name}`, error);
            }
          } else {
            try {
              await IndexedDB.storeFile(id, file, category);
            } catch (indexedDBError) {
              console.error('[PKL Store] Failed to store file in IndexedDB:', indexedDBError);
            }
          }
          
          const metadata: AttachmentMetadata = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            category,
            lastModified: file.lastModified,
            dataUrl: dataUrl || '',
            storedInIndexedDB: !isSmallFile,
          };
          
          try {
            const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
            
            if (isReplaceCategory) {
              const oldFiles = storedMetadata.filter(meta => meta.category === category);
              for (const oldFile of oldFiles) {
                if (oldFile.storedInIndexedDB) {
                  try {
                    await IndexedDB.deleteFile(oldFile.id);
                  } catch (error) {
                    console.error(`[PKL Store] Error deleting old file from IndexedDB: ${oldFile.id}`, error);
                  }
                }
              }
              
              const filteredMetadata = storedMetadata.filter(meta => meta.category !== category);
              storedMetadata.length = 0;
              storedMetadata.push(...filteredMetadata);
            }
            
            const metadataToStore = isSmallFile && dataUrl 
              ? metadata 
              : { ...metadata, dataUrl: '' };
            
            storedMetadata.push(metadataToStore);
            localStorage.setItem('pkl-attachments-metadata', JSON.stringify(storedMetadata));
          } catch (storageError: any) {
            if (storageError.name === 'QuotaExceededError') {
              console.error('[PKL Store] localStorage quota exceeded. Attempting cleanup...');
              
              try {
                const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
                const recentMetadata = storedMetadata.slice(-5);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
                
                const metadataToStore = isSmallFile && dataUrl 
                  ? metadata 
                  : { ...metadata, dataUrl: '' };
                recentMetadata.push(metadataToStore);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
              } catch (cleanupError) {
                console.error('[PKL Store] Failed to cleanup localStorage:', cleanupError);
              }
            } else {
              throw storageError;
            }
          }
        } catch (error) {
          console.error('[PKL Store] Error in addAttachment:', error);
        }
      },
      removeAttachment: (id) => {
        set((state) => {
          const attachmentToRemove = state.attachments.find(att => att.id === id);
          if (attachmentToRemove?.preview) {
            URL.revokeObjectURL(attachmentToRemove.preview);
          }
          
          const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
          const fileToRemove = storedMetadata.find(meta => meta.id === id);
          
          if (fileToRemove?.storedInIndexedDB) {
            IndexedDB.deleteFile(id).catch(error => {
              console.error(`[PKL Store] Error deleting file from IndexedDB: ${id}`, error);
            });
          }
          
          const filteredMetadata = storedMetadata.filter(meta => meta.id !== id);
          localStorage.setItem('pkl-attachments-metadata', JSON.stringify(filteredMetadata));
          
          const newAttachments = state.attachments.filter(att => att.id !== id);
          return { attachments: newAttachments };
        });
      },
      updateAttachmentCategory: (id, category) => {
        set((state) => {
          const newAttachments = state.attachments.map(att => 
            att.id === id ? { ...att, category } : att
          );
          
          const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
          const updatedMetadata = storedMetadata.map(meta => 
            meta.id === id ? { ...meta, category } : meta
          );
          localStorage.setItem('pkl-attachments-metadata', JSON.stringify(updatedMetadata));
          
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
          localStorage.removeItem('pkl-attachments-metadata');
          IndexedDB.clearAllFiles().catch(error => {
            console.error('[PKL Store] Error clearing IndexedDB:', error);
          });
          return { currentStep: 1, formData: {}, attachments: [], _hasHydrated: false };
        });
      },
      cleanupOldAttachments: () => {
        try {
          const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
          if (storedMetadata.length > 10) {
            const recentMetadata = storedMetadata.slice(-10);
            localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
          }
        } catch (error) {
          console.error('[PKL Store] Error cleaning up old attachments:', error);
        }
      },
      restoreAttachments: async () => {
        const currentState = get();
        if (currentState._hasHydrated) {
          return;
        }
        
        try {
            const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
            
            if (storedMetadata.length > 0) {
              const smallFiles = storedMetadata.filter(meta => meta.dataUrl && meta.dataUrl !== '' && !meta.storedInIndexedDB);
              const largeFiles = storedMetadata.filter(meta => meta.storedInIndexedDB === true);
              const allMetadata = [...smallFiles, ...largeFiles];
              
              const proposalFiles = allMetadata.filter(m => m.category === 'proposal');
              const ktmFiles = allMetadata.filter(m => m.category === 'ktm');
              const tambahanFiles = allMetadata.filter(m => m.category === 'tambahan');
              
              const latestProposal = proposalFiles.length > 0 
                ? proposalFiles.reduce((latest, current) => 
                    current.lastModified > latest.lastModified ? current : latest
                  )
                : null;
              
              const latestKtm = ktmFiles.length > 0
                ? ktmFiles.reduce((latest, current) => 
                    current.lastModified > latest.lastModified ? current : latest
                  )
                : null;
              
              const metadataToRestore = [
                ...(latestProposal ? [latestProposal] : []),
                ...(latestKtm ? [latestKtm] : []),
                ...tambahanFiles
              ];
              
              const restoredAttachments: AttachmentFile[] = [];
              
              for (const meta of metadataToRestore) {
                try {
                  let file: File | null = null;
                  
                  if (meta.storedInIndexedDB) {
                    file = await IndexedDB.getFile(meta.id);
                    if (!file) continue;
                  } else if (meta.dataUrl && meta.dataUrl !== '') {
                    file = base64ToFile(meta.dataUrl, meta.name, meta.type);
                  } else {
                    continue;
                  }
                  
                  if (file) {
                    const preview = file.type.startsWith('image/') || file.type === 'application/pdf' 
                      ? URL.createObjectURL(file) 
                      : undefined;
                    
                    restoredAttachments.push({ 
                      id: meta.id, 
                      file, 
                      category: meta.category, 
                      preview 
                    });
                  }
                } catch (error) {
                  console.error(`[PKL Store] Error restoring file ${meta.name}:`, error);
                }
              }
              
              try {
                const restoredIds = new Set(restoredAttachments.map(att => att.id));
                const cleanedMetadata = storedMetadata.filter(meta => restoredIds.has(meta.id));
                
                if (cleanedMetadata.length < storedMetadata.length) {
                  localStorage.setItem('pkl-attachments-metadata', JSON.stringify(cleanedMetadata));
                }
              } catch (error) {
                console.error('[PKL Store] Error cleaning up localStorage during restore:', error);
              }
              
              set({ 
                attachments: restoredAttachments, 
                _hasHydrated: true 
              });
            } else {
              set({ _hasHydrated: true });
            }
          } catch (error) {
            console.error('[PKL Store] Error restoring attachments from localStorage/IndexedDB:', error);
            set({ _hasHydrated: true });
          }
      },
      fileToBase64,
      base64ToFile,
    }),
    {
      name: 'pkl-form-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        formData: state.formData,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (typeof window !== 'undefined') {
            const currentState = usePKLFormStore.getState();
            if (currentState) {
              currentState.cleanupOldAttachments();
            }
          }
          
          if (state && typeof window !== 'undefined') {
            const restore = () => {
              const currentState = usePKLFormStore.getState();
              if (currentState && !currentState._hasHydrated) {
                currentState.restoreAttachments().catch(error => {
                  console.error('[PKL Store] Error in restoreAttachments:', error);
                });
              }
            };
            
            if (window.requestIdleCallback) {
              window.requestIdleCallback(restore, { timeout: 1000 });
            } else {
              setTimeout(restore, 100);
            }
          }
        };
      },
    }
  )
);
