import Dexie, { Table } from 'dexie';

// Medicine interface matching API response fields
export interface Medicine {
  id?: number;
  rowID: string;
  Name: string;
  Description: string;
  Composition: string;
  SKU_ID?: string;
  Category: string;
  MedicineType: string;
  Manufacturer: string;
  status?: string;
  [key: string]: any;
}

// Metadata for sync tracking
export interface SyncMetadata {
  id?: number;
  lastSync: number; // Unix timestamp
  totalCount: number; // TotalCount from API
  updatedBy?: string; // Who last updated the data
}

// MedicineDB for storing medicine data
class MedicineDatabase extends Dexie {
  medicines!: Table<Medicine, number>;

  constructor() {
    super('MedicineDB');
    this.version(3).stores({
      medicines: '++id, rowID, SKU_ID, Name, Category, MedicineType, Manufacturer'
    });
  }
}
// MetaDB for storing metadata
class MetaDatabase extends Dexie {
  metadata!: Table<SyncMetadata, number>;

  constructor() {
    super('MetaDB');
    this.version(1).stores({
      metadata: '++id, lastSync'
    });
  }
}

export const medicineDB = new MedicineDatabase();
export const metaDB = new MetaDatabase();
