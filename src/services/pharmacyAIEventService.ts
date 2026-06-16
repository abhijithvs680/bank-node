import { toast } from "@/hooks/use-toast";
import type {
  PharmacyAIEventData,
  PharmacySearchEvent,
  DrugInteractionEvent,
  StockUpdateEvent,
  MedicineInfoEvent,
  AlternativeMedicationEvent,
  DosageCalculationEvent,
  LowStockAlertEvent
} from "@/types/pharmacyAIEvents";

interface DummyPharmacyItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  stock: number;
  mrp: number;
  composition: string;
  commonDosages: string[];
  routes: string[];
  lowStockThreshold: number;
  recommendedOrderQty: number;
  alternatives?: Array<{ name: string; stock: number; mrp: number; composition?: string }>;
}

const dummyPharmacyItems: DummyPharmacyItem[] = [
  {
    id: "p1",
    name: "Paracetamol 650mg",
    genericName: "Acetaminophen",
    category: "Analgesics",
    stock: 150,
    mrp: 1.5,
    composition: "Paracetamol",
    commonDosages: ["650mg", "500mg"],
    routes: ["Oral"],
    lowStockThreshold: 30,
    recommendedOrderQty: 100,
    alternatives: [
      { name: "Ibuprofen 400mg", stock: 80, mrp: 2.0, composition: "Ibuprofen" },
      { name: "Aceclofenac 100mg", stock: 45, mrp: 3.0, composition: "Aceclofenac" }
    ]
  },
  {
    id: "p2",
    name: "Amoxicillin 250mg",
    genericName: "Amoxicillin",
    category: "Antibiotics",
    stock: 12,
    mrp: 3.5,
    composition: "Amoxicillin Trihydrate",
    commonDosages: ["250mg", "500mg"],
    routes: ["Oral"],
    lowStockThreshold: 30,
    recommendedOrderQty: 80,
    alternatives: [
      { name: "Azithromycin 500mg", stock: 50, mrp: 6.0, composition: "Azithromycin" },
      { name: "Cefixime 200mg", stock: 28, mrp: 5.5, composition: "Cefixime" }
    ]
  },
  {
    id: "p3",
    name: "Albuterol Inhaler",
    genericName: "Albuterol",
    category: "Respiratory",
    stock: 8,
    mrp: 15.0,
    composition: "Albuterol Sulfate",
    commonDosages: ["90 mcg"],
    routes: ["Inhalation"],
    lowStockThreshold: 20,
    recommendedOrderQty: 40,
    alternatives: [
      { name: "Levosalbutamol Inhaler", stock: 15, mrp: 18.0, composition: "Levosalbutamol" }
    ]
  },
  {
    id: "p4",
    name: "Amlodipine 5mg",
    genericName: "Amlodipine",
    category: "Cardiovascular",
    stock: 110,
    mrp: 2.0,
    composition: "Amlodipine Besylate",
    commonDosages: ["5mg", "10mg"],
    routes: ["Oral"],
    lowStockThreshold: 25,
    recommendedOrderQty: 150,
    alternatives: [
      { name: "Lisinopril 10mg", stock: 90, mrp: 1.8, composition: "Lisinopril" }
    ]
  },
  {
    id: "p5",
    name: "Metformin 500mg",
    genericName: "Metformin",
    category: "Antidiabetics",
    stock: 18,
    mrp: 1.2,
    composition: "Metformin Hydrochloride",
    commonDosages: ["500mg", "850mg", "1000mg"],
    routes: ["Oral"],
    lowStockThreshold: 35,
    recommendedOrderQty: 120,
    alternatives: [
      { name: "Glipizide 5mg", stock: 40, mrp: 1.5, composition: "Glipizide" }
    ]
  }
];

export class PharmacyAIEventService {
  static validatePharmacyEvent(eventName: string, data: any): boolean {
    try {
      switch (eventName) {
        case 'ai-pharmacy-search-requested':
          return typeof data?.searchQuery === 'string';
        case 'ai-drug-interaction-requested':
          return Array.isArray(data?.medicationNames) && data.medicationNames.length > 0;
        case 'ai-stock-update-requested':
          return typeof data?.medicineName === 'string' && typeof data?.quantity === 'number';
        case 'ai-medicine-info-requested':
          return typeof data?.medicineName === 'string';
        case 'ai-alternative-medication-requested':
          return typeof data?.originalMedicine === 'string';
        case 'ai-dosage-calculation-requested':
          return typeof data?.medicineName === 'string' && typeof data?.indication === 'string';
        case 'ai-low-stock-alert-requested':
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating pharmacy event:', error);
      return false;
    }
  }

  // Fetch search results locally
  static async fetchSearchResults(query: string): Promise<PharmacySearchEvent> {
    console.log('[PharmacyAIEventService] Mock search query:', query);
    const term = query.toLowerCase();
    const matches = dummyPharmacyItems.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.genericName.toLowerCase().includes(term) || 
      i.composition.toLowerCase().includes(term)
    );

    const results = matches.map(item => ({
      id: item.id,
      name: item.name,
      genericName: item.genericName,
      category: item.category,
      stock: item.stock,
      mrp: item.mrp,
      stockLevel: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      inStock: item.stock > 0,
      commonDosages: item.commonDosages,
      routes: item.routes,
      summary: `${item.name} — ${item.stock} units in stock`,
      currentStock: item.stock,
      availableDosages: item.commonDosages,
      route: item.routes[0] || 'N/A',
      storageLocation: 'Aisle A - Row 2',
    }));

    return {
      searchQuery: query,
      results,
      inStockOnly: false,
    };
  }

