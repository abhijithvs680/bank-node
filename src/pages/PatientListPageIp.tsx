import { useState, useEffect, useCallback } from "react";
import { PatientCardIp } from "@/components/PatientCardIp";
import { PatientListRowIp } from "@/components/PatientListRowIp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, LayoutGrid, List, Clock, CheckCircle, Flag } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { apiService } from "@/services/apiService";
import { Patient } from "@/types/patient";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";
import { usePatientListSocket } from "@/hooks/useSocket";
import { toast } from "@/hooks/use-toast";
import { getPatientTypeFromPath } from "@/utils/patientRoutes";

interface PatientSectionProps {
  title: string;
  patients: Patient[];
  viewMode: 'tile' | 'list';
  bgColor: string;
  borderColor: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const PatientSection = ({ title, patients, viewMode, bgColor, borderColor, badgeColor, icon }: PatientSectionProps) => {
  if (patients.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor} border ${borderColor} shadow-sm`}>
          {icon}
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-semibold text-[#1a2256]">{title}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${badgeColor} border border-current/10`}>
              {patients.length} Deal{patients.length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[13px] text-[#1a2256]/50 font-medium">Capture and overview recent activity</p>
        </div>
      </div>

      {viewMode === 'tile' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientCardIp key={patient.consultationId} patient={patient} patientType="inpatient" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[1.5fr,1fr,2fr,1.2fr,1fr,0.8fr,1.5fr] gap-4 px-6 py-3 bg-[#1a2256]/[0.02] border-b border-[#1a2256]/10 mb-2">
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Deal Name</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Deal ID</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Borrower</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Arranger</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Jurisdiction</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Currency</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left md:text-right">Status</span>
          </div>
          {patients.map((patient) => (
            <PatientListRowIp key={patient.consultationId} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
};

const PatientListPageIp = () => {
  const location = useLocation();
  const patientType = getPatientTypeFromPath(location.pathname);
  const { user } = useAuth();
  const { appName, logoUrl } = useBranding();
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('list');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch/refresh patients
  const fetchPatients = useCallback(async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      const data = await apiService.getPatients(user.email, patientType);
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch consultations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email, patientType]);

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
      title: "Deal Dashboard Updated",
      description: "Latest deal data loaded",
    });
  }, [fetchPatients]));

  const filteredPatients = patients.filter((patient) => {
    const dealName = patient.dealName || `${patient.firstName} ${patient.surName}`;
    const dealId = patient.dealId || `#AG${patient.consultationId}`;
    const borrower = patient.borrower || "ORION MANUFACTURING HOLDINGS LIMITED";

    const matchesSearch =
      dealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dealId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      borrower.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesJurisdiction =
      jurisdictionFilter === "all" ||
      (patient.jurisdiction || "").toLowerCase() === jurisdictionFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (patient.dealStatus || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesJurisdiction && matchesStatus;
  });

  // Group patients by status
  const pendingPatients = filteredPatients.filter(
    (patient) => (patient.dealStatus || "Pre Financial Close") === "Pre Financial Close"
  );

  const completedPatients = filteredPatients.filter(
    (patient) => (patient.dealStatus || "") === "Completed"
  );

  const getActiveCount = (patients: Patient[]) =>
    patients.filter((p) => p.dealStatus === "Pre Financial Close").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Gradient Theme */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[200%] bg-indigo-500/5 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
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
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 max-w-[1800px] mx-auto">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#1a2256]/40 group-focus-within:text-[#1a2256] transition-colors" />
            <Input
              placeholder="Search by deal name, ID, or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-[15px] font-medium rounded-xl border-[#1a2256]/10 bg-[#1a2256]/[0.02] focus:bg-white focus:border-[#1a2256] focus:ring-4 focus:ring-[#1a2256]/5 transition-all outline-none"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            <div className="h-12 flex items-center gap-2 px-4 bg-[#1a2256]/[0.02] border border-[#1a2256]/10 rounded-xl">
              <Filter className="w-4 h-4 text-[#1a2256]/50" />
              <div className="h-6 w-[1px] bg-[#1a2256]/10 mx-1" />

              <select
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
                className="h-full px-2 text-[14px] font-semibold bg-transparent text-[#1a2256] focus:outline-none cursor-pointer"
              >
                <option value="all">Jurisdiction: All</option>
                <option value="SA">Jurisdiction: SA</option>
                <option value="UK">Jurisdiction: UK</option>
                <option value="US">Jurisdiction: US</option>
                <option value="EU">Jurisdiction: EU</option>
              </select>

              <div className="h-6 w-[1px] bg-[#1a2256]/10 mx-1" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-full px-2 text-[14px] font-semibold bg-transparent text-[#1a2256] focus:outline-none cursor-pointer"
              >
                <option value="all">Status: All</option>
                <option value="pre financial close">Pre Financial Close</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Deal List */}
      <main className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading deal details...</div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No deals found.
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-[1600px] mx-auto w-full">
            {/* Main Content Area */}
            <div className="w-full">
              <section>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-[24px] font-semibold text-[#1a2256]">
                      Deal Listing
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-[#1a2256]/[0.02] border border-[#1a2256]/10 rounded-full text-[13px] font-semibold text-[#1a2256]/60">
                        {filteredPatients.length} Total
                      </span>
                      {getActiveCount(filteredPatients) > 0 && (
                        <div className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-[13px] font-semibold flex items-center gap-1.5">
                          <Flag className="w-3.5 h-3.5 text-blue-500" />
                          {getActiveCount(filteredPatients)} Pre-Close
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

                {/* Pending Deals Section */}
                <PatientSection
                  title="Active Deals (Pre Financial Close)"
                  patients={pendingPatients}
                  viewMode={viewMode}
                  bgColor="bg-blue-50/50"
                  borderColor="border-blue-200"
                  badgeColor="bg-blue-100 text-blue-700"
                  icon={<Clock className="w-5 h-5 text-blue-600" />}
                />

                {/* Completed Deals Section */}
                <PatientSection
                  title="Completed Deals"
                  patients={completedPatients}
                  viewMode={viewMode}
                  bgColor="bg-green-50/50"
                  borderColor="border-green-200"
                  badgeColor="bg-green-100 text-green-700"
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                />

                {filteredPatients.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    No deals match your filters.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientListPageIp;
