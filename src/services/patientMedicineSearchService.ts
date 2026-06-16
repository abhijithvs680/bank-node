import Fuse from 'fuse.js';
import { patientMedicineDB, patientMedicineMetaDB, PatientMedicine } from './patientMedicineDatabase';

const dummyMedicines: PatientMedicine[] = [
  {
    rowID: "1",
    Name: "Amoxicillin 250mg",
    Description: "Common antibiotic used to treat bacterial infections.",
    Composition: "Amoxicillin Trihydrate",
    SKU_ID: "SKU-AMX-250",
    Category: "Antibiotics",
    MedicineType: "Tablet",
    Manufacturer: "Generic Pharma Corp"
  },
  {
    rowID: "2",
    Name: "Pantoprazole 40mg",
    Description: "Proton pump inhibitor that decreases the amount of acid produced in the stomach.",
    Composition: "Pantoprazole Sodium",
    SKU_ID: "SKU-PTZ-40",
    Category: "Gastrointestinal",
    MedicineType: "Tablet",
    Manufacturer: "Digestive Care Labs"
  },
  {
    rowID: "3",
    Name: "Albuterol Inhaler",
    Description: "Bronchodilator that relaxes muscles in the airways and increases air flow to the lungs.",
    Composition: "Albuterol Sulfate",
    SKU_ID: "SKU-ALB-INH",
    Category: "Respiratory",
    MedicineType: "Inhaler",
    Manufacturer: "AeroHealth Devices"
  },
  {
    rowID: "4",
    Name: "Prednisone 5mg",
    Description: "Corticosteroid used to treat inflammatory conditions.",
    Composition: "Prednisone",
    SKU_ID: "SKU-PRED-5",
    Category: "Corticosteroid",
    MedicineType: "Tablet",
    Manufacturer: "InflamRelief Inc"
  },
  {
    rowID: "5",
    Name: "Metformin 500mg",
    Description: "Oral diabetes medicine that helps control blood sugar levels.",
    Composition: "Metformin Hydrochloride",
    SKU_ID: "SKU-MET-500",
    Category: "Antidiabetic",
    MedicineType: "Tablet",
    Manufacturer: "SugarGuard Labs"
  },
  {
    rowID: "6",
    Name: "Amlodipine 5mg",
    Description: "Calcium channel blocker used to treat high blood pressure.",
    Composition: "Amlodipine Besylate",
    SKU_ID: "SKU-AML-5",
    Category: "Cardiovascular",
    MedicineType: "Tablet",
    Manufacturer: "HeartCare Pharma"
  },
  {
    rowID: "7",
    Name: "Atorvastatin 10mg",
    Description: "Statin medication used to prevent cardiovascular disease and lower lipids.",
    Composition: "Atorvastatin Calcium",
    SKU_ID: "SKU-ATV-10",
    Category: "Cardiovascular",
    MedicineType: "Tablet",
    Manufacturer: "LipidPharma LLC"
  },
  {
    rowID: "8",
    Name: "Lisinopril 10mg",
    Description: "ACE inhibitor used to treat high blood pressure and heart failure.",
    Composition: "Lisinopril",
    SKU_ID: "SKU-LIS-10",
    Category: "Cardiovascular",
    MedicineType: "Tablet",
    Manufacturer: "CardioCare Labs"
  },
  {
    rowID: "9",
    Name: "Ibuprofen 400mg",
    Description: "NSAID used for treating pain, fever, and inflammation.",
    Composition: "Ibuprofen",
    SKU_ID: "SKU-IBU-400",
    Category: "Analgesic",
    MedicineType: "Tablet",
    Manufacturer: "ReliefLabs Inc"
  },
  {
    rowID: "10",
    Name: "Paracetamol 650mg",
    Description: "Analgesic and antipyretic medication used to treat fever and mild to moderate pain.",
    Composition: "Paracetamol",
    SKU_ID: "SKU-PCM-650",
    Category: "Analgesic",
    MedicineType: "Tablet",
    Manufacturer: "FeverGuard Labs"
  }
];

export class PatientMedicineSearchService {
  private fuseInstance: Fuse<PatientMedicine> | null = null;
  private syncInProgress: boolean = false;
  private isDataReady: boolean = false;

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

  isSyncing(): boolean {
    return this.syncInProgress;
  }

  async waitForSync(): Promise<void> {
    return;
  }

  async initializeData(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const count = await patientMedicineDB.medicines.count();
      if (count === 0) {
        console.log('[PatientMedicineSearchService] Seeding patient medicines...');
        await patientMedicineDB.medicines.bulkAdd(dummyMedicines);
        
        await patientMedicineMetaDB.metadata.clear();
        await patientMedicineMetaDB.metadata.add({
          lastSync: Date.now(),
          totalCount: dummyMedicines.length
        });
      }
      
      await this.loadFuseInstance();
      this.isDataReady = true;
      
      // Dispatch completion event
      document.dispatchEvent(new CustomEvent('patient-medicine-sync-complete', {
        detail: { totalCount: dummyMedicines.length, syncType: 'full' }
      }));
    } catch (e) {
      console.error('[PatientMedicineSearchService] Initialization error:', e);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async loadFuseInstance(): Promise<void> {
    try {
      const medicines = await patientMedicineDB.medicines.toArray();
      console.log(`[PatientMedicineSearchService] Loaded ${medicines.length} medicines into Fuse.js`);
      this.fuseInstance = new Fuse(medicines, this.fuseOptions);
    } catch (error) {
      console.error('[PatientMedicineSearchService] Error loading Fuse instance:', error);
      throw error;
    }
  }

  async isReady(): Promise<boolean> {
    if (this.isDataReady) return true;
    const count = await patientMedicineDB.medicines.count();
    this.isDataReady = count > 0;
    return this.isDataReady;
  }

  async search(query: string, limit: number = 10): Promise<PatientMedicine[]> {
    if (!this.fuseInstance) {
      const count = await patientMedicineDB.medicines.count();
      if (count === 0) return [];
      await this.loadFuseInstance();
    }
    
    if (!this.fuseInstance) return [];
    
    const results = this.fuseInstance.search(query, { limit });
    return results.map(result => result.item);
  }

  async getMedicineByName(name: string): Promise<PatientMedicine | undefined> {
    return await patientMedicineDB.medicines
      .where('Name')
      .equalsIgnoreCase(name)
      .first();
  }

  async getAllMedicines(): Promise<PatientMedicine[]> {
    return await patientMedicineDB.medicines.toArray();
  }
  
  destroy(): void {
    // No worker to destroy
  }
}

export const patientMedicineSearchService = new PatientMedicineSearchService();
