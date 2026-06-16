import type { PurchaseOrderSuggestionResponse, PurchaseOrderSubmission } from '@/types/purchaseOrder';

export async function getPurchaseOrderSuggestions(
  medicineName: string,
  currentStock: number,
  mrp?: number
): Promise<PurchaseOrderSuggestionResponse> {
  console.log('[PurchaseOrderService] Mock generating suggestions for:', medicineName);

  const priceVal = mrp || 10;
  const suggestedQty = 100;

  const response: PurchaseOrderSuggestionResponse = {
    medicineName: medicineName,
    currentStock: currentStock,
    optimalReorderQty: Math.max(50, 150 - currentStock),
    vendors: [
      {
        vendorId: "V001",
        vendorName: "Medix Distributors",
        moq: 50,
        discount: 15,
        pricePerUnit: Number((priceVal * 0.85).toFixed(2)),
        leadTime: "2 days",
        suggestedQuantity: suggestedQty,
        isRecommended: true,
        benefits: ["Free shipping over ₹1000", "Quality certified USP/EP"],
        rating: 4.8
      },
      {
        vendorId: "V002",
        vendorName: "Apex Pharma Suppliers",
        moq: 100,
        discount: 20,
        pricePerUnit: Number((priceVal * 0.80).toFixed(2)),
        leadTime: "4 days",
        suggestedQuantity: suggestedQty,
        isRecommended: false,
        benefits: ["Bulk pricing discount", "Temperature controlled transit"],
        rating: 4.5
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  return response;
}

export async function submitPurchaseOrder(data: PurchaseOrderSubmission): Promise<void> {
  console.log('[PurchaseOrderService] Mock submitting purchase order:', data);
}
