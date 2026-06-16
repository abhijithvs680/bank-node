import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { AlternativeMedicationEvent } from "@/types/pharmacyAIEvents";

interface AlternativesTemplateProps {
  data: AlternativeMedicationEvent;
  onSelectAlternative?: (medicine: any) => void;
}

export function AlternativesTemplate({ data, onSelectAlternative }: AlternativesTemplateProps) {
  const getStockBadge = (available: boolean) => {
    if (!available) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    return <Badge className="bg-green-500 text-white">Available</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">
            Alternatives for: {data.originalMedicine}
          </p>
          <p className="text-xs text-blue-700 mt-1">Reason: {data.reason}</p>
        </div>
      </div>

      {data.alternatives.length === 0 ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-center text-yellow-800">
              No suitable alternatives found at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.alternatives.map((medicine, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{medicine.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {medicine.genericName}
                    </p>
                  </div>
                  {getStockBadge(medicine.availability)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Stock Level</p>
                    <p className="font-semibold">{medicine.stockLevel} units</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p className="font-semibold capitalize">{medicine.reason}</p>
                  </div>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectAlternative?.(medicine)}
                  disabled={!medicine.availability}
                >
                  Select This Alternative <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
