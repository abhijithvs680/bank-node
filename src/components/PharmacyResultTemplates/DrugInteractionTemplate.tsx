import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { DrugInteractionEvent } from "@/types/pharmacyAIEvents";

interface DrugInteractionTemplateProps {
  data: DrugInteractionEvent;
  onAcknowledge?: () => void;
}

export function DrugInteractionTemplate({ data, onAcknowledge }: DrugInteractionTemplateProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "severe":
        return "destructive";
      case "moderate":
        return "default";
      default:
        return "secondary";
    }
  };

  const hasSevereInteractions = data.interactions?.some(
    (i) => i.severity.toLowerCase() === "severe"
  ) || false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Checking interactions for {data.medicationNames.length} medication(s)
        </h3>
        {!hasSevereInteractions && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Safe to combine
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {data.medicationNames.map((med) => (
          <Badge key={med} variant="outline">
            {med}
          </Badge>
        ))}
      </div>

      {!data.interactions || data.interactions.length === 0 ? (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">No Interactions Found</AlertTitle>
          <AlertDescription className="text-green-700">
            These medications can be safely combined. No known drug interactions detected.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {data.interactions.map((interaction, index) => (
            <Alert
              key={index}
              variant={interaction.severity.toLowerCase() === "severe" ? "destructive" : "default"}
              className={
                interaction.severity.toLowerCase() === "moderate"
                  ? "bg-yellow-50 border-yellow-200"
                  : ""
              }
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(interaction.severity)}
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2 mb-2">
                    {interaction.medications.join(" + ")}
                    <Badge variant={getSeverityColor(interaction.severity)}>
                      {interaction.severity}
                    </Badge>
                  </AlertTitle>
                  <AlertDescription>{interaction.description}</AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {hasSevereInteractions && (
        <Button variant="destructive" className="w-full" onClick={onAcknowledge}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Acknowledge Severe Interaction Warning
        </Button>
      )}
    </div>
  );
}
