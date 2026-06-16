import Dexie, { Table } from 'dexie';

// PatientMedicine interface matching API response fields
export interface PatientMedicine {
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
export interface PatientMedicineSyncMetadata {
  id?: number;
  lastSync: number; // Unix timestamp
  totalCount: number; // TotalCount from API
  updatedBy?: string; // Who last updated the data
}

// PatientMedicineDB for storing patient medicine data (separate from AI Pharmacy)
class PatientMedicineDatabase extends Dexie {
  medicines!: Table<PatientMedicine, number>;

  constructor() {
    super('PatientMedicineDB'); // Different database name from MedicineDB
    this.version(1).stores({
      medicines: '++id, rowID, SKU_ID, Name, Category, MedicineType, Manufacturer'
    });
  }
}

// PatientMedicineMetaDB for storing metadata
class PatientMedicineMetaDatabase extends Dexie {
  metadata!: Table<PatientMedicineSyncMetadata, number>;

  constructor() {
    super('PatientMedicineMetaDB'); // Different from MetaDB
    this.version(1).stores({
      metadata: '++id, lastSync'
    });
  }
}

export const patientMedicineDB = new PatientMedicineDatabase();
export const patientMedicineMetaDB = new PatientMedicineMetaDatabase();
