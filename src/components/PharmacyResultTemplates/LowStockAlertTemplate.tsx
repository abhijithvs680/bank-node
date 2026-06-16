import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package } from "lucide-react";
import type { LowStockAlertEvent } from "@/types/pharmacyAIEvents";

interface LowStockAlertTemplateProps {
  data: LowStockAlertEvent;
}

export function LowStockAlertTemplate({ data }: LowStockAlertTemplateProps) {
  const getSeverityBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
    } else if (stock <= threshold) {
      return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
    }
    return <Badge variant="secondary">Notice</Badge>;
  };
  const criticalItems = data?.medicines?.filter(item => item.stockLevel === 0);
  const warningItems = data?.medicines?.filter(item => item.stockLevel > 0 && item.stockLevel <= item.lowStockThreshold);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold">
            {data.medicines.length} Item(s) Need Attention
          </h3>
        </div>
        <Badge variant="outline">
          {criticalItems.length} Critical
        </Badge>
      </div>

      {criticalItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Critical - Out of Stock</p>
          {criticalItems.map((item) => (
            <Card
              key={item.id}
              className="border-destructive bg-red-50 animate-pulse"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base text-destructive">
                      {item.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Category: {item.category}
                    </p>
                  </div>
                  {getSeverityBadge(item?.stockLevel, item.lowStockThreshold)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-destructive">
                    0 units available (Threshold: {item?.lowStockThreshold})
                  </span>
                </div>
                {item?.recommendedOrderQty && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Recommended Order: {item?.recommendedOrderQty} units
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {warningItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-yellow-700">Warning - Low Stock</p>
          {warningItems.map((item) => (
            <Card
              key={item.id}
              className="border-yellow-300 bg-yellow-50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base text-yellow-900">
                      {item.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Category: {item.category}
                    </p>
                  </div>
                  {getSeverityBadge(item?.stockLevel, item?.lowStockThreshold)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-yellow-600" />
                  <span className="font-semibold text-yellow-900">
                    {item?.stockLevel} units (Threshold: {item?.lowStockThreshold})
                  </span>
                </div>
                {item?.recommendedOrderQty && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Recommended Order: {item?.recommendedOrderQty} units
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
