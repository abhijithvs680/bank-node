export interface DoctorVisitGroup {
  doctorId: string;
  doctorName: string;
  visits: any[];
}

export function groupVisitHistoryByDoctor(visitHistory: any[]): DoctorVisitGroup[] {
  const groupMap = new Map<string, DoctorVisitGroup>();

  for (const visit of visitHistory) {
    const doctorId = String(visit.DoctorID ?? visit.Network_GDID ?? 'unknown');
    const doctorName = visit.DoctorName || visit.NetworkName || 'Unknown Doctor';

    if (!groupMap.has(doctorId)) {
      groupMap.set(doctorId, { doctorId, doctorName, visits: [] });
    }
    groupMap.get(doctorId)!.visits.push(visit);
  }

  return Array.from(groupMap.values());
}
