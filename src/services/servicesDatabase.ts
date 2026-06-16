import Dexie, { Table } from 'dexie';

// LabService interface matching API response fields
export interface LabService {
  id?: number;
  rowID: string;
  'Item Code': string;
  'Service Name': string;
  'Service Categories': string;
  'Department Name': string;
  'Master Name': string;
  Code: string;
  'Master Type': string;
  'Doctor Share': string;
  Orderable: string;
  'Rate Editable': string;
  Equipment: string;
  'Bed Charge': string;
  'Night Charge': string;
  'Surgical Procedure': string;
  'Doctor Display': string;
  'Sub Department': string;
  'DIALYSIS OP': string;
  'INSURANCE TARIFF': string;
  'IP TARIFF': string;
  'OP TARIFF': string;
  'SIGA SCAN': string;
  status?: string;
  [key: string]: any;
}

// Metadata for sync tracking
export interface ServicesSyncMetadata {
  id?: number;
  lastSync: number; // Unix timestamp
  totalCount: number; // TotalCount from API
  updatedBy?: string; // Who last updated the data
}

// ServicesDB for storing lab test/services data
class ServicesDatabase extends Dexie {
  services!: Table<LabService, number>;

  constructor() {
    super('ServicesDB');
    this.version(1).stores({
      services: '++id, rowID'
    });
  }
}

// ServicesMetaDB for storing metadata
class ServicesMetaDatabase extends Dexie {
  metadata!: Table<ServicesSyncMetadata, number>;

  constructor() {
    super('ServicesMetaDB');
    this.version(1).stores({
      metadata: '++id, lastSync'
    });
  }
}

export const servicesDB = new ServicesDatabase();
export const servicesMetaDB = new ServicesMetaDatabase();
