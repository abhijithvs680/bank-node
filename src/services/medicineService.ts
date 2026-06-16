interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  commonDosages: string[];
  routes: string[];
  inStock: boolean;
  stockLevel: number;
  lowStockThreshold: number;
}

interface MedicinesResponse {
  medicines: Medicine[];
}

class MedicineService {
  private medicinesCache: Medicine[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getMedicines(): Promise<Medicine[]> {
    // Check if cache is valid
    if (this.medicinesCache && this.cacheTimestamp && 
        (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.medicinesCache;
    }

    try {
      const response = await fetch('./api/medicines.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: MedicinesResponse = await response.json();
      
      // Update cache
      this.medicinesCache = data.medicines;
      this.cacheTimestamp = Date.now();
      
      return data.medicines;
    } catch (error) {
      console.error('Error fetching medicines:', error);
      // Return cached data if available, even if expired
      return this.medicinesCache || [];
    }
  }

  async searchMedicines(query: string): Promise<Medicine[]> {
    const medicines = await this.getMedicines();
    if (!query.trim()) return medicines;

    const searchTerm = query.toLowerCase();
    return medicines.filter(medicine => 
      medicine.name.toLowerCase().includes(searchTerm) ||
      medicine.genericName.toLowerCase().includes(searchTerm)
    );
  }

  async getMedicineById(id: string): Promise<Medicine | null> {
    const medicines = await this.getMedicines();
    return medicines.find(medicine => medicine.id === id) || null;
  }

  async getMedicineByName(name: string): Promise<Medicine | null> {
    const medicines = await this.getMedicines();
    return medicines.find(medicine => 
      medicine.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  clearCache(): void {
    this.medicinesCache = null;
    this.cacheTimestamp = null;
  }
}

export const medicineService = new MedicineService();
export type { Medicine };