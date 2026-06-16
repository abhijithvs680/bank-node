
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Heart, Thermometer, Activity, Droplets } from 'lucide-react';

const heartRateData = [
  { time: '00:00', value: 72 },
  { time: '00:15', value: 75 },
  { time: '00:30', value: 78 },
  { time: '00:45', value: 82 },
  { time: '01:00', value: 85 },
  { time: '01:15', value: 88 },
  { time: '01:30', value: 92 },
];

export const VitalSigns = () => {
  return (
    <Card className="medical-card p-6 fade-in">
      <h3 className="section-header">Vital Signs</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Heart Rate */}
        <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-medical-danger" />
            <span className="font-medium text-sm">Heart Rate</span>
            <div className="vital-indicator vital-warning"></div>
          </div>
          <p className="text-2xl font-bold text-foreground">92</p>
          <p className="text-xs text-muted-foreground">BPM</p>
        </div>

        {/* Blood Pressure */}
        <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-medical-primary" />
            <span className="font-medium text-sm">Blood Pressure</span>
            <div className="vital-indicator vital-normal"></div>
          </div>
          <p className="text-2xl font-bold text-foreground">120/80</p>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </div>

        {/* Temperature */}
        <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-5 h-5 text-medical-warning" />
            <span className="font-medium text-sm">Temperature</span>
            <div className="vital-indicator vital-warning"></div>
          </div>
          <p className="text-2xl font-bold text-foreground">38.2</p>
          <p className="text-xs text-muted-foreground">°C</p>
        </div>

        {/* Oxygen Saturation */}
        <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-5 h-5 text-medical-secondary" />
            <span className="font-medium text-sm">SpO2</span>
            <div className="vital-indicator vital-normal"></div>
          </div>
          <p className="text-2xl font-bold text-foreground">96</p>
          <p className="text-xs text-muted-foreground">%</p>
        </div>
      </div>

      {/* Heart Rate Chart */}
      <div className="h-64 bg-white rounded-lg border border-medical-muted/20 p-4">
        <h4 className="font-medium text-sm mb-4 text-medical-primary">Heart Rate Trend (Last Hour)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={heartRateData}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              domain={[60, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid hsl(var(--medical-muted))',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--medical-danger))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--medical-danger))', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
