import { VitalSigns } from '@/types/patient';

export interface ConsolidatedVitalData {
  currentVitals: VitalSigns | null;
  graphData: {
    heartRateData: { time: string; value: number }[];
    bloodPressureData: { time: string; systolic: number; diastolic: number }[];
    oxygenData: { time: string; value: number }[];
    temperatureData: { time: string; value: number }[];
  };
}

/**
 * Extract the latest vital signs from graph data arrays
 */
export const extractCurrentVitals = (graphData: any, consultationId: string): VitalSigns => {
  const heartRateData = graphData?.heartRate || [];
  const temperatureData = graphData?.temperature || [];
  const oxygenData = graphData?.sp02 || [];
  const bloodPressureData = graphData?.bp || [];
  const respRateData = graphData?.respRate || [];
  const gcsData = graphData?.gcs || [];
  const painLevelData = graphData?.painLevel || [];
  const bloodGlucoseData = graphData?.bloodGlucose || [];

  // Get the latest values from each data array
  const latestHeartRate = heartRateData.length > 0
    ? heartRateData[heartRateData.length - 1]?.value || 0
    : 0;

  const latestTemperature = temperatureData.length > 0
    ? parseFloat(temperatureData[temperatureData.length - 1]?.value) || 0
    : 0;

  const latestOxygen = oxygenData.length > 0
    ? oxygenData[oxygenData.length - 1]?.value || 0
    : 0;

  const latestBP = bloodPressureData.length > 0
    ? bloodPressureData[bloodPressureData.length - 1]
    : { systolic: 0, diastolic: 0 };

  const latestRespRate = respRateData.length > 0
    ? respRateData[respRateData.length - 1]?.value || 0
    : 0;

  const latestGCS = gcsData.length > 0
    ? gcsData[gcsData.length - 1]?.value || 0
    : 0;

  const latestPainLevel = painLevelData.length > 0
    ? painLevelData[painLevelData.length - 1]?.value || 0
    : 0;

  const latestBloodGlucose = bloodGlucoseData.length > 0
    ? bloodGlucoseData[bloodGlucoseData.length - 1]?.value || 0
    : 0;

  return {
    consultationId,
    timestamp: new Date().toISOString(),
    heartRate: latestHeartRate,
    bloodPressureSystolic: latestBP.systolic || 0,
    bloodPressureDiastolic: latestBP.diastolic || 0,
    respiratoryRate: latestRespRate,
    temperature: latestTemperature,
    oxygenSaturation: latestOxygen,
    painLevel: latestPainLevel,
    consciousnessLevel: "Alert",
    glasgowComaScale: { total: latestGCS },
    bloodGlucose: latestBloodGlucose
  };
};

/**
 * Transform graph data to the expected format for charts with Day X format
 */
export const transformGraphData = (data: any) => {
  // Helper function to create Day X labels based on chronological order
  const createDayLabels = (dataArray: any[]) => {
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
        // If multiple readings per day, add time suffix
        const timeLabel = dayItems.length > 1
          ? `${dayLabel} ${new Date(item.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
          : dayLabel;
        result.push({ ...item, dayLabel: timeLabel });
      });
    });

    return result;
  };

  const heartRateWithDays = createDayLabels(data?.heartRate || []);
  const bpWithDays = createDayLabels(data?.bp || []);
  const oxygenWithDays = createDayLabels(data?.sp02 || []);
  const temperatureWithDays = createDayLabels(data?.temperature || []);

  return {
    heartRateData: heartRateWithDays.map(d => ({
      time: d.dayLabel,
      value: d.value
    })).filter(d => d.value > 0),

    bloodPressureData: bpWithDays
      .filter(d => d.systolic > 0 && d.diastolic > 0)
      .map(d => ({
        time: d.dayLabel,
        systolic: d.systolic,
        diastolic: d.diastolic
      })),

    oxygenData: oxygenWithDays.map(d => ({
      time: d.dayLabel,
      value: d.value
    })),

    temperatureData: temperatureWithDays.map(d => ({
      time: d.dayLabel,
      value: parseFloat(d.value)
    }))
  };
};
