import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Thermometer, Activity, Droplets, Wind, Gauge, Brain, Stethoscope, Plus } from 'lucide-react';
import { VitalSigns } from '@/types/patient';

interface CurrentVitalSignsProps {
  onAddVitals?: () => void;
  vitals: VitalSigns | null;
  loading: boolean;
  error: string | null;
}

export const CurrentVitalSigns = ({ onAddVitals, vitals, loading, error }: CurrentVitalSignsProps) => {
  const vitalData = vitals || {
    consultationId: "",
    timestamp: new Date().toISOString(),
    heartRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0,
    consciousnessLevel: "Alert",
    glasgowComaScale: { total: 0 },
    painLevel: 0,
    bloodGlucose: 0
  };

  const getVitalStatus = (vital: string, value: number): { label: string; color: string } => {
    switch (vital) {
      case 'heartRate':
        if (value > 100 || value < 60) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      case 'temperature':
        if (value > 37.5 || value < 36.0) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      case 'oxygenSaturation':
        if (value < 95) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      case 'bloodPressure':
        if (vitalData.bloodPressureSystolic > 140 || vitalData.bloodPressureDiastolic > 90) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      case 'respiratoryRate':
        if (value > 20 || value < 12) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      case 'bloodGlucose':
        if (value > 180 || value < 70) return { label: 'Warning', color: '#e65100' };
        return { label: 'Stable', color: '#2e7d32' };
      default:
        return { label: 'Stable', color: '#2e7d32' };
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading vital signs...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12 px-4">
          <p className="text-sm text-destructive">Failed to load vital signs</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
        </div>
      );
    }

    const vitalCards = [
      { key: 'bloodPressure', label: 'BP', icon: Activity, value: `${vitalData.bloodPressureSystolic}/${vitalData.bloodPressureDiastolic}`, unit: 'mmHg', status: getVitalStatus('bloodPressure', 0), iconColor: '#64549f' },
      { key: 'heartRate', label: 'Heart Rate', icon: Heart, value: `${vitalData.heartRate}`, unit: 'bpm', status: getVitalStatus('heartRate', vitalData.heartRate), iconColor: '#e53935' },
      { key: 'bloodGlucose', label: 'Glucose', icon: Gauge, value: `${vitalData.bloodGlucose}`, unit: 'mg/dL', status: getVitalStatus('bloodGlucose', vitalData.bloodGlucose), iconColor: '#64549f' },
      { key: 'gcs', label: 'GCS', icon: Brain, value: `${vitalData.glasgowComaScale.total}`, unit: '/15', status: { label: 'Stable', color: '#2e7d32' }, iconColor: '#64549f' },
      { key: 'temperature', label: 'Temperature', icon: Thermometer, value: `${vitalData.temperature}`, unit: '°C', status: getVitalStatus('temperature', vitalData.temperature), iconColor: '#e65100' },
      { key: 'oxygenSaturation', label: 'SPO2', icon: Droplets, value: `${vitalData.oxygenSaturation}`, unit: '%', status: getVitalStatus('oxygenSaturation', vitalData.oxygenSaturation), iconColor: '#1565c0' },
      { key: 'respiratoryRate', label: 'Resp Rate', icon: Wind, value: `${vitalData.respiratoryRate}`, unit: 'breaths/min', status: getVitalStatus('respiratoryRate', vitalData.respiratoryRate), iconColor: '#64549f' },
    ];

    return (
      <div className="grid grid-cols-4 gap-3">
        {vitalCards.map((vital, idx) => {
          const Icon = vital.icon;
          return (
            <div key={vital.key} className="bg-[#f5f7fc] rounded-[14px] p-3 flex flex-col">
              <span className="text-[0.875rem] font-medium text-[#6e6868] font-['Inter'] mb-2">{vital.label}</span>
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4" style={{ color: vital.iconColor }} />
                <span className="text-[1.625rem] font-semibold text-[#161616] font-['Inter'] leading-none">{vital.value}</span>
                <span className="text-[0.875rem] text-[#6e6868] font-['Inter']">{vital.unit}</span>
              </div>
              <span className="text-[0.875rem] font-medium font-['Inter']" style={{ color: vital.status.color }}>
                {vital.status.label}
              </span>
            </div>
          );
        })}
        {/* Pain Level */}
        <div className="bg-[#f5f7fc] rounded-[14px] p-3 flex flex-col">
          <span className="text-[0.875rem] font-medium text-[#6e6868] font-['Inter'] mb-2">Pain Level</span>
          <div className="flex items-center gap-2 mb-1.5">
            <Stethoscope className="w-4 h-4" style={{ color: '#e65100' }} />
            <span className="text-[1.625rem] font-semibold text-[#161616] font-['Inter'] leading-none">{vitalData.painLevel}</span>
            <span className="text-[0.875rem] text-[#6e6868] font-['Inter']">/10</span>
          </div>
          <span className="text-[0.875rem] font-medium font-['Inter']" style={{ color: vitalData.painLevel > 7 ? '#e65100' : vitalData.painLevel > 4 ? '#e65100' : '#2e7d32' }}>
            {vitalData.painLevel > 7 ? 'Warning' : vitalData.painLevel > 4 ? 'Moderate' : 'Stable'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[20px] p-4 fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[1.125rem] font-semibold text-[#161616] font-['Inter']">Vitals</h3>
        <Button
          size="sm"
          onClick={onAddVitals}
          variant="outline"
          className="h-8 px-4 rounded-[10px] text-[13px] font-semibold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>
      {renderContent()}
    </div>
  );
};