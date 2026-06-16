# Patient MAR Implementation

This document outlines the conversion of the Patient MAR (Medication Administration Record) from static data to dynamic data using the API.

## Changes Made

### 1. Type Definitions Added (`src/types/patient.ts`)
- `MARRecord`: Interface for MAR data from API
- `MARMedication`: Extended medication interface for MAR display  
- `MARAdministrationRecord`: Interface for administration records

### 2. API Service Enhanced (`src/services/apiService.ts`)
- Enhanced `getCurrentMedicationsByPatient()` to return both medication and MAR data
- Now checks for `data[0].MAR` field in API response
- Returns structured object with `medications` and `marData` arrays

### 3. Utility Functions Created (`src/utils/marUtils.ts`)
- `parseDateTime()`: Handles various date/time formats from API
- `transformMARData()`: Converts API data to component-ready format
- `calculateDateRange()`: Determines date range based on actual MAR data
- Helper functions for medication type inference and status mapping

### 4. Patient MAR Component (`src/pages/Patient-mar.tsx`)
- **Route Parameters**: Now uses `useParams()` to get `admissionId` from URL
- **Dynamic Data Fetching**: Fetches real patient and MAR data on component mount
- **Loading States**: Added loading spinner and error handling
- **Real Patient Info**: Displays actual patient name, bed number, admission date
- **Dynamic Date Range**: Calculates dates based on actual MAR records
- **Status Mapping**: Maps API status values ("Given"/"Pending") to UI format
- **Semantic Colors**: Updated to use design system tokens instead of hardcoded colors

## Data Flow

1. Component receives `admissionId` from route parameters
2. Fetches patient data via `apiService.getPatientById()`
3. Fetches medications + MAR data via `apiService.getCurrentMedicationsByPatient()`
4. Transforms MAR data using utility functions
5. Renders dynamic MAR grid with real administration records

## API Data Structure Expected

The component expects MAR data in this format from `data[0].MAR`:

```json
{
  "marId": "12432bf8-2b70-4a5a-8f0e-c787572a31f3",
  "admissionId": "1008", 
  "medicationId": "3060",
  "name": "Metoprolol",
  "givenDateTime": "16-09-2025 12:24:55",
  "status": "Given", // or "Pending"
  "dosage": "10mg",
  "route": "topical",
  "prescribedBy": "Dr. Smith"
}
```

## Navigation

- MAR is accessible via `/consultationId/:admissionId/mar` route
- Navigation button exists in Patient Details page header
- Uses existing routing structure in `App.tsx`

## Features Implemented

- ✅ Real-time data fetching from API
- ✅ Dynamic date range calculation  
- ✅ Status tracking (Given/Pending/Held/Refused)
- ✅ Nurse administration tracking
- ✅ Medication scheduling display
- ✅ Summary statistics
- ✅ Responsive design with semantic colors
- ✅ Loading states and error handling

## Testing

To test the MAR functionality:
1. Navigate to any patient details page
2. Click the "MAR" button in the header
3. The MAR should display with real data for that patient's admission ID
4. If no MAR data exists, it will show a default 6-day view

The component gracefully handles missing MAR data and provides appropriate fallbacks.