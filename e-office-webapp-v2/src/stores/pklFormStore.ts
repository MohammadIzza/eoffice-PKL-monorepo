import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as IndexedDB from '@/lib/storage/indexedDB';

export interface AttachmentFile {
  id: string; // Unique ID untuk tracking
  file: File;
  category: 'proposal' | 'ktm' | 'tambahan';
  preview?: string;
}

// Interface untuk menyimpan metadata file di localStorage
interface AttachmentMetadata {
  id: string; // Unique ID untuk tracking
  name: string;
  size: number;
  type: string;
  category: 'proposal' | 'ktm' | 'tambahan';
  lastModified: number;
  dataUrl: string; // Base64 untuk restore file (hanya untuk file kecil)
  storedInIndexedDB?: boolean; // Flag untuk menandai file besar yang disimpan di IndexedDB
}

interface PKLFormState {
  currentStep: number;
  formData: Record<string, any>;
  attachments: AttachmentFile[];
  _hasHydrated: boolean; // Flag to track hydration
  setCurrentStep: (step: number) => void;
  setFormData: (data: Record<string, any>) => void;
  addAttachment: (file: File, category: 'proposal' | 'ktm' | 'tambahan') => Promise<void>;
  removeAttachment: (id: string) => void;
  updateAttachmentCategory: (id: string, category: 'proposal' | 'ktm' | 'tambahan') => void;
  resetForm: () => void;
  restoreAttachments: () => Promise<void>; // Method to restore attachments from localStorage and IndexedDB
  cleanupOldAttachments: () => void; // Method to cleanup old localStorage entries
  // Helper untuk convert File ke base64
  fileToBase64: (file: File) => Promise<string>;
  // Helper untuk convert base64 kembali ke File
  base64ToFile: (base64: string, filename: string, mimeType: string) => File;
}

