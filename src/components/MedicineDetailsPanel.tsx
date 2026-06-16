import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, DollarSign, Layers, Building2, FileText } from "lucide-react";
import type { Medicine } from "@/services/medicineDatabase";

interface MedicineDetailsPanelProps {
  medicine: Medicine;
  apiDetails?: {
    stock?: number;
    mrp?: number;
  } | null;
}

export function MedicineDetailsPanel({ medicine, apiDetails }: MedicineDetailsPanelProps) {
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Package className="h-5 w-5" />
          Medicine Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Medicine Name */}
        <div>
          <h3 className="text-2xl font-bold mb-1">{medicine.Name}</h3>
          <p className="text-sm text-muted-foreground">{medicine.Category}</p>
        </div>

        <Separator />

        {/* API Details (Stock & MRP) */}
        {apiDetails && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Stock Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{apiDetails.stock ?? 'N/A'}</p>
                  {apiDetails.stock !== undefined && <span className="text-sm text-muted-foreground">units</span>}
                </div>
                {getStockBadge(apiDetails.stock)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">MRP per Unit</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {apiDetails.mrp !== undefined ? `₹${apiDetails.mrp.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Description */}
        {medicine.Description && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Description</span>
            </div>
            <p className="text-sm leading-relaxed">{medicine.Description}</p>
          </div>
        )}

        {/* Composition */}
        {medicine.Composition && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Layers className="h-4 w-4" />
              <span className="text-sm font-medium">Composition</span>
            </div>
            <p className="text-sm leading-relaxed">{medicine.Composition}</p>
          </div>
        )}

        {/* Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Medicine Type</p>
            <p className="font-semibold">{medicine.MedicineType || 'N/A'}</p>
          </div>

          {/* Manufacturer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Manufacturer</span>
            </div>
            <p className="font-semibold">{medicine.Manufacturer || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