  // Get low stock alert locally
  static async getLowStockAlert(category?: string): Promise<LowStockAlertEvent> {
    console.log('[PharmacyAIEventService] Mock getLowStockAlert for category:', category);
    
    let items = dummyPharmacyItems.filter(i => i.stock < i.lowStockThreshold);
    if (category) {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }

    const medicines = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      stockLevel: item.stock,
      lowStockThreshold: item.lowStockThreshold,
      recommendedOrderQty: item.recommendedOrderQty
    }));

    return { medicines };
  }

  // Get detailed medicine information locally
  static async getMedicineInfo(medicineName: string): Promise<MedicineInfoEvent> {
    console.log('[PharmacyAIEventService] Mock getMedicineInfo for:', medicineName);
    const term = medicineName.toLowerCase();
    const item = dummyPharmacyItems.find(i => i.name.toLowerCase().includes(term) || i.genericName.toLowerCase().includes(term));

    if (item) {
      return {
        medicineName: item.name,
        genericName: item.genericName,
        category: item.category,
        composition: item.composition,
        dosages: item.commonDosages,
        routes: item.routes,
        stock: item.stock,
        stockLevel: item.stock,
        mrp: item.mrp,
        inStock: item.stock > 0,
        alternatives: item.alternatives,
      };
    }

    // Default fallback
    return {
      medicineName,
      genericName: "Generic Equivalent",
      category: "General Medicine",
      composition: medicineName,
      dosages: ["500mg"],
      routes: ["Oral"],
      stock: 45,
      stockLevel: 45,
      mrp: 2.50,
      inStock: true
    };
  }

  // Check stock level for multiple medicines locally
  static async checkStockLevel(medicineNames: string[]): Promise<any> {
    console.log('[PharmacyAIEventService] Mock checkStockLevel for:', medicineNames);
    const stock = medicineNames.map(name => {
      const term = name.toLowerCase();
      const item = dummyPharmacyItems.find(i => i.name.toLowerCase().includes(term));
      return {
        medicineName: name,
        stockLevel: item ? item.stock : 0,
        inStock: item ? item.stock > 0 : false
      };
    });

    return {
      stock,
      count: stock.length,
    };
  }

  static logPharmacyEvent(eventName: string, data: PharmacyAIEventData, success: boolean) {
    console.log(`[Pharmacy AI Event] ${eventName}:`, {
      timestamp: new Date().toISOString(),
      eventName,
      data,
      success
    });
  }

  static showPharmacyToast(actionType: string, success: boolean, message?: string) {
    if (success) {
      toast({
        title: "Pharmacy AI Action Completed",
        description: message || `${actionType} completed successfully.`,
      });
    } else {
      toast({
        title: "Pharmacy AI Action Failed",
        description: message || `Failed to process ${actionType}.`,
        variant: "destructive",
      });
    }
  }

  static dispatchCompletionEvent(eventType: string, data: any, callId?: string) {
    const completionEventMap = {
      'ai-pharmacy-search-requested': 'ai-pharmacy-search-completed',
      'ai-drug-interaction-requested': 'ai-drug-interaction-completed',
      'ai-stock-update-requested': 'ai-stock-update-completed',
      'ai-medicine-info-requested': 'ai-medicine-info-completed',
      'ai-medicine-lookup-requested': 'ai-medicine-lookup-completed',
      'ai-alternative-medication-requested': 'ai-alternative-medication-completed',
      'ai-dosage-calculation-requested': 'ai-dosage-calculation-completed',
      'ai-low-stock-alert-requested': 'ai-low-stock-alert-completed'
    };

    const completionEvent = completionEventMap[eventType as keyof typeof completionEventMap];

    if (completionEvent) {
      setTimeout(() => {
        const event = new CustomEvent(completionEvent, {
          detail: { ...data, callId, success: true }
        });
        document.dispatchEvent(event);
      }, 100);
    }
  }
}