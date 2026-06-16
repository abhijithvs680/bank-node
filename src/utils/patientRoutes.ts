export type PatientFlowType = 'inpatient' | 'outpatient';

export const getPatientListPath = (type: PatientFlowType): string =>
  type === 'inpatient' ? '/inpatient' : '/patients';

export const getPatientDetailsPath = (
  consultationId: string,
  type: PatientFlowType,
): string =>
  type === 'inpatient'
    ? `/ip-details/${consultationId}`
    : `/consultationId/${consultationId}`;

export const getPatientTypeFromPath = (pathname: string): PatientFlowType =>
  pathname.startsWith('/inpatient') || pathname.startsWith('/ip-details')
    ? 'inpatient'
    : 'outpatient';
