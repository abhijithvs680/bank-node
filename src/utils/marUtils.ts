import { MARMedication, MARAdministrationRecord } from '@/types/patient';

// MARRecord interface for internal use
interface MARRecord {
  marId: string;
  consultationId: string;
  medicationId: string;
  name: string;
  givenDateTime: string;
  startDate: string;
  plannedEndDateTime: string;
  actualStartDateTime: string;
  actualEndDateTime: string;
  frequency: string;
  prescribedByNetworkGdid: number;
  prescribedBy: string;
  status: 'Given' | 'Pending' | 'Held' | 'Refused';
  dosage: string;
  route: string;
  infusionRate: string;
  durationMinutes: string;
  reason: string;
  rowID: string;
}

// Parse date string from MAR API format
export const parseDateTime = (dateTimeString: string): Date | null => {
  if (!dateTimeString) return null;
  
  // Handle DD-MM-YYYY HH:mm:ss format
  if (dateTimeString.includes('-') && dateTimeString.includes(':')) {
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  
  // Handle DD/MM/YYYY HH:mm:ss format
  if (dateTimeString.includes('/') && dateTimeString.includes(':')) {
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  
  return new Date(dateTimeString);
};

// Transform MAR records into medication definitions and administration records
export const transformMARData = (marRecords: MARRecord[]): {
  medicationDefinitions: Record<string, MARMedication>;
  administrationRecords: MARAdministrationRecord[];
} => {
  const medicationMap = new Map<string, MARMedication>();
  const administrationRecords: MARAdministrationRecord[] = [];

  marRecords.forEach((record) => {
    const medicationId = record.medicationId;

    // Create or update medication definition
    if (!medicationMap.has(medicationId)) {
      medicationMap.set(medicationId, {
        medicationId: medicationId,
        name: record.name,
        dosage: record.dosage,
        route: record.route,
        frequency: record.frequency,
        type: record.name,
        prescriber: record.prescribedBy || 'Unknown',
        status: inferStatus(record),
        administrationRecords: []
      });
    }

    // Only create administration record if medication was actually given (has givenDateTime)
    if (record.givenDateTime) {
      const givenDate = parseDateTime(record.givenDateTime);
      if (givenDate) {
        administrationRecords.push({
          medicationId: medicationId,
          date: givenDate,
          time: formatTime(givenDate),
          administeredBy: record.prescribedBy || 'Unknown Nurse',
          status: record.status.toLowerCase() as 'given' | 'held' | 'refused' | 'pending',
          actualDateTime: record.givenDateTime
        });
      }
    }
  });

  return {
    medicationDefinitions: Object.fromEntries(
      Array.from(medicationMap.entries()).map(([id, med]) => [id, med])
    ),
    administrationRecords
  };
};


const inferStatus = (record: MARRecord): 'active' | 'completed' | 'discontinued' => {
  if (record.actualEndDateTime && parseDateTime(record.actualEndDateTime)) {
    return 'completed';
  }
  if (record.status === 'Pending') {
    return 'active';
  }
  return 'active';
};

const formatTime = (date: Date): string => {
  return date.toTimeString().substr(0, 5); // HH:MM format
};

// Calculate date range based on MAR data
export const calculateDateRange = (marRecords: MARRecord[]): Date[] => {
  if (!marRecords.length) {
    // Default to 6-day range if no data
    const dates = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    for (let i = 0; i < 6; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const dates = new Set<string>(); 
  marRecords.forEach(record => {
    if (record.givenDateTime) {
      const date = parseDateTime(record.givenDateTime);
      if (date) {
        dates.add(date.toDateString());
      }
    }
    if (record.startDate) {
      const date = parseDateTime(record.startDate);
      if (date) {
        dates.add(date.toDateString());
      }
    }
  });

  const sortedDates = Array.from(dates)
    .map(dateString => new Date(dateString))
    .sort((a, b) => a.getTime() - b.getTime());

  // If we have less than 6 dates, pad with recent dates
  if (sortedDates.length < 6) {
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (5 - i));
      if (!sortedDates.some(d => d.toDateString() === date.toDateString())) {
        sortedDates.push(date);
      }
    }
    sortedDates.sort((a, b) => a.getTime() - b.getTime());
  }

  return sortedDates;
};
