import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { RelativeTime } from '@/components/RelativeTime';
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';

interface AIObservationsProps {
  aiObservations: any[];
  loading: boolean;
  error?: string | null;
}

export const AIObservations = ({ aiObservations, loading, error }: AIObservationsProps) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading AI observations...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-destructive">Failed to load AI observations</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      );
    }

    if (aiObservations.length === 0 || aiObservations[0]?.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No AI observations found
        </div>
      );
    }

    return aiObservations.map((item, index) => (
      <div key={index} className="border-l-4 border-medical-primary/30 pl-4 pb-4">
        {/* Header with timestamp */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-3 h-3 text-medical-primary" />
          <RelativeTime dateStr={item.timestamp} className="text-xs font-medium text-muted-foreground" />
        </div>
        
        {/* AI Observation Label */}
        <div className="mb-2">
          <span className="text-xs font-bold text-medical-primary bg-medical-primary/10 px-2 py-0.5 rounded">
            AI Observation
          </span>
        </div>
        
        {/* Message Content - supports both HTML and plain text */}
        <SafeHTMLRenderer 
          content={item.message}
          className="text-sm text-foreground mb-2 leading-tight"
        />
        
        {/* Observations */}
        <div className="space-y-1 mb-3">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-medical-muted rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-xs text-foreground leading-relaxed">Priority: {item.priority}</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 bg-medical-muted rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-xs text-foreground leading-relaxed">Confidence: {Math.round(item.confidence * 100)}%</p>
          </div>
          {item.observations && item.observations.split(",").map((observation: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-medical-muted rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-xs text-foreground leading-relaxed">{observation}</p>
            </div>
          ))}
        </div>
        
        {/* Suggested Actions */}
        {item.recommendations && item.recommendations.length > 0 && (
          <div className="bg-medical-surface/30 p-2 rounded border-l-2 border-medical-secondary">
            <p className="text-xs font-medium text-medical-secondary mb-1">Suggested Actions:</p>
            <div className="space-y-1">
              {item.recommendations.split(",").map((action: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-medical-secondary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-foreground">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  };

  return (
    <Card className="medical-card p-4 fade-in">
      <div className="flex items-center justify-between mb-3 pb-1 border-b border-medical-muted/40">
        <h3 className="text-base font-semibold text-foreground">AI Observations</h3>
      </div>
      
      <div className="space-y-4 medical-scroll max-h-96 overflow-y-auto">
        {renderContent()}
      </div>
    </Card>
  );
};