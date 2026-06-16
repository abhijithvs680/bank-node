import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';
import { VitalSigns } from '@/types/patient';
import { VitalSignsGraphData } from '@/services/apiService';

interface VitalSignsGraphsProps {
  vitals: VitalSigns | null;
  graphData: VitalSignsGraphData | null;
  loading: boolean;
  error: string | null;
}

export const VitalSignsGraphs = ({ vitals, graphData, loading, error }: VitalSignsGraphsProps) => {
  if (loading) return <div className="p-6">Loading vital signs graphs...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!graphData ) {
    graphData = {
      heartRateData: [],
      bloodPressureData: [],
      temperatureData: [],
      oxygenData: []
    }
  }

  // Helper function to calculate time difference and format accordingly
  const getTimeRangeLabel = (timestamps: string[]) => {
    if (timestamps.length === 0) return "(No data)";

    // Parse to Date objects and sort - handle DD-MM-YYYY HH:mm:ss format
    const sortedDates = timestamps
      .map(ts => {
        if (!ts) return null;
        // Handle DD-MM-YYYY HH:mm:ss format
        if (ts.includes('-') && ts.split('-')[0].length === 2) {
          const [datePart, timePart] = ts.split(' ');
          const [day, month, year] = datePart.split('-');
          const timeString = timePart || '00:00:00';
          return new Date(`${year}-${month}-${day}T${timeString}`);
        }
        // Handle other formats
        return new Date(ts);
      })
      .filter(date => date && !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) return "(No data)";

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

  // Transform data to use Day X format for x-axis
  const transformDataWithDayLabels = (dataArray: any[]) => {
    if (!dataArray || dataArray.length === 0) return [];
    
    // Sort data by time to ensure proper chronological order
    const sortedData = dataArray.sort((a, b) => {
      const dateA = parseCustomDate(a.time);
      const dateB = parseCustomDate(b.time);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Group by date to handle multiple readings per day
    const dayGroups = new Map();
    sortedData.forEach((item) => {
      const parsedDate = parseCustomDate(item.time);
      const date = parsedDate.toDateString();
      if (!dayGroups.has(date)) {
        dayGroups.set(date, []);
      }
      dayGroups.get(date).push({...item, parsedTime: parsedDate});
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
          ? `${dayLabel} ${item.parsedTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
          : dayLabel;
        result.push({ ...item, time: timeLabel, originalTime: item.time });
      });
    });
    
    return result;
  };

  // Helper function to parse custom date format DD-MM-YYYY HH:mm:ss
  const parseCustomDate = (timeStr: string): Date => {
    if (!timeStr) return new Date();
    
    // Handle DD-MM-YYYY HH:mm:ss format
    if (timeStr.includes('-') && timeStr.split('-')[0].length === 2) {
      const [datePart, timePart] = timeStr.split(' ');
      const [day, month, year] = datePart.split('-');
      const timeString = timePart || '00:00:00';
      return new Date(`${year}-${month}-${day}T${timeString}`);
    }
    
    // Handle other formats
    return new Date(timeStr);
  };

  // Use API data if available, otherwise fall back to empty arrays
  const heartRateData = transformDataWithDayLabels((graphData as any)?.heartRate || []);
  const temperatureData = transformDataWithDayLabels((graphData as any)?.temperature || []);
  const oxygenData = transformDataWithDayLabels((graphData as any)?.sp02 || []);
  const bloodPressureData = transformDataWithDayLabels((graphData as any)?.bp || []); 
  // Calculate time range labels for each chart
  const heartRateTimeRange = getTimeRangeLabel(heartRateData.map(d => d.originalTime || d.RecordedOn || d.time));
  const bloodPressureTimeRange = getTimeRangeLabel(bloodPressureData.map(d => d.originalTime ||d.RecordedOn|| d.time));
  const oxygenTimeRange = getTimeRangeLabel(oxygenData.map(d => d.originalTime || d.time));
  const temperatureTimeRange = getTimeRangeLabel(temperatureData.map(d => d.originalTime ||d.RecordedOn|| d.time));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Heart Rate Chart */}
      <Card className="medical-card p-6 fade-in">
        <h4 className="text-sm font-semibold mb-4 text-foreground">Heart Rate Trend {heartRateTimeRange}</h4>
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
                  `${value} BPM`,
                  props.payload.originalTime ? parseCustomDate(props.payload.originalTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric", 
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
        <h4 className="text-sm font-semibold mb-4 text-foreground">Blood Pressure Trend {bloodPressureTimeRange}</h4>
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
                  `${name}: ${value} mmHg`,
                  props.payload.originalTime ? parseCustomDate(props.payload.originalTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric", 
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
        <h4 className="text-sm font-semibold mb-4 text-foreground">Oxygen Saturation {oxygenTimeRange}</h4>
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
                  `${value}%`,
                  props.payload.originalTime ? parseCustomDate(props.payload.originalTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric", 
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
        <h4 className="text-sm font-semibold mb-4 text-foreground">Temperature Trend {temperatureTimeRange}</h4>
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
                domain={temperatureData.length > 0 ? [Math.min(...temperatureData.map(d => parseFloat(d.value))) - 1, Math.max(...temperatureData.map(d => parseFloat(d.value))) + 1] : [35, 40]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid hsl(var(--medical-muted))',
                  borderRadius: '8px'
                }}
                formatter={(value, name, props) => [
                  `${value}°C`,
                  props.payload.originalTime ? parseCustomDate(props.payload.originalTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric", 
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
  );
};