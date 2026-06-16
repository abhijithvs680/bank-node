import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import type { DosageCalculationEvent } from "@/types/pharmacyAIEvents";

interface DosageCalculationTemplateProps {
  data: DosageCalculationEvent;
  onApplyDosage?: () => void;
}

export function DosageCalculationTemplate({ 
  data, 
  onApplyDosage 
}: DosageCalculationTemplateProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Dosage Calculation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Medication</p>
            <p className="text-lg font-semibold">{data.medicineName}</p>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            {data.weight && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Weight</p>
                <p className="text-lg font-bold">{data.weight} kg</p>
              </div>
            )}
            {data.age && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Age</p>
                <p className="text-lg font-bold">{data.age} years</p>
              </div>
            )}
            {data.indication && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Indication</p>
                <p className="text-sm font-semibold">{data.indication}</p>
              </div>
            )}
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Recommended Dosage</AlertTitle>
            <AlertDescription className="text-blue-800 font-semibold text-base mt-2">
              {data.recommendedDosage}
            </AlertDescription>
          </Alert>

          {data.warnings && data.warnings.length > 0 && (
            <div className="space-y-2">
              {data.warnings.map((warning, index) => (
                <Alert 
                  key={index} 
                  variant="destructive"
                  className="bg-yellow-50 border-yellow-300"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-900">
                    {warning}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              This is a calculated recommendation. Always verify dosage with current clinical guidelines 
              and consider individual patient factors before administration.
            </p>
          </div>

          {onApplyDosage && (
            <Button className="w-full" onClick={onApplyDosage}>
              Apply This Dosage
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
