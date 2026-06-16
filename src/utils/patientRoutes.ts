export type PatientFlowType = 'inpatient';

export const getPatientListPath = (type: PatientFlowType): string => '/corporate-deals';

export const getPatientDetailsPath = (
  consultationId: string,
  type: PatientFlowType,
): string => `/deals/${consultationId}`;

export const getPatientTypeFromPath = (pathname: string): PatientFlowType => 'inpatient';
