export interface VendorSuggestion {
  vendorId: string;
  vendorName: string;
  moq: number;              // Minimum Order Quantity
  discount: number;         // Discount percentage
  pricePerUnit: number;     // Price per unit
  leadTime: string;         // e.g., "2 days"
  suggestedQuantity: number;
  isRecommended: boolean;   // AI recommended vendor
  benefits?: string[];      // Additional benefits
  rating?: number;          // Vendor rating (out of 5)
}

export interface PurchaseOrderSuggestionResponse {
  medicineName: string;
  currentStock: number;
  optimalReorderQty: number;
  vendors: VendorSuggestion[];
  lastUpdated: string;
}

export interface PurchaseOrderSubmission {
  medicineName: string;
  vendorId: string;
  vendorName: string;
  quantity: number;
  pricePerUnit: number;
  discount: number;
  totalAmount: number;
  expectedDelivery?: string;
}

export interface MedicineDataForPO {
  name: string;
  currentStock: number;
  mrp?: number;
}
