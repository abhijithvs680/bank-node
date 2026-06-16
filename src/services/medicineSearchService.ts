import Fuse from 'fuse.js';
import { medicineDB, metaDB, Medicine } from './medicineDatabase';
import { authService } from './authService';

// Worker message types
interface WorkerResponse {
  type: 'FULL_SYNC_BATCH' | 'FULL_SYNC_COMPLETE' | 'INCREMENTAL_UPDATE' | 'SYNC_ERROR' | 'AUTH_ERROR';
  payload: any;
}

export class MedicineSearchService {
  private fuseInstance: Fuse<Medicine> | null = null;
  private worker: Worker | null = null;
  private syncInProgress: boolean = false;

  // Fuse.js configuration
  private fuseOptions = {
    keys: [
      { name: 'Name', weight: 2 },
      { name: 'Description', weight: 1.5 },
      { name: 'Composition', weight: 1.2 },
      { name: 'SKU_ID', weight: 1.1 },
      { name: 'Category', weight: 1 },
      { name: 'MedicineType', weight: 1 },
      { name: 'Manufacturer', weight: 0.8 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  };

  constructor() {
    this.initializeWorker();
  }

  /**
   * Initialize Web Worker
   */
  private initializeWorker(): void {
    try {
      this.worker = new Worker(
        new URL('../workers/medicineSyncWorker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      });
      
      this.worker.addEventListener('error', (error) => {
        console.error('[Search Service] Worker error:', error);
        this.syncInProgress = false;
      });
      
      console.log('[Search Service] Worker initialized');
    } catch (error) {
      console.error('[Search Service] Failed to initialize worker:', error);
    }
  }

  /**
   * Handle messages from Web Worker
   */
  private async handleWorkerMessage(message: WorkerResponse): Promise<void> {
    const { type, payload } = message;
    
    switch (type) {
      case 'AUTH_ERROR':
        console.log('[Search Service] Auth error, refreshing token...');
        
        try {
          await authService.refreshAccessToken();
          
          const newToken = authService.getToken();
          if (newToken) {
            console.log('[Search Service] Token refreshed, retrying sync...');
            
            const medicineCount = await medicineDB.medicines.count();
            
            if (medicineCount === 0) {
              // Retry full sync
              this.worker?.postMessage({
                type: 'START_FULL_SYNC',
                payload: {
                  apiBase: window.location.origin || 'https://innov-dev.beta.injomo.com',
                  authToken: newToken
                }
              });
            } else {
              // Retry incremental sync
              const metadata = await metaDB.metadata.toArray();
              const storedLastSync = metadata.length > 0 ? metadata[0].lastSync : 0;
              
              this.worker?.postMessage({
                type: 'CHECK_METADATA',
                payload: {
                  lastSync: storedLastSync,
                  apiBase: window.location.origin || 'https://innov-dev.beta.injomo.com',
                  authToken: newToken
                }
              });
            }
          }
        } catch (error) {
          console.error('[Search Service] Token refresh failed:', error);
          this.syncInProgress = false;
          
          document.dispatchEvent(new CustomEvent('medicine-sync-error', {
            detail: { error: 'Authentication failed. Please login again.' }
          }));
        }
        break;
      
      case 'FULL_SYNC_BATCH':
        console.log('[Search Service] Processing full sync batch:', payload.current, '/', payload.total);
        
        // Process batch using rowID-based deduplication
        await this.processBatchWithDeduplication(payload.batch);
        
        // Dispatch progress event
        document.dispatchEvent(new CustomEvent('medicine-sync-progress', {
          detail: { 
            current: payload.current, 
            total: payload.total,
            syncType: 'full'
          }
        }));
        break;
      
      case 'FULL_SYNC_COMPLETE':
        console.log('[Search Service] Full sync complete:', payload.totalCount, 'records');
        
        // Update metadata with current timestamp
        await metaDB.metadata.clear();
        await metaDB.metadata.add({
          lastSync: Date.now(),
          totalCount: payload.totalCount
        });
        
        // Reload Fuse instance
        await this.loadFuseInstance();
        
        this.syncInProgress = false;
        
        // Dispatch completion event
        document.dispatchEvent(new CustomEvent('medicine-sync-complete', {
          detail: { 
            totalCount: payload.totalCount,
            syncType: 'full'
          }
        }));
        break;
      
      case 'INCREMENTAL_UPDATE':
        console.log('[Search Service] Processing incremental update:', payload.count, 'records');
        
        if (payload.count > 0) {
          // Process using rowID-based deduplication
          await this.processBatchWithDeduplication(payload.records);
          
          // Dispatch progress event
          document.dispatchEvent(new CustomEvent('medicine-sync-progress', {
            detail: { 
              current: payload.count, 
              total: payload.count,
              syncType: 'incremental'
            }
          }));
        }
        
        // Update metadata with current timestamp
        await metaDB.metadata.clear();
        await metaDB.metadata.add({
          lastSync: Date.now(),
          totalCount: (await medicineDB.medicines.count())
        });
        
        // Reload Fuse instance
        await this.loadFuseInstance();
        
        this.syncInProgress = false;
        
        // Dispatch completion event
        document.dispatchEvent(new CustomEvent('medicine-sync-complete', {
          detail: { 
            updatedCount: payload.count,
            syncType: 'incremental'
          }
        }));
        break;
        
      case 'SYNC_ERROR':
        console.error('[Search Service] Sync error:', payload.error);
        this.syncInProgress = false;
        
        document.dispatchEvent(new CustomEvent('medicine-sync-error', {
          detail: { error: payload.error }
        }));
        break;
    }
  }

  /**
   * Initialize and sync medicine data with smart sync detection
   */
  async initializeData(): Promise<void> {
    if (this.syncInProgress) {
      console.log('[Search Service] Sync already in progress');
      return;
    }
    
    if (!this.worker) {
      console.error('[Search Service] Worker not initialized');
      return;
    }
    
    // Get auth token
    const authToken = authService.getToken();
    if (!authToken) {
      console.warn('[Search Service] No auth token available, skipping sync');
      return;
    }
    
    this.syncInProgress = true;
    
    // Check if database is empty
    const medicineCount = await medicineDB.medicines.count();
    
    if (medicineCount === 0) {
      // Database is empty - perform FULL SYNC
      console.log('[Search Service] Database empty, starting FULL SYNC...');
      
      document.dispatchEvent(new CustomEvent('medicine-sync-start', {
        detail: { syncType: 'full' }
      }));
      
      this.worker.postMessage({
        type: 'START_FULL_SYNC',
        payload: {
          apiBase: import.meta.env.VITE_API_BASE || 'https://innov-dev.beta.injomo.com',
          authToken
        }
      });
    } else {
      // Database has data - perform INCREMENTAL SYNC
      console.log('[Search Service] Database has data, checking for updates...');
      
      document.dispatchEvent(new CustomEvent('medicine-sync-start', {
        detail: { syncType: 'incremental' }
      }));
      
      const metadata = await metaDB.metadata.toArray();
      const storedLastSync = metadata.length > 0 ? metadata[0].lastSync : 0;
      
      this.worker.postMessage({
        type: 'CHECK_METADATA',
        payload: {
          lastSync: storedLastSync,
          apiBase: window.location.origin || 'https://innov-dev.beta.injomo.com',
          authToken
        }
      });
    }
  }

  /**
   * Process batch with rowID-based deduplication
   */
  private async processBatchWithDeduplication(batch: Medicine[]): Promise<void> {
    let insertCount = 0;
    let updateCount = 0;
    let deleteCount = 0;
    let skipCount = 0;
    try {
      const beforeCount = await medicineDB.medicines.count();
      console.log(`[Search Service] Processing batch of ${batch.length} items (DB has ${beforeCount} records before)`);

      await medicineDB.transaction('rw', medicineDB.medicines, async () => {
        for (const rawItem of batch) {
          try {
            // Normalize item (support different casing from API)
            const itemAny = rawItem as any;
            const rowID = itemAny.rowID ?? itemAny.RowID ?? itemAny.row_id ?? itemAny.rowId ?? itemAny.id;

            if (!rowID && itemAny.status !== 'delete') {
              // If there's no identifier and it's not a delete, skip and log
              console.warn('[Search Service] Skipping item without rowID:', itemAny);
              skipCount++;
              continue;
            }

            if (itemAny.status === 'delete') {
              if (!rowID) {
                skipCount++;
                continue;
              }

              const existing = await medicineDB.medicines.where('rowID').equals(rowID).first();
              if (existing && existing.id) {
                await medicineDB.medicines.delete(existing.id);
                deleteCount++;
              } else {
                skipCount++;
              }
            } else {
              const existing = await medicineDB.medicines.where('rowID').equals(rowID).first();

              const item = { ...itemAny } as any;
              // Always remove incoming API `id` to avoid primary-key collisions
              if ('id' in item) delete item.id;
              // Ensure rowID is set on the object we store
              item.rowID = rowID;

              if (existing && existing.id) {
                await medicineDB.medicines.update(existing.id, item);
                updateCount++;
              } else {
                await medicineDB.medicines.add(item);
                insertCount++;
              }
            }
          } catch (err) {
            console.error('[Search Service] Error processing batch item:', err, 'item:', rawItem);
            skipCount++;
          }
        }
      });

      const afterCount = await medicineDB.medicines.count();
      console.log(`[Search Service] Batch processed - Inserted: ${insertCount}, Updated: ${updateCount}, Deleted: ${deleteCount}, Skipped: ${skipCount} (DB now ${afterCount} records)`);

      if (insertCount === 0 && updateCount === 0 && deleteCount === 0) {
        console.warn('[Search Service] No changes applied for this batch — check incoming batch structure and rowID field names.');
      }
    } catch (transactionError) {
      console.error('[Search Service] Transaction failed while processing batch:', transactionError);
    }
  }

  /**
   * Load all medicines from IndexedDB into Fuse.js
   */
  private async loadFuseInstance(): Promise<void> {
    try {
      const medicines = await medicineDB.medicines.toArray();
      console.log(`[Search Service] Loaded ${medicines.length} medicines into Fuse.js`);
      
      this.fuseInstance = new Fuse(medicines, this.fuseOptions);
    } catch (error) {
      console.error('[Search Service] Error loading Fuse instance:', error);
      throw error;
    }
  }

  /**
   * Search medicines using Fuse.js fuzzy search
   */
  async search(query: string, limit: number = 10): Promise<Medicine[]> {
    if (!this.fuseInstance) {
      console.warn('[Search Service] Fuse instance not initialized, initializing now...');
      await this.loadFuseInstance();
    }
    
    if (!this.fuseInstance) {
      throw new Error('Failed to initialize search');
    }
    
    const results = this.fuseInstance.search(query, { limit });
    return results.map(result => result.item);
  }

  /**
   * Get exact medicine by name
   */
  async getMedicineByName(name: string): Promise<Medicine | undefined> {
    return await medicineDB.medicines
      .where('Name')
      .equalsIgnoreCase(name)
      .first();
  }

  /**
   * Get all medicines
   */
  async getAllMedicines(): Promise<Medicine[]> {
    return await medicineDB.medicines.toArray();
  }
  
  /**
   * Cleanup - terminate worker
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Singleton instance
export const medicineSearchService = new MedicineSearchService();
