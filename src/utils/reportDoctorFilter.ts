import { Medication } from '@/types/patient';

export const normalizeDoctorId = (id: unknown): string => String(id ?? '').trim();

/** Strict DoctorID used for consultation matching */
export const getItemDoctorId = (item: Record<string, unknown>): string =>
  normalizeDoctorId(item?.DoctorID ?? item?.doctorId ?? item?.DoctorId);

export const belongsToConsultationDoctor = (
  itemDoctorId: unknown,
  consultationDoctorId: unknown
): boolean => {
  const consultationId = normalizeDoctorId(consultationDoctorId);
  const itemId = normalizeDoctorId(itemDoctorId);
  return Boolean(consultationId && itemId && itemId === consultationId);
};

export const transformNoteForReport = (visit: Record<string, unknown>) => ({
  Type: (visit.Level || visit.NoteType || visit.Type || 'Clinical Note') as string,
  content: (visit.notes || visit.NoteContent || '') as string,
  doctorName: (visit.NetworkName || visit.DoctorName || '') as string,
  doctorId: getItemDoctorId(visit),
  date: (visit.UpdatedOn || visit.writtenOn || visit.lastUpdated || visit.VisitedOn || '') as string,
});

export const mapLabOrderForReport = (lab: Record<string, unknown>) => ({
  testName: (lab.TestName || lab.testName || lab.serviceName || lab.ServiceName || 'Unnamed Test') as string,
  notes: (lab.Notes || lab.notes || '') as string,
  createdOn: (lab.CreatedOn || lab.createdOn || lab.CreatedAt || lab.createdAt || '') as string,
  doctorId: getItemDoctorId(lab),
});

export const filterNotesForReport = (visits: unknown[], consultationDoctorId: string) =>
  Array.isArray(visits)
    ? visits
      .filter((visit) => belongsToConsultationDoctor(getItemDoctorId(visit as Record<string, unknown>), consultationDoctorId))
      .map((visit) => transformNoteForReport(visit as Record<string, unknown>))
    : [];

export const filterMedicationsForReport = (medications: Medication[], consultationDoctorId: string) =>
  medications
    .filter((med) => belongsToConsultationDoctor(med.prescribedBy, consultationDoctorId))
    .map((med) => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      route: med.route,
      duration: med.duration || med.numberOfDays || '',
      foodTiming: med.foodTiming || '',
      instructions: med.instructions || med.Instructions || '',
      status: med.status,
      prescribedBy: med.prescribedBy,
    }));

export const filterLabOrdersForReport = (
  labOrders: Array<{ testName: string; notes?: string; createdOn?: string; doctorId?: string }>,
  consultationDoctorId: string
) => labOrders.filter((lab) => belongsToConsultationDoctor(lab.doctorId, consultationDoctorId));

export const getDoctorFilteredReportSections = (
  visits: unknown[],
  medications: Medication[],
  labOrders: Array<{ testName: string; notes?: string; createdOn?: string; doctorId?: string }>,
  consultationDoctorId: string
) => ({
  notes: filterNotesForReport(visits, consultationDoctorId),
  medications: filterMedicationsForReport(medications, consultationDoctorId),
  labOrders: filterLabOrdersForReport(labOrders, consultationDoctorId),
});
