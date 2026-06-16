import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ShoppingCart,
  Star,
  Truck,
  Package,
  Percent,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Minus,
  Plus,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { MedicineDataForPO, VendorSuggestion, PurchaseOrderSuggestionResponse } from '@/types/purchaseOrder';
import { getPurchaseOrderSuggestions, submitPurchaseOrder } from '@/services/purchaseOrderService';

interface PurchaseOrderOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineData: MedicineDataForPO;
}

type LoadingPhase = 'analyzing' | 'fetching' | 'processing' | 'complete';

const loadingMessages: Record<LoadingPhase, string> = {
  analyzing: 'Analyzing inventory patterns...',
  fetching: 'Fetching vendor recommendations...',
  processing: 'Processing optimal quantities...',
  complete: 'Ready!'
};

export function PurchaseOrderOverlay({ open, onOpenChange, medicineData }: PurchaseOrderOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('analyzing');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PurchaseOrderSuggestionResponse | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorSuggestion | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const subtotal = selectedVendor ? quantity * selectedVendor.pricePerUnit : 0;
  const discountAmount = selectedVendor ? (subtotal * selectedVendor.discount) / 100 : 0;
  const totalAmount = subtotal - discountAmount;

  // Fetch suggestions when overlay opens
  useEffect(() => {
    if (open && !suggestions) {
      fetchSuggestions();
    }
  }, [open]);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSuggestions(null);
      setSelectedVendor(null);
      setQuantity(0);
      setError(null);
    }
  }, [open]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingPhase('analyzing');

    // Simulate loading phases for better UX
    const phaseTimers = [
      setTimeout(() => setLoadingPhase('fetching'), 1500),
      setTimeout(() => setLoadingPhase('processing'), 3000)
    ];

    try {
      const result = await getPurchaseOrderSuggestions(
        medicineData.name,
        medicineData.currentStock,
        medicineData.mrp
      );

      setSuggestions(result);

      // Auto-select recommended vendor
      const recommended = result.vendors.find(v => v.isRecommended);
      if (recommended) {
        setSelectedVendor(recommended);
        setQuantity(recommended.suggestedQuantity);
      } else if (result.vendors.length > 0) {
        setSelectedVendor(result.vendors[0]);
        setQuantity(result.vendors[0].suggestedQuantity);
      }

      setLoadingPhase('complete');
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError('Failed to fetch vendor suggestions. Please try again.');
    } finally {
      phaseTimers.forEach(clearTimeout);
      setIsLoading(false);
    }
  };

  const handleVendorSelect = (vendor: VendorSuggestion) => {
    setSelectedVendor(vendor);
    setQuantity(vendor.suggestedQuantity);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(selectedVendor?.moq || 1, quantity + delta);
    setQuantity(newQty);
  };

  const handleSubmit = async () => {
    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return;
    }

    if (quantity < selectedVendor.moq) {
      toast.error(`Minimum order quantity is ${selectedVendor.moq}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expected delivery date
      const leadDays = parseInt(selectedVendor.leadTime) || 3;
      const expectedDelivery = new Date();
      expectedDelivery.setDate(expectedDelivery.getDate() + leadDays);

      await submitPurchaseOrder({
        medicineName: medicineData.name,
        vendorId: selectedVendor.vendorId,
        vendorName: selectedVendor.vendorName,
        quantity,
        pricePerUnit: selectedVendor.pricePerUnit,
        discount: selectedVendor.discount,
        totalAmount,
        expectedDelivery: expectedDelivery.toISOString()
      });

      toast.success('Purchase order submitted successfully!');
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to submit PO:', err);
      toast.error('Failed to submit purchase order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl [&>button]:text-white">
        <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 font-normal">
              <ShoppingCart className="h-5 w-5 text-white/80" />
              Create Purchase Order
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-white max-h-[75vh] overflow-y-auto medical-scroll">
          {/* Medicine Info Header */}
          <div className="bg-[#f5f7fc] border border-[#e0e3f5] rounded-[16px] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#64549f]" />
              <span className="font-bold text-[#1a2256]">{medicineData.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[13px] text-[#6e6868] font-medium">Current Stock: <span className="text-[#1a2256] font-bold">{medicineData.currentStock} units</span></span>
              {suggestions?.optimalReorderQty && (
                <span className="flex items-center gap-1.5 text-[13px] text-[#64549f] font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommended: {suggestions.optimalReorderQty} units
                </span>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in zoom-in-95">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-[#64549f]/10 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-[#64549f] border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-[#1a2256]">{loadingMessages[loadingPhase]}</p>
                <p className="text-[13px] text-[#6e6868] font-medium">
                  Finding the best vendors for your order
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-center text-[#6e6868] font-medium">{error}</p>
              <Button onClick={fetchSuggestions} variant="outline" className="rounded-[12px] border-[#e0e3f5] text-[#1a2256] font-bold">
                Try Again
              </Button>
            </div>
          )}

          {/* Vendor Suggestions */}
          {suggestions && !isLoading && !error && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h3 className="text-[14px] font-bold text-[#1a2256] mb-3">Select a Vendor</h3>
                <div className="space-y-3">
                  {suggestions.vendors.map((vendor) => (
                    <Card
                      key={vendor.vendorId}
                      className={`p-4 cursor-pointer transition-all rounded-[16px] border ${selectedVendor?.vendorId === vendor.vendorId
                        ? 'border-[#64549f] bg-[#f5f7fc] ring-1 ring-[#64549f]'
                        : 'border-[#e0e3f5] bg-[#fcfdfe] hover:bg-white hover:border-[#64549f]/30'
                        }`}
                      onClick={() => handleVendorSelect(vendor)}
                    >
                      {/* Vendor Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {vendor.isRecommended && (
                            <Badge className="bg-[#1a2256] text-white border-none text-[10px] font-bold px-2 py-0.5">
                              <Star className="h-3 w-3 mr-1 fill-white" />
                              Recommended
                            </Badge>
                          )}
                          <span className="font-bold text-[#1a2256]">{vendor.vendorName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {renderRating(vendor.rating)}
                          {selectedVendor?.vendorId === vendor.vendorId && (
                            <div className="w-5 h-5 rounded-full bg-[#1a2256] flex items-center justify-center">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor Details Grid */}
                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-[8px] bg-white border border-[#e0e3f5] flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-[#64549f]" />
                          </div>
                          <div>
                            <p className="text-[#6e6868] text-[10px] font-medium uppercase tracking-wider">MOQ</p>
                            <p className="font-bold text-[#1a2256] leading-tight">{vendor.moq}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-[8px] bg-white border border-[#e0e3f5] flex items-center justify-center">
                            <Percent className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-[#6e6868] text-[10px] font-medium uppercase tracking-wider">Discount</p>
                            <p className="font-bold text-green-600 leading-tight">{vendor.discount}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-[8px] bg-white border border-[#e0e3f5] flex items-center justify-center">
                            <span className="text-[12px] font-bold text-[#1a2256]">₹</span>
                          </div>
                          <div>
                            <p className="text-[#6e6868] text-[10px] font-medium uppercase tracking-wider">Price/Unit</p>
                            <p className="font-bold text-[#1a2256] leading-tight">₹{vendor.pricePerUnit.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-[8px] bg-white border border-[#e0e3f5] flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 text-[#64549f]" />
                          </div>
                          <div>
                            <p className="text-[#6e6868] text-[10px] font-medium uppercase tracking-wider">Lead Time</p>
                            <p className="font-bold text-[#1a2256] leading-tight">{vendor.leadTime}</p>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      {vendor.benefits && vendor.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {vendor.benefits.map((benefit, idx) => (
                            <Badge key={idx} className="bg-white border-[#e0e3f5] text-[#6e6868] text-[10px] font-bold hover:bg-white px-2 py-0.5">
                              <Truck className="h-2.5 w-2.5 mr-1 text-[#64549f]" />
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="bg-[#f0f3f9]" />

              {/* Order Details Form */}
              {selectedVendor && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-[14px] font-bold text-[#1a2256]">Order Details</h3>

                  {/* Quantity Input */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-[#1a2256]">Quantity</Label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(-10)}
                        disabled={quantity <= selectedVendor.moq}
                        className="rounded-[10px] border-[#e0e3f5] h-10 w-10 text-[#6e6868] hover:bg-gray-50 active:scale-95"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(selectedVendor.moq, parseInt(e.target.value) || 0))}
                        className="w-24 text-center h-10 rounded-[10px] border-[#e0e3f5] font-bold text-[#1a2256]"
                        min={selectedVendor.moq}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(10)}
                        className="rounded-[10px] border-[#e0e3f5] h-10 w-10 text-[#6e6868] hover:bg-gray-50 active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <span className="text-[12px] text-[#6e6868] font-bold">
                        (Minimum Order: {selectedVendor.moq})
                      </span>
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="p-5 bg-[#fcfdfe] border border-[#e0e3f5] rounded-[16px] shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#6e6868] font-medium">Unit Price</span>
                        <span className="font-bold text-[#1a2256]">₹{selectedVendor.pricePerUnit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-[#6e6868] font-medium">Subtotal ({quantity} units)</span>
                        <span className="font-bold text-[#1a2256]">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span className="text-[13px] font-medium">Discount ({selectedVendor.discount}%)</span>
                        <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                      <Separator className="bg-[#f0f3f9]" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[15px] font-bold text-[#1a2256]">Total Amount</span>
                        <span className="text-[18px] font-bold text-[#1a2256]">₹{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-[#fcfdfe] border-t border-[#f0f3f9] flex flex-row justify-end gap-3 rounded-b-[24px]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-[12px] h-11 px-6 font-bold text-[#6e6868] border-[#e0e3f5] hover:bg-gray-50 transition-all active:scale-95 flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedVendor || isSubmitting || quantity < (selectedVendor?.moq || 0)}
            className="rounded-[12px] h-11 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-md hover:shadow-lg transition-all active:scale-95 flex-1 items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white/60" />
                Submitting...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Submit Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
