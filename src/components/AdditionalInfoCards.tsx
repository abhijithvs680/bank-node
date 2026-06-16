
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export const AdditionalInfoCards = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Alerts & Warnings */}
      <Card className="medical-card p-4 fade-in">
        <h3 className="text-base font-semibold text-foreground mb-3 pb-1 border-b border-medical-muted/40">Active Alerts</h3>
        <div className="space-y-2">
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-red-800">Temperature Alert</p>
              <p className="text-xs text-red-600">Temperature elevated above 38°C for 2 hours</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-yellow-800">Heart Rate Variability</p>
              <p className="text-xs text-yellow-600">HR fluctuating between 85-95 BPM</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Lab Results */}
      <Card className="medical-card p-4 fade-in">
        <h3 className="text-base font-semibold text-foreground mb-3 pb-1 border-b border-medical-muted/40">Recent Lab Results</h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center py-1 border-b border-medical-muted/20">
            <span className="text-xs">Troponin I</span>
            <div className="text-right">
              <p className="text-xs font-medium">0.8 ng/mL</p>
              <p className="text-xs text-red-600">↑ Elevated</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-medical-muted/20">
            <span className="text-xs">White Blood Cells</span>
            <div className="text-right">
              <p className="text-xs font-medium">12.5 K/μL</p>
              <p className="text-xs text-yellow-600">↑ High</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-medical-muted/20">
            <span className="text-xs">Hemoglobin</span>
            <div className="text-right">
              <p className="text-xs font-medium">13.2 g/dL</p>
              <p className="text-xs text-green-600">✓ Normal</p>
            </div>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-xs">Creatinine</span>
            <div className="text-right">
              <p className="text-xs font-medium">1.1 mg/dL</p>
              <p className="text-xs text-green-600">✓ Normal</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Ventilator Settings */}
      <Card className="medical-card p-4 fade-in">
        <h3 className="text-base font-semibold text-foreground mb-3 pb-1 border-b border-medical-muted/40">Ventilator Settings</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-medical-surface/30 rounded">
            <p className="text-xs text-muted-foreground">Mode</p>
            <p className="text-xs font-medium">SIMV</p>
          </div>
          <div className="text-center p-2 bg-medical-surface/30 rounded">
            <p className="text-xs text-muted-foreground">Rate</p>
            <p className="text-xs font-medium">12 bpm</p>
          </div>
          <div className="text-center p-2 bg-medical-surface/30 rounded">
            <p className="text-xs text-muted-foreground">Tidal Vol</p>
            <p className="text-xs font-medium">450 mL</p>
          </div>
          <div className="text-center p-2 bg-medical-surface/30 rounded">
            <p className="text-xs text-muted-foreground">PEEP</p>
            <p className="text-xs font-medium">5 cmH₂O</p>
          </div>
        </div>
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <p className="text-xs text-green-800 text-center">
            <span className="font-medium">Status:</span> Synchronized, Patient triggered
          </p>
        </div>
      </Card>
    </div>
  );
};
