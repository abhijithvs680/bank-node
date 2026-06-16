import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Package, Info, RefreshCw, ShoppingCart } from "lucide-react";
import type { MedicineInfoEvent } from "@/types/pharmacyAIEvents";
import { PurchaseOrderOverlay } from "@/components/PurchaseOrderOverlay";

interface MedicineInfoTemplateProps {
  data: MedicineInfoEvent;
}

export function MedicineInfoTemplate({ data }: MedicineInfoTemplateProps) {
  const [showPurchaseOrderOverlay, setShowPurchaseOrderOverlay] = useState(false);

  const getStockBadge = (stock: number | undefined) => {
    if (stock === undefined || stock === null) {
      return <Badge variant="secondary">Unknown</Badge>;
    }
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock <= 30) {
      return <Badge className="bg-yellow-500 text-white">Low Stock</Badge>;
    }
    return <Badge className="bg-green-500 text-white">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Info className="h-5 w-5" />
                {data.medicineName}
              </CardTitle>
              {data.genericName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Generic: {data.genericName}
                </p>
              )}
              {data.category && (
                <p className="text-sm text-muted-foreground">
                  Category: {data.category}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stock and MRP Section */}
          {(data.stock !== undefined || data.mrp !== undefined) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {data.stock !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">Stock Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{data.stock}</p>
                      <span className="text-sm text-muted-foreground">units</span>
                    </div>
                    {getStockBadge(data.stock)}
                  </div>
                )}

                {data.mrp !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm font-medium">MRP per Unit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">₹{data.mrp.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Create Purchase Order Button */}
              <Button 
                onClick={() => setShowPurchaseOrderOverlay(true)}
                className="w-full"
                variant="outline"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Purchase Order
              </Button>

              <Separator />
            </>
          )}

          {/* Purchase Order Overlay */}
          <PurchaseOrderOverlay
            open={showPurchaseOrderOverlay}
            onOpenChange={setShowPurchaseOrderOverlay}
            medicineData={{
              name: data.medicineName,
              currentStock: data.stock ?? 0,
              mrp: data.mrp
            }}
          />

          {/* Legacy fields for compatibility */}
          {data.stockLevel !== undefined && data.stock === undefined && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4" />
                <span className="text-sm font-medium">Stock Level</span>
              </div>
              <p className="text-sm">{data.stockLevel} units</p>
            </div>
          )}

          {data.dosages && data.dosages.length > 0 && (
            <>
              <div>
                <p className="text-sm font-medium mb-2">Available Dosages</p>
                <div className="flex flex-wrap gap-2">
                  {data.dosages.map((dosage) => (
                    <Badge key={dosage} variant="outline">
                      {dosage}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {data.routes && data.routes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Routes</p>
              <p className="text-sm text-muted-foreground">
                {data.routes.join(", ")}
              </p>
            </div>
          )}

          {/* Composition */}
          {data.composition && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Composition</p>
                <p className="text-sm text-muted-foreground">{data.composition}</p>
              </div>
            </>
          )}

          {/* Alternatives Section */}
          {data.alternatives && data.alternatives.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Alternative Medicines ({data.alternatives.length})
                </h4>
                <div className="space-y-2">
                  {data.alternatives.map((alt, index) => (
                    <Card key={index} className="p-3 bg-muted/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alt.name}</p>
                          {alt.composition && (
                            <p className="text-xs text-muted-foreground mt-1">{alt.composition}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-3 w-3" />
                            <span>{alt.stock} units</span>
                          </div>
                          <p className="text-sm font-medium">₹{alt.mrp.toFixed(2)}</p>
                          {alt.stock > 0 ? (
                            <Badge className="bg-green-500 text-white text-xs mt-1">In Stock</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs mt-1">Out of Stock</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
