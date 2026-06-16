import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { Heart, Thermometer, Activity, Droplets, Wind, Gauge, Brain, Stethoscope, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiService, VitalSignsGraphData } from '@/services/apiService';
import { VitalSigns } from '@/types/patient';
import { log } from 'util';

interface EnhancedVitalSignsProps {
  onAddVitals?: () => void;
    vitals: VitalSigns | null;
  graphData: VitalSignsGraphData | null;
  loading: boolean;
  error: string | null;
  admissionId: string | null;

}


export const EnhancedVitalSigns = ({ onAddVitals,vitals,graphData,loading,error,admissionId }: EnhancedVitalSignsProps) => {
  // Helper function to calculate time difference and format accordingly
  console.log("vitals",vitals);
    console.log("graphData",graphData);
  const getTimeRangeLabel = (timestamps: string[]) => {
  if (timestamps.length === 0) return "(No data)";

  // Parse to Date objects and sort
  const sortedDates = timestamps
    .map(ts => new Date(ts)) // convert string → Date
    .sort((a, b) => a.getTime() - b.getTime());

  const earliest = sortedDates[0];
  const latest = sortedDates[sortedDates.length - 1];

  const diffMs = latest.getTime() - earliest.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes <= 60) {
    return `(Last ${diffMinutes} min)`;
  } else if (diffMinutes <= 1440) { // Less than 24 hours
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins > 0 ? `(Last ${hours}h ${mins}min)` : `(Last ${hours}h)`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `(Last ${days} days)`;
  }
};

  // const getTimeRangeLabel = (timestamps: string[]) => {
  //   if (timestamps.length === 0) return "(No data)";
    
  //   // Sort timestamps to get earliest and latest
  //   const sortedTimes = timestamps.sort();
  //   const earliest = sortedTimes[0];
  //   const latest = sortedTimes[sortedTimes.length - 1];
    
  //   // Convert HH:MM format to minutes for calculation
  //   const timeToMinutes = (time: string) => {
  //     const [hours, minutes] = time.split(':').map(Number);
  //     return hours * 60 + minutes;
  //   };
    
  //   const earliestMinutes = timeToMinutes(earliest);
  //   const latestMinutes = timeToMinutes(latest);
  //   const diffMinutes = latestMinutes - earliestMinutes;
    
  //   if (diffMinutes <= 60) {
  //     return `(Last ${diffMinutes} min)`;
  //   } else if (diffMinutes <= 1440) { // Less than 24 hours
  //     const hours = Math.floor(diffMinutes / 60);
  //     const mins = diffMinutes % 60;
  //     return mins > 0 ? `(Last ${hours}h ${mins}min)` : `(Last ${hours}h)`;
  //   } else {
  //     const days = Math.floor(diffMinutes / 1440);
  //     return `(Last ${days} days)`;
  //   }
  // };

  if (loading) return <div className="p-6">Loading vital signs...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
     //if (!vitals) return <div className="p-6">No vital signs data available for this patient.</div>;
