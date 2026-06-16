import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Package } from "lucide-react";
import type { StockUpdateEvent } from "@/types/pharmacyAIEvents";

interface StockUpdateTemplateProps {
  data: StockUpdateEvent;
  onUndo?: () => void;
}

export function StockUpdateTemplate({ data, onUndo }: StockUpdateTemplateProps) {
  const getAdjustmentBadge = (type: string) => {
    const badges = {
      dispensed: <Badge variant="default">Dispensed</Badge>,
      received: <Badge className="bg-green-500 text-white">Received</Badge>,
      expired: <Badge variant="destructive">Expired</Badge>,
      adjusted: <Badge variant="secondary">Manual Adjustment</Badge>,
    };
    return badges[type as keyof typeof badges] || <Badge>{type}</Badge>;
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <CardTitle className="text-green-900">Stock Updated Successfully</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-green-900">{data.medicineName}</span>
          {getAdjustmentBadge(data.adjustmentType)}
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-green-200">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Adjustment</p>
            <p className="text-2xl font-bold text-green-700">
              {data.adjustmentType === "received" ? "+" : "-"}
              {data.quantity}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">New Stock</p>
            <p className="text-2xl font-bold text-green-700">{data.newStockLevel || "Updated"}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-semibold capitalize">{data.adjustmentType}</span>
          </div>
          {data.reason && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason:</span>
              <span className="font-semibold">{data.reason}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="font-semibold">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {onUndo && (
          <Button variant="outline" size="sm" className="w-full" onClick={onUndo}>
            Undo This Update
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
