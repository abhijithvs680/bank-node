import Fuse from 'fuse.js';
import { servicesDB, servicesMetaDB, LabService } from './servicesDatabase';

const dummyServices: LabService[] = [
  {
    rowID: "s1",
    'Item Code': "ITM-ECG",
    'Service Name': "Electrocardiogram (ECG)",
    'Service Categories': "Cardiology",
    'Department Name': "Diagnostics",
    'Master Name': "Electrocardiogram",
    Code: "ECG",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "ECG Machine",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Cardiology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "500",
    'IP TARIFF': "600",
    'OP TARIFF': "500",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s2",
    'Item Code': "ITM-XR-CHEST",
    'Service Name': "X-Ray Chest PA View",
    'Service Categories': "Radiology",
    'Department Name': "Diagnostics",
    'Master Name': "Chest X-Ray",
    Code: "XR-CHEST",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "X-Ray Machine",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Radiology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "800",
    'IP TARIFF': "950",
    'OP TARIFF': "800",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s3",
    'Item Code': "ITM-CBC",
    'Service Name': "Complete Blood Count (CBC)",
    'Service Categories': "Pathology",
    'Department Name': "Diagnostics",
    'Master Name': "Hemogram",
    Code: "CBC",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "Cell Counter",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Pathology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "300",
    'IP TARIFF': "350",
    'OP TARIFF': "300",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s4",
    'Item Code': "ITM-LIPID",
    'Service Name': "Lipid Profile",
    'Service Categories': "Pathology",
    'Department Name': "Diagnostics",
    'Master Name': "Lipid Panel",
    Code: "LIPID",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "Analyzer",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Pathology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "600",
    'IP TARIFF': "700",
    'OP TARIFF': "600",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s5",
    'Item Code': "ITM-TSH",
    'Service Name': "Thyroid Stimulating Hormone (TSH)",
    'Service Categories': "Pathology",
    'Department Name': "Diagnostics",
    'Master Name': "TSH Test",
    Code: "TSH",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "Analyzer",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Pathology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "450",
    'IP TARIFF': "500",
    'OP TARIFF': "450",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s6",
    'Item Code': "ITM-BMP",
    'Service Name': "Basic Metabolic Panel (BMP)",
    'Service Categories': "Pathology",
    'Department Name': "Diagnostics",
    'Master Name': "Metabolic Panel",
    Code: "BMP",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "Analyzer",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Pathology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "550",
    'IP TARIFF': "650",
    'OP TARIFF': "550",
    'SIGA SCAN': "N"
  },
  {
    rowID: "s7",
    'Item Code': "ITM-LFT",
    'Service Name': "Liver Function Test (LFT)",
    'Service Categories': "Pathology",
    'Department Name': "Diagnostics",
    'Master Name': "Liver Panel",
    Code: "LFT",
    'Master Type': "Test",
    'Doctor Share': "0",
    Orderable: "Y",
    'Rate Editable': "N",
    Equipment: "Analyzer",
    'Bed Charge': "0",
    'Night Charge': "0",
    'Surgical Procedure': "N",
    'Doctor Display': "Y",
    'Sub Department': "Pathology Diagnostics",
    'DIALYSIS OP': "N",
    'INSURANCE TARIFF': "700",
    'IP TARIFF': "800",
    'OP TARIFF': "700",
    'SIGA SCAN': "N"
  }
];

export class ServicesSearchService {
  private fuseInstance: Fuse<LabService> | null = null;
  private syncInProgress: boolean = false;
  private isDataReady: boolean = false;

  private fuseOptions = {
    keys: [
      { name: 'Service Name', weight: 2 },
      { name: 'Master Name', weight: 1.8 },
      { name: 'Sub Department', weight: 1.2 },
      { name: 'Item Code', weight: 1 },
      { name: 'Service Categories', weight: 0.8 },
      { name: 'Code', weight: 0.7 }
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true
  };

  isSyncing(): boolean {
    return this.syncInProgress;
  }

  async initializeData(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const count = await servicesDB.services.count();
      if (count === 0) {
        console.log('[ServicesSearchService] Seeding lab services...');
        await servicesDB.services.bulkAdd(dummyServices);
        
        await servicesMetaDB.metadata.clear();
        await servicesMetaDB.metadata.add({
          lastSync: Date.now(),
          totalCount: dummyServices.length
        });
      }
      
      await this.loadFuseInstance();
      this.isDataReady = true;
      
      // Dispatch completion event
      document.dispatchEvent(new CustomEvent('services-sync-complete', {
        detail: { totalCount: dummyServices.length, syncType: 'full' }
      }));
    } catch (e) {
      console.error('[ServicesSearchService] Initialization error:', e);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async loadFuseInstance(): Promise<void> {
    try {
      const services = await servicesDB.services.toArray();
      console.log(`[ServicesSearchService] Loaded ${services.length} services into Fuse.js`);
      this.fuseInstance = new Fuse(services, this.fuseOptions);
    } catch (error) {
      console.error('[ServicesSearchService] Error loading Fuse instance:', error);
      throw error;
    }
  }

  async isReady(): Promise<boolean> {
    if (this.isDataReady) return true;
    const count = await servicesDB.services.count();
    this.isDataReady = count > 0;
    return this.isDataReady;
  }

  async search(query: string, limit: number = 10): Promise<LabService[]> {
    if (!this.fuseInstance) {
      const count = await servicesDB.services.count();
      if (count === 0) return [];
      await this.loadFuseInstance();
    }
    
    if (!this.fuseInstance) return [];
    
    const results = this.fuseInstance.search(query, { limit });
    return results.map(result => result.item);
  }

  async getServiceByName(name: string): Promise<LabService | undefined> {
    return await servicesDB.services
      .filter(service => service['Service Name'].toLowerCase() === name.toLowerCase())
      .first();
  }

  async getAllServices(): Promise<LabService[]> {
    return await servicesDB.services.toArray();
  }
  
  destroy(): void {
    // No worker to destroy
  }
}

export const servicesSearchService = new ServicesSearchService();