if(!vitals || vitals?.consultationId == "") {
    vitals = {
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
}
}

 if(!graphData || (graphData as any)?.admissionId==""){
graphData =  {
  heartRateData: [],
  bloodPressureData: [],
  temperatureData: [],
  oxygenData: []
}
}
 





  // Transform data to use Day X format for x-axis
  const transformDataWithDayLabels = (dataArray: any[]) => {
    if (!dataArray || dataArray.length === 0) return [];
    
    // Sort data by time to ensure proper chronological order
    const sortedData = dataArray.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    // Group by date to handle multiple readings per day
    const dayGroups = new Map();
    sortedData.forEach((item) => {
      const date = new Date(item.time).toDateString();
      if (!dayGroups.has(date)) {
        dayGroups.set(date, []);
      }
      dayGroups.get(date).push(item);
    });
    
    // Create Day X labels
    const dayKeys = Array.from(dayGroups.keys());
    const result = [];
    
    dayKeys.forEach((dayKey, dayIndex) => {
      const dayItems = dayGroups.get(dayKey);
      dayItems.forEach((item, itemIndex) => {
        const dayLabel = `Day ${dayIndex + 1}`;
        // If multiple readings per day, add time suffix in 12-hour format
        const timeLabel = dayItems.length > 1 
          ? `${dayLabel} ${new Date(item.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
          : dayLabel;
        result.push({ ...item, time: timeLabel, originalTime: item.time });
      });
    });
    
    return result;
  };

  // Use API data if available, otherwise fall back to empty arrays
  const heartRateData = transformDataWithDayLabels((graphData as any)?.heartRate || []);
  const temperatureData = transformDataWithDayLabels((graphData as any)?.temperature || []);
  const oxygenData = transformDataWithDayLabels((graphData as any)?.sp02 || []);
  const bloodPressureData = transformDataWithDayLabels((graphData as any)?.bp || []);
  // Calculate time range labels for each chart
  const heartRateTimeRange = getTimeRangeLabel(heartRateData.map(d => d.time));
  const bloodPressureTimeRange = getTimeRangeLabel(bloodPressureData.map(d => d.time));
  const oxygenTimeRange = getTimeRangeLabel(oxygenData.map(d => d.time));
  const temperatureTimeRange = getTimeRangeLabel(temperatureData.map(d => d.time));
console.log("heartRateTimeRange",heartRateTimeRange);

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case 'heartRate':
        if (value > 100 || value < 60) return 'vital-warning';
        return 'vital-normal';
      case 'temperature':
        if (value > 37.5 || value < 36.0) return 'vital-warning';
        return 'vital-normal';
      case 'oxygenSaturation':
        if (value < 95) return 'vital-warning';
        return 'vital-normal';
      case 'bloodPressure':
        if (vitals.bloodPressureSystolic > 140 || vitals.bloodPressureDiastolic > 90) return 'vital-warning';
        return 'vital-normal';
      default:
        return 'vital-normal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Vitals Overview */}
      <Card className="medical-card p-6 fade-in">
        <div className="flex items-center justify-between mb-6 pb-1 border-b border-medical-muted/40">
          <h3 className="text-base font-semibold text-foreground">Current Vital Signs</h3>
          <Button
            size="sm"
            onClick={onAddVitals}
            variant="outline"
            className="h-7 px-3 rounded-[10px] text-[0.81rem] font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Vitals
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Heart Rate */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-medical-danger" />
              <span className="font-medium text-sm">Heart Rate</span>
              <div className={`vital-indicator ${getVitalStatus('heartRate', vitals.heartRate)}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.heartRate}</p>
            <p className="text-xs text-muted-foreground">BPM</p>
          </div>

          {/* Blood Pressure */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-medical-primary" />
              <span className="font-medium text-sm">Blood Pressure </span>
              <div className={`vital-indicator ${getVitalStatus('bloodPressure', 0)}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}</p>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </div>

          {/* Temperature */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-5 h-5 text-medical-warning" />
              <span className="font-medium text-sm">Temperature</span>
              <div className={`vital-indicator ${getVitalStatus('temperature', vitals.temperature)}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.temperature}</p>
            <p className="text-xs text-muted-foreground">°C</p>
          </div>

          {/* Oxygen Saturation */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-medical-secondary" />
              <span className="font-medium text-sm">SpO2</span>
              <div className={`vital-indicator ${getVitalStatus('oxygenSaturation', vitals.oxygenSaturation)}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.oxygenSaturation}</p>
            <p className="text-xs text-muted-foreground">%</p>
          </div>

          {/* Respiratory Rate */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-5 h-5 text-medical-accent" />
              <span className="font-medium text-sm">Resp Rate</span>
              <div className="vital-indicator vital-normal"></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.respiratoryRate}</p>
            <p className="text-xs text-muted-foreground">breaths/min</p>
          </div>

          {/* Glasgow Coma Scale */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-medical-primary" />
              <span className="font-medium text-sm">GCS</span>
              <div className="vital-indicator vital-normal"></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.glasgowComaScale.total}</p>
            <p className="text-xs text-muted-foreground">/15</p>
          </div>

          {/* Pain Level */}
          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Stethoscope className="w-5 h-5 text-medical-warning" />
              <span className="font-medium text-sm">Pain Level</span>
              <div className={`vital-indicator ${vitals.painLevel > 7 ? 'vital-warning' : vitals.painLevel > 4 ? 'vital-caution' : 'vital-normal'}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.painLevel}</p>
            <p className="text-xs text-muted-foreground">/10</p>
          </div>

          {/* Blood Glucose (if available) */}

          <div className="bg-medical-surface p-4 rounded-lg border border-medical-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-medical-accent" />
              <span className="font-medium text-sm">Glucose</span>
              <div className={`vital-indicator ${vitals.bloodGlucose > 180 || vitals.bloodGlucose < 70 ? 'vital-warning' : 'vital-normal'}`}></div>
            </div>
            <p className="text-2xl font-bold text-foreground">{vitals.bloodGlucose}</p>
            <p className="text-xs text-muted-foreground">mg/dL</p>
          </div>

        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heart Rate Chart */}
        <Card className="medical-card p-6 fade-in">
          <h4 className="font-medium text-sm mb-4 text-medical-primary">Heart Rate Trend {heartRateTimeRange}</h4>
          <div className="h-48">
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
                  domain={heartRateData.length > 0 ? [Math.min(...heartRateData.map(d => d.value)) - 10, Math.max(...heartRateData.map(d => d.value)) + 10] : [60, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid hsl(var(--medical-muted))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `value: ${value}`,
                    props.payload.originalTime ? new Date(props.payload.originalTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric", 
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    }) : props.payload.time
                  ]}
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

        {/* Blood Pressure Chart */}
        <Card className="medical-card p-6 fade-in">
          <h4 className="font-medium text-sm mb-4 text-medical-primary">Blood Pressure Trend {bloodPressureTimeRange}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bloodPressureData}>
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
                  domain={[60, 150]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid hsl(var(--medical-muted))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `${name}: ${value}`,
                    props.payload.originalTime ? new Date(props.payload.originalTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric", 
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    }) : props.payload.time
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="systolic" 
                  stroke="hsl(var(--medical-primary))" 
                  strokeWidth={2}
                  name="Systolic"
                />
                <Line 
                  type="monotone" 
                  dataKey="diastolic" 
                  stroke="hsl(var(--medical-secondary))" 
                  strokeWidth={2}
                  name="Diastolic"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Oxygen Saturation Chart */}
        <Card className="medical-card p-6 fade-in">
          <h4 className="font-medium text-sm mb-4 text-medical-primary">Oxygen Saturation {oxygenTimeRange}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={oxygenData}>
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
                  domain={[90, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid hsl(var(--medical-muted))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `value: ${value}%`,
                    props.payload.originalTime ? new Date(props.payload.originalTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric", 
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    }) : props.payload.time
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--medical-secondary))" 
                  fill="hsl(var(--medical-secondary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Temperature Chart */}
        <Card className="medical-card p-6 fade-in">
          <h4 className="font-medium text-sm mb-4 text-medical-primary">Temperature Trend {temperatureTimeRange}</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temperatureData}>
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
                  domain={[36, 40]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid hsl(var(--medical-muted))',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    `value: ${value}°C`,
                    props.payload.originalTime ? new Date(props.payload.originalTime).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric", 
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    }) : props.payload.time
                  ]}
                />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--medical-warning))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
