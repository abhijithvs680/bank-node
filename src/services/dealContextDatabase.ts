import Dexie, { Table } from 'dexie';

export interface DealDataset {
  source_file: string;
  linked_by: string;
  columns: string[];
  rows: Record<string, string>[];
}

export interface DealContextRecord {
  dealId: string;
  datasets: DealDataset[];
  loadedAt: number;
}

class DealContextDatabase extends Dexie {
  dealContexts!: Table<DealContextRecord, string>;

  constructor() {
    super('DealContextDB');
    this.version(1).stores({
      dealContexts: 'dealId, loadedAt',
    });
  }
}

export const dealContextDB = new DealContextDatabase();
