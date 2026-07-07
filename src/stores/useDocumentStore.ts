import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { Document, DocumentStatus } from '../types';
import { toast } from 'sonner';

interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  addDocument: (data: Omit<Document, 'id' | 'status'>) => Promise<Document | null>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  getDocumentsByEntite: (entiteId: string) => Document[];
  updateDocumentStatuses: () => void;
  fetchDocuments: () => Promise<void>;
}

const calculateStatus = (dateExpiration: string): DocumentStatus => {
  if (!dateExpiration) return 'valide';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateExpiration);
  expDate.setHours(0, 0, 0, 0);
  
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expire';
  if (diffDays <= 30) return 'expire_bientot';
  return 'valide';
};

export const useDocumentStore = create<DocumentStore>()(
  immer((set, get) => ({
    documents: [],
    isLoading: false,
    fetchDocuments: async () => {
      set({ isLoading: true });
      let attempts = 0;
      const maxAttempts = 3;
      const retryDelay = 1500;

      const performFetch = async () => {
        try {
          const response = await fetch('/api/documents');
          if (response.ok) {
            const documents = await response.json();
            set({ documents });

            // Backward compatibility check and recovery from older Zustand store
          // Check BOTH server legacy store and browser localStorage for lost data
          const migrateFromSource = async (sourceUrlOrName: string, sourceLabel: string, isApi: boolean) => {
            try {
              let legacyData: any = null;
              if (isApi) {
                const res = await fetch(sourceUrlOrName);
                if (res.ok) legacyData = await res.json();
              } else {
                const localStr = localStorage.getItem(sourceUrlOrName);
                if (localStr) legacyData = JSON.parse(localStr);
              }

              if (!legacyData) return;

              // Check for documents in standard state.documents or nested in other stores
              let legacyDocs = (legacyData.state && legacyData.state.documents) || [];
              
              // Deep scan for arrays that look like documents if not found in standard place
              if (legacyDocs.length === 0 && legacyData.state) {
                for (const key in legacyData.state) {
                  const val = legacyData.state[key];
                  if (Array.isArray(val) && val.length > 0) {
                    const first = val[0];
                    if (first && typeof first === 'object' && (first.entiteId || (first.type && first.dateExpiration))) {
                      console.log(`Potential documents found in key "${key}" of ${sourceLabel}`);
                      legacyDocs = val;
                      break;
                    }
                  }
                }
              }

              if (legacyDocs.length > 0) {
                const currentDocs = get().documents;
                const missingDocs = legacyDocs.filter((d: any) => {
                  // If it has no ID, we check by entiteId, type and reference to avoid duplicates
                  if (!d.id) {
                    return !currentDocs.some(curr => 
                      curr.entiteId === d.entiteId && 
                      curr.type === d.type && 
                      curr.reference === d.reference
                    );
                  }
                  return !currentDocs.some(curr => curr.id === d.id);
                });
                
                if (missingDocs.length > 0) {
                  console.log(`Found ${missingDocs.length} missing documents in ${sourceLabel}, migrating...`);
                  for (const doc of missingDocs) {
                    // Fix missing entiteType
                    if (!doc.entiteType) {
                      const vehicleDocTypes = ['assurance', 'visite_technique', 'vignette', 'carte_grise', 'carte_carburant'];
                      doc.entiteType = vehicleDocTypes.includes(doc.type) ? 'vehicule' : 'chauffeur';
                    }
                    
                    // Generate ID if missing
                    if (!doc.id) doc.id = nanoid();

                    // Ensure dates are present to avoid DB failures
                    if (!doc.dateEmission) doc.dateEmission = new Date().toISOString().split('T')[0];
                    if (!doc.dateExpiration) {
                      // Default to 1 year from now if missing
                      const nextYear = new Date();
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      doc.dateExpiration = nextYear.toISOString().split('T')[0];
                    }
                    
                    await fetch('/api/documents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(doc)
                    });
                  }
                  // Final refresh
                  const refresh = await fetch('/api/documents');
                  if (refresh.ok) set({ documents: await refresh.json() });
                }
              }
            } catch (e) {
              console.error(`Migration from ${sourceLabel} failed:`, e);
            }
          };

          // Get all store names from API to scan them
          const migrationKey = 'fleetops-migration-conducted';
          if (!localStorage.getItem(migrationKey)) {
            try {
              const storesRes = await fetch('/api/zustand-stores');
              if (storesRes.ok) {
                const storeNames = await storesRes.json();
                for (const name of storeNames) {
                  // Skip current store to avoid infinite recursion or redundant checks
                  if (name === 'fleetops-documents') continue;
                  await migrateFromSource(`/api/zustand/${name}`, `API Store: ${name}`, true);
                }
                
                // Scan common local storage keys
                const commonKeys = ['fleetops-documents', 'fleetops-vehicules', 'fleetops-chauffeurs', 'documents-storage', 'vehicule-storage'];
                for (const key of commonKeys) {
                  await migrateFromSource(key, `LocalStorage: ${key}`, false);
                }
                
                localStorage.setItem(migrationKey, 'true');
              }
            } catch (e) {
              console.error('Failed to list stores for migration:', e);
            }
          }
        }
      } catch (error) {
        if (attempts < maxAttempts) {
            attempts++;
            console.warn(`Fetch documents error, attempt ${attempts}/${maxAttempts}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
            return performFetch();
          }
          console.error('Error fetching documents after retries:', error);
        } finally {
          set({ isLoading: false });
        }
      };

      await performFetch();
    },
    addDocument: async (data) => {
      const document: Document = {
        ...data,
        id: nanoid(),
        status: calculateStatus(data.dateExpiration)
      };
      
      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(document)
        });
        
        if (response.ok) {
          const savedDoc = await response.json();
          set(state => { state.documents.push(savedDoc); });
          toast.success('Document enregistré avec succès');
          return savedDoc;
        } else {
          const errData = await response.json();
          toast.error(`Erreur: ${errData.error || 'Impossible de sauvegarder'}`);
          return null;
        }
      } catch (error) {
        console.error('Error adding document:', error);
        toast.error('Erreur réseau lors de l\'enregistrement');
        return null;
      }
    },
    updateDocument: async (id, data) => {
      const currentDoc = get().documents.find(d => d.id === id);
      if (!currentDoc) return;

      const updatedDoc = { ...currentDoc, ...data };
      if (data.dateExpiration) {
        updatedDoc.status = calculateStatus(data.dateExpiration);
      }

      try {
        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedDoc)
        });
        if (response.ok) {
          set(state => {
            const idx = state.documents.findIndex(d => d.id === id);
            if (idx !== -1) {
              Object.assign(state.documents[idx], data);
              if (data.dateExpiration) {
                state.documents[idx].status = calculateStatus(data.dateExpiration);
              }
            }
          });
          toast.success('Document mis à jour');
        } else {
          toast.error('Erreur lors de la mise à jour');
        }
      } catch (error) {
        console.error('Error updating document:', error);
        toast.error('Erreur réseau lors de la mise à jour');
      }
    },
    deleteDocument: async (id) => {
      try {
        const response = await fetch(`/api/documents/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          set(state => { state.documents = state.documents.filter(d => d.id !== id); });
          toast.success('Document supprimé');
        } else {
          toast.error('Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Erreur réseau lors de la suppression');
      }
    },
    getDocumentsByEntite: (entiteId) => get().documents.filter(d => d.entiteId === entiteId),
    updateDocumentStatuses: () =>
      set(state => {
        state.documents.forEach(doc => {
          doc.status = calculateStatus(doc.dateExpiration);
        });
      }),
  }))
);
