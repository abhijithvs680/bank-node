import { useState, useEffect, useCallback } from "react";
import { PatientCard } from "@/components/PatientCard";
import { PatientListRow } from "@/components/PatientListRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, ArrowLeft, LayoutGrid, List, Clock, CheckCircle, CircleUser, AlertTriangle, CalendarIcon, X } from "lucide-react";
import ConsolidatedMedicationWidget from "@/components/ConsolidatedMedicationWidget";
import UserProfile from "@/components/UserProfile";
import { apiService } from "@/services/apiService";
import { Patient } from "@/types/patient";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { Touchable } from "@/components/ui/touchable";
import { usePatientListSocket } from "@/hooks/useSocket";
import { toast } from "@/hooks/use-toast";
import { patientMedicineSearchService } from "@/services/patientMedicineSearchService";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateForApi } from "@/utils/timeUtils";

import { getPatientTypeFromPath, getPatientListPath, getPatientDetailsPath, type PatientFlowType } from "@/utils/patientRoutes";

interface PatientSectionProps {
  title: string;
  patients: Patient[];
  viewMode: 'tile' | 'list';
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  icon: React.ReactNode;
  patientType: PatientFlowType;
}

const PatientSection = ({ title, patients, viewMode, bgColor, borderColor, badgeColor, icon, patientType }: PatientSectionProps) => {
  if (patients.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} border ${borderColor} shadow-sm`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-semibold text-[#1a2256]">{title}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${badgeColor} border border-current/10`}>
              {patients.length} Patient{patients.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[13px] text-[#1a2256]/50 font-medium">Capture and overview recent activity</p>
        </div>
      </div>

      {viewMode === 'tile' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientCard key={patient.consultationId} patient={patient} patientType={patientType} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[24px] border border-[#1a2256]/10 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1.5fr,2.5fr,2fr,120px,auto] gap-4 px-8 py-4 bg-[#1a2256]/[0.02] border-b border-[#1a2256]/10">
            <span className="text-[13px] font-semibold text-[#1a2256]/60 uppercase tracking-wider">Patient Details</span>
            <span className="text-[13px] font-semibold text-[#1a2256]/60 uppercase tracking-wider">Symptoms</span>
            <span className="text-[13px] font-semibold text-[#1a2256]/60 uppercase tracking-wider">Purpose of Visit</span>
            <span className="text-[13px] font-semibold text-[#1a2256]/60 uppercase tracking-wider">Clinical Severity</span>
            <span className="w-5"></span>
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-[#1a2256]/5">
            {patients.map((patient) => (
              <PatientListRow key={patient.consultationId} patient={patient} patientType={patientType} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PatientListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientType = getPatientTypeFromPath(location.pathname);
  const { user } = useAuth();
  const { appName, logoUrl } = useBranding();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Function to fetch/refresh patients
  const fetchPatients = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const scheduledDate = selectedDate ? formatDateForApi(selectedDate) : '';
      const data = await apiService.getPatients(user.email, patientType, scheduledDate);
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, patientType, selectedDate]);

  // Initial fetch
  useEffect(() => {
    if (user?.email) {
      fetchPatients();
    }
  }, [user?.email, fetchPatients]);

  // Socket listener for patient list updates
  usePatientListSocket(useCallback(() => {
    console.log('[PatientListPage] Socket triggered refresh');
    fetchPatients();
    toast({
      title: "Patient List Updated",
      description: "New patient data received",
    });
  }, [fetchPatients]));

  // Initialize patient medicine search service on mount (API call on landing)
  useEffect(() => {
    const initializeMedicineData = async () => {
      try {
        console.log('[PatientListPage] Initializing patient medicine search service...');
        await patientMedicineSearchService.initializeData();
        console.log('[PatientListPage] Medicine data initialized');
      } catch (error) {
        console.error('[PatientListPage] Failed to initialize medicine data:', error);
      }
    };

    initializeMedicineData();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      `${patient.firstName} ${patient.surName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      patient.consultationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.primaryDiagnosis.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (patient.consultationStatus === "Pending" || patient.appointmentStatus === "Pending")) ||
      (statusFilter === "completed" && (patient.consultationStatus === "Completed" || patient.appointmentStatus === "Completed"));

    const matchesSeverity =
      severityFilter === "all" ||
      patient.severity?.toLowerCase() === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Group patients by status
  const pendingPatients = filteredPatients.filter(
    (patient) => patient.consultationStatus === "Pending" || patient.appointmentStatus === "Pending"
  );

  const completedPatients = filteredPatients.filter(
    (patient) => patient.consultationStatus === "Completed" || patient.appointmentStatus === "Completed"
  );

  const getCriticalCount = (patients: Patient[]) =>
    patients.filter((p) => p.healthStatus === "Critical").length;


  return (
    <div className="min-h-screen bg-medical-surface">
      {/* Header - Gradient Theme */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[200%] bg-indigo-500/5 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Touchable
              onClick={() => navigate('/inpatient')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            </Touchable>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={logoUrl}
                  className="w-40 sm:w-[140px]"
                  alt={`${appName} Logo`}
                />

              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-white/10 hidden sm:block" />
            <UserProfile variant="header" />
          </div>
        </div>
      </header>

      {/* Search and Filter Bar - Premium Styling */}
      <div className="bg-white border-b border-[#1a2256]/10 px-6 py-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 max-w-[1800px] mx-auto">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a2256]/40 group-focus-within:text-[#1a2256] transition-colors" />
            <Input
              placeholder="Search by name, ID, or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-[15px] font-medium rounded-xl border-[#1a2256]/10 bg-[#1a2256]/[0.02] focus:bg-white focus:border-[#1a2256] focus:ring-4 focus:ring-[#1a2256]/5 transition-all outline-none w-full"
            />
          </div>

          {/* Filters Row — unified h-12 toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="h-12 flex items-center gap-2 px-3 sm:px-4 bg-[#1a2256]/[0.02] border border-[#1a2256]/10 rounded-xl">
              <CalendarIcon className="w-4 h-4 text-[#1a2256]/50 shrink-0" />
              <span className="text-[13px] font-semibold text-[#1a2256]/50 whitespace-nowrap hidden sm:inline">
                Date
              </span>
              <div className="h-6 w-[1px] bg-[#1a2256]/10 shrink-0 hidden sm:block" />

              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "h-8 px-2 text-[14px] font-semibold bg-transparent focus:outline-none cursor-pointer whitespace-nowrap",
                      selectedDate ? "text-[#1a2256]" : "text-[#1a2256]/50"
                    )}
                  >
                    {selectedDate ? format(selectedDate, "MM/dd/yyyy") : "All dates"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-[16px] border-[#1a2256]/10 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <>
                  <div className="h-6 w-[1px] bg-[#1a2256]/10 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setSelectedDate(undefined)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-[#1a2256]/40 hover:text-[#1a2256] hover:bg-[#1a2256]/5 transition-colors shrink-0"
                    title="Clear date"
                    aria-label="Clear date filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="h-12 flex items-center gap-2 px-3 sm:px-4 bg-[#1a2256]/[0.02] border border-[#1a2256]/10 rounded-xl">
              <Filter className="w-4 h-4 text-[#1a2256]/50 shrink-0" />
              <div className="h-6 w-[1px] bg-[#1a2256]/10 shrink-0" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 text-[14px] font-semibold bg-transparent text-[#1a2256] focus:outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="pending">Status: Pending</option>
                <option value="completed">Status: Completed</option>
              </select>

              <div className="h-6 w-[1px] bg-[#1a2256]/10 shrink-0" />

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-8 px-2 text-[14px] font-semibold bg-transparent text-[#1a2256] focus:outline-none cursor-pointer"
              >
                <option value="all">Severity: All</option>
                <option value="mild">Severity: Mild</option>
                <option value="moderate">Severity: Moderate</option>
                <option value="severe">Severity: Severe</option>
                <option value="critical">Severity: Critical</option>
              </select>
            </div>

            <a
              href={`${import.meta.env.VITE_API_BASE || 'https://innov-dev.beta.injomo.com'}/tiny.url/ls/liveapps.view/gdrouting68fb1b92f3f43/consultationid/?user_token=${localStorage.getItem('jwtToken')}&redirectpage=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-4 border border-[#e0e3f5] bg-[#f5f7fc] hover:bg-[#ebeef5] text-[#64549f] rounded-xl text-[13px] font-semibold transition-all active:scale-[0.98] no-underline whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Manage Indent
            </a>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <main className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading patients...</div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No patients found.
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
            {/* Main Content Area */}
            <div className="w-full">
              <section>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-[24px] font-semibold text-[#1a2256]">
                      Patients List
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#1a2256]/[0.02] border border-[#1a2256]/10 rounded-full text-[13px] font-semibold text-[#1a2256]/60">
                        {filteredPatients.length} Total
                      </span>
                      {getCriticalCount(filteredPatients) > 0 && (
                        <div className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1 rounded-full text-[13px] font-semibold flex items-center gap-1.5 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {getCriticalCount(filteredPatients)} Critical
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Toggle - Premium Styling */}
                  <div className="flex items-center p-1 bg-[#1a2256]/[0.03] border border-[#1a2256]/10 rounded-[14px] self-start sm:self-auto">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('tile')}
                      className={`h-9 px-4 flex items-center gap-2 rounded-lg transition-all ${viewMode === 'tile'
                        ? 'bg-[#1a2256] text-white shadow-lg'
                        : 'text-[#1a2256]/40 hover:text-[#1a2256] hover:bg-white'
                        }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="text-[12px] font-semibold uppercase tracking-wider">Tiles</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={`h-9 px-4 flex items-center gap-2 rounded-lg transition-all ${viewMode === 'list'
                        ? 'bg-[#1a2256] text-white shadow-lg'
                        : 'text-[#1a2256]/40 hover:text-[#1a2256] hover:bg-white'
                        }`}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-[12px] font-semibold uppercase tracking-wider">List</span>
                    </Button>
                  </div>
                </div>

                {/* Pending Patients Section */}
                <PatientSection
                  title="Pending Consultations"
                  patients={pendingPatients}
                  viewMode={viewMode}
                  bgColor="bg-amber-50/50"
                  borderColor="border-amber-200"
                  badgeColor="bg-amber-100 text-amber-700"
                  icon={<Clock className="w-5 h-5 text-amber-600" />}
                  patientType={patientType}
                />

                {/* Completed Patients Section */}
                <PatientSection
                  title="Completed Consultations"
                  patients={completedPatients}
                  viewMode={viewMode}
                  bgColor="bg-green-50/50"
                  borderColor="border-green-200"
                  badgeColor="bg-green-100 text-green-700"
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                  patientType={patientType}
                />

                {filteredPatients.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No patients match your filters.
                  </div>
                )}
              </section>
            </div>

            {/* Medication Widget - Now stacks below or in a full-width container */}
            <div className="w-full">
              <ConsolidatedMedicationWidget
                patientsData={filteredPatients}
                medications={medications}
                onAddMedication={() => { }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientListPage;
