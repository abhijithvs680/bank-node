import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ArrowRight } from "lucide-react";
import type { PharmacySearchEvent } from "@/types/pharmacyAIEvents";

interface SearchResultsTemplateProps {
  data: PharmacySearchEvent;
  onViewDetails?: (medicine: any) => void;
}

export function SearchResultsTemplate({ data, onViewDetails }: SearchResultsTemplateProps) {
  const getStockBadge = (quantity: number, lowStockThreshold: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= lowStockThreshold) {
      return <Badge className="bg-yellow-500 text-white">Low Stock</Badge>;
    }
    return <Badge className="bg-green-500 text-white">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="h-4 w-4" />
        <span className="text-sm">Found {data.results?.length || 0} result(s) for "{data.searchQuery}"</span>
      </div>

      {data.results?.map((medicine) => (
        <Card key={medicine.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{medicine.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Generic: {medicine.genericName} • Category: {medicine.category}
                </p>
              </div>
              {getStockBadge(medicine.currentStock, medicine.lowStockThreshold)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Stock</p>
                <p className="font-semibold">
                  {medicine.stock !== undefined ? `${medicine.stock} units` : 
                   medicine.currentStock !== undefined ? `${medicine.currentStock} units` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">MRP per Unit</p>
                <p className="font-semibold">
                  {medicine.mrp !== undefined ? `₹${medicine.mrp.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Dosages</p>
                <p className="font-semibold">{medicine.availableDosages?.join(", ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Route</p>
                <p className="font-semibold">{medicine.route || 'N/A'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onViewDetails?.(medicine)}
            >
              View Full Details <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