// Helper functions
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
        // Generate unique ID
        const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Create preview for images and PDFs
        const preview = file.type.startsWith('image/') || file.type === 'application/pdf' 
          ? URL.createObjectURL(file) 
          : undefined;
        
        // For 'proposal' and 'ktm', replace existing file with same category
        // For 'tambahan', add new file (can have multiple)
        const isReplaceCategory = category === 'proposal' || category === 'ktm';
        
        set((state) => {
          let newAttachments = [...state.attachments];
          
          if (isReplaceCategory) {
            // Remove existing file with same category
            const existingIndex = newAttachments.findIndex(att => att.category === category);
            if (existingIndex !== -1) {
              const existing = newAttachments[existingIndex];
              // Revoke preview URL
              if (existing.preview) {
                URL.revokeObjectURL(existing.preview);
              }
              // Remove from state
              newAttachments.splice(existingIndex, 1);
              
              // Also remove from localStorage metadata
              try {
                const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
                const filteredMetadata = storedMetadata.filter(meta => meta.id !== existing.id);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(filteredMetadata));
              } catch (error) {
                console.error('[PKL Store] Error removing old metadata:', error);
              }
            }
          }
          
          // Add new attachment to state immediately (for UI feedback)
          newAttachments.push({ id, file, category, preview });
          
          return { attachments: newAttachments };
        });
        
        // Only convert to base64 for small files (< 1MB) to avoid localStorage quota issues
        const MAX_BASE64_SIZE = 1024 * 1024; // 1MB
        const isSmallFile = file.size < MAX_BASE64_SIZE;
        
        try {
          let dataUrl: string | undefined;
          
          if (isSmallFile) {
            // For small files, convert to base64 and store in localStorage
            try {
              dataUrl = await fileToBase64(file);
            } catch (error) {
              console.warn(`[PKL Store] Failed to convert small file to base64: ${file.name}`, error);
            }
          } else {
            // For large files, store the File object directly in IndexedDB
            console.log(`[PKL Store] File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB) for localStorage. Storing in IndexedDB...`);
            try {
              // Store file in IndexedDB
              await IndexedDB.storeFile(id, file, category);
              console.log(`[PKL Store] Large file stored in IndexedDB: ${file.name}`);
            } catch (indexedDBError) {
              console.error('[PKL Store] Failed to store file in IndexedDB:', indexedDBError);
              // Continue anyway - file is already in state for UI feedback
            }
          }
          
          const metadata: AttachmentMetadata = {
            id,
            name: file.name,
            size: file.size,
            type: file.type,
            category,
            lastModified: file.lastModified,
            dataUrl: dataUrl || '', // Empty string for large files
            storedInIndexedDB: !isSmallFile, // Mark large files as stored in IndexedDB
          };
          
          // Store metadata in localStorage separately
          // Only store metadata (without dataUrl) for large files to save space
          try {
            const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
            
            // For replace categories, also remove old metadata from localStorage and IndexedDB
            if (isReplaceCategory) {
              const oldFiles = storedMetadata.filter(meta => meta.category === category);
              // Remove old files from IndexedDB
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
            
            // For large files, don't include dataUrl in metadata to save space
            const metadataToStore = isSmallFile && dataUrl 
              ? metadata 
              : { ...metadata, dataUrl: '' };
            
            storedMetadata.push(metadataToStore);
            localStorage.setItem('pkl-attachments-metadata', JSON.stringify(storedMetadata));
          } catch (storageError: any) {
            // If localStorage is full, try to clean up old entries or skip storing metadata
            if (storageError.name === 'QuotaExceededError') {
              console.error('[PKL Store] localStorage quota exceeded. Attempting cleanup...');
              
              // Try to remove old entries (keep only last 5 files)
              try {
                const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
                // Keep only the last 5 entries
                const recentMetadata = storedMetadata.slice(-5);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
                
                // Try to add new metadata again
                const metadataToStore = isSmallFile && dataUrl 
                  ? metadata 
                  : { ...metadata, dataUrl: '' };
                recentMetadata.push(metadataToStore);
                localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
                console.log('[PKL Store] Cleaned up old entries and saved new metadata');
              } catch (cleanupError) {
                console.error('[PKL Store] Failed to cleanup localStorage:', cleanupError);
                // Still add to state even if we can't save to localStorage
              }
            } else {
              throw storageError;
            }
          }
        } catch (error) {
          console.error('[PKL Store] Error in addAttachment:', error);
          // State already updated above, so we don't need to update again
        }
      },
      removeAttachment: (id) => {
        set((state) => {
          const attachmentToRemove = state.attachments.find(att => att.id === id);
          if (attachmentToRemove?.preview) {
            URL.revokeObjectURL(attachmentToRemove.preview);
          }
          
          // Remove from localStorage metadata by ID
          const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
          const fileToRemove = storedMetadata.find(meta => meta.id === id);
          
          // Remove from IndexedDB if it's stored there
          if (fileToRemove?.storedInIndexedDB) {
            IndexedDB.deleteFile(id).catch(error => {
              console.error(`[PKL Store] Error deleting file from IndexedDB: ${id}`, error);
            });
          }
          
          const filteredMetadata = storedMetadata.filter(meta => meta.id !== id);
          localStorage.setItem('pkl-attachments-metadata', JSON.stringify(filteredMetadata));
          
          // Remove from state
          const newAttachments = state.attachments.filter(att => att.id !== id);
          return { attachments: newAttachments };
        });
      },
      updateAttachmentCategory: (id, category) => {
        set((state) => {
          const newAttachments = state.attachments.map(att => 
            att.id === id ? { ...att, category } : att
          );
          
          // Update in localStorage metadata by ID
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
          // Clear localStorage metadata
          localStorage.removeItem('pkl-attachments-metadata');
          // Clear IndexedDB
          IndexedDB.clearAllFiles().catch(error => {
            console.error('[PKL Store] Error clearing IndexedDB:', error);
          });
          return { currentStep: 1, formData: {}, attachments: [], _hasHydrated: false };
        });
      },
      // Helper function to cleanup old localStorage entries
      cleanupOldAttachments: () => {
        try {
          const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
          // Keep only the last 10 entries to prevent quota issues
          if (storedMetadata.length > 10) {
            const recentMetadata = storedMetadata.slice(-10);
            localStorage.setItem('pkl-attachments-metadata', JSON.stringify(recentMetadata));
            console.log(`[PKL Store] Cleaned up ${storedMetadata.length - 10} old attachment entries`);
          }
        } catch (error) {
          console.error('[PKL Store] Error cleaning up old attachments:', error);
        }
      },
      restoreAttachments: async () => {
        // This method will be called after hydration to restore attachments
        // Use set directly, no need for get() since we're already in the store context
        
        // Check if already hydrated first
        const currentState = get();
        if (currentState._hasHydrated) {
          console.log('[PKL Store] restoreAttachments: Already hydrated, skipping');
          return;
        }
        
        console.log('[PKL Store] restoreAttachments: Starting restore...');
        
        try {
            const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]') as AttachmentMetadata[];
            console.log('[PKL Store] restoreAttachments: Found metadata', { count: storedMetadata.length });
            
            if (storedMetadata.length > 0) {
              // Separate small files (with dataUrl) and large files (stored in IndexedDB)
              const smallFiles = storedMetadata.filter(meta => meta.dataUrl && meta.dataUrl !== '' && !meta.storedInIndexedDB);
              const largeFiles = storedMetadata.filter(meta => meta.storedInIndexedDB === true);
              
              console.log(`[PKL Store] Found ${smallFiles.length} small files (localStorage) and ${largeFiles.length} large files (IndexedDB)`);
              
              // Combine small and large files
              const allMetadata = [...smallFiles, ...largeFiles];
              
              // For 'proposal' and 'ktm', only keep the latest one (most recent lastModified)
              // For 'tambahan', keep all
              const proposalFiles = allMetadata.filter(m => m.category === 'proposal');
              const ktmFiles = allMetadata.filter(m => m.category === 'ktm');
              const tambahanFiles = allMetadata.filter(m => m.category === 'tambahan');
              
              // Get the latest file for each replace category
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
              
              // Combine: latest proposal, latest ktm, and all tambahan
              const metadataToRestore = [
                ...(latestProposal ? [latestProposal] : []),
                ...(latestKtm ? [latestKtm] : []),
                ...tambahanFiles
              ];
              
              if (proposalFiles.length > 1 || ktmFiles.length > 1) {
                console.log(`[PKL Store] Found multiple files for replace categories. Keeping only latest:`, {
                  proposal: latestProposal?.name || 'none',
                  ktm: latestKtm?.name || 'none',
                  removed: {
                    proposal: proposalFiles.length - (latestProposal ? 1 : 0),
                    ktm: ktmFiles.length - (latestKtm ? 1 : 0)
                  }
                });
              }
              
              // Restore files: small files from base64, large files from IndexedDB
              const restoredAttachments: AttachmentFile[] = [];
              
              for (const meta of metadataToRestore) {
                try {
                  let file: File | null = null;
                  
                  if (meta.storedInIndexedDB) {
                    // Restore large file from IndexedDB
                    file = await IndexedDB.getFile(meta.id);
                    if (!file) {
                      console.warn(`[PKL Store] Large file not found in IndexedDB: ${meta.name}. Skipping.`);
                      continue;
                    }
                    console.log(`[PKL Store] Restored large file from IndexedDB: ${meta.name}`);
                  } else if (meta.dataUrl && meta.dataUrl !== '') {
                    // Restore small file from base64
                    file = base64ToFile(meta.dataUrl, meta.name, meta.type);
                    console.log(`[PKL Store] Restored small file from localStorage: ${meta.name}`);
                  } else {
                    console.warn(`[PKL Store] No data available for file: ${meta.name}. Skipping.`);
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
              
              console.log('[PKL Store] restoreAttachments: Successfully restored', { 
                total: storedMetadata.length, 
                restored: restoredAttachments.length 
              });
              
              // Cleanup localStorage: remove old files that were not restored
              // Keep only the restored files in localStorage
              try {
                const restoredIds = new Set(restoredAttachments.map(att => att.id));
                const cleanedMetadata = storedMetadata.filter(meta => restoredIds.has(meta.id));
                
                if (cleanedMetadata.length < storedMetadata.length) {
                  localStorage.setItem('pkl-attachments-metadata', JSON.stringify(cleanedMetadata));
                  console.log(`[PKL Store] Cleaned up ${storedMetadata.length - cleanedMetadata.length} old files from localStorage`);
                }
              } catch (error) {
                console.error('[PKL Store] Error cleaning up localStorage during restore:', error);
              }
              
              // Update state with restored attachments
              set({ 
                attachments: restoredAttachments, 
                _hasHydrated: true 
              });
            } else {
              console.log('[PKL Store] restoreAttachments: No metadata found');
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
        // Jangan persist _hasHydrated - harus selalu false saat pertama kali load
        // Attachments akan di-restore dari localStorage metadata via restoreAttachments()
      }),
      // Restore attachments from metadata on hydration
      onRehydrateStorage: () => {
        // This callback runs after initial hydration
        // We'll restore attachments directly here
        return (state) => {
          console.log('[PKL Store] onRehydrateStorage called', { state: state ? 'exists' : 'null', hasHydrated: state?._hasHydrated });
          
          // Cleanup old entries first to free up space
          if (typeof window !== 'undefined') {
            const currentState = usePKLFormStore.getState();
            if (currentState) {
              currentState.cleanupOldAttachments();
            }
          }
          
          // Always try to restore if state exists (regardless of _hasHydrated flag)
          // because _hasHydrated is not persisted, so it will always be false on first load
          if (state) {
            // Restore attachments immediately after hydration
            // Use requestIdleCallback or setTimeout to ensure this runs after React render
            if (typeof window !== 'undefined') {
              const restore = () => {
                console.log('[PKL Store] Attempting to restore attachments...');
                // Access the store instance using the exported store
                const currentState = usePKLFormStore.getState();
                console.log('[PKL Store] Current state before restore', { 
                  hasHydrated: currentState?._hasHydrated,
                  attachmentsCount: currentState?.attachments?.length || 0 
                });
                
                if (currentState) {
                  // Check localStorage directly
                  const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]');
                  console.log('[PKL Store] Found metadata in localStorage', { count: storedMetadata.length });
                  
                  if (!currentState._hasHydrated) {
                    currentState.restoreAttachments().catch(error => {
                      console.error('[PKL Store] Error in restoreAttachments:', error);
                    });
                    console.log('[PKL Store] restoreAttachments() called');
                  } else {
                    console.log('[PKL Store] Already hydrated, skipping restore');
                  }
                }
              };
              
              // Try requestIdleCallback first, fallback to setTimeout
              if (window.requestIdleCallback) {
                window.requestIdleCallback(restore, { timeout: 1000 });
              } else {
                setTimeout(restore, 100);
              }
            }
          }
        };
      },
    }
  )
);
