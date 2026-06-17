import { useState, useEffect, useCallback } from "react";
import { DealCard } from "@/components/DealCard";
import { DealListRow } from "@/components/DealListRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, LayoutGrid, List, Clock, CheckCircle, Flag, Crosshair } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { apiService } from "@/services/apiService";
import { Patient } from "@/types/patient";
import { useLocation, useNavigate } from "react-router-dom";
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

      {viewMode === 'tile' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {patients.map((patient) => (
            <DealCard key={patient.consultationId} patient={patient} />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 animate-in fade-in duration-300">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2.5fr,1.8fr,1.2fr,1fr,1.2fr,1.3fr] gap-4 px-6 py-3 bg-[#1a2256]/[0.02] border-b border-[#1a2256]/10 mb-1.5">
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Deal Info</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Borrower</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Arranger</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Currency</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left">Health Score</span>
            <span className="text-[12px] font-semibold text-[#1a2256]/60 uppercase tracking-wider text-left md:text-right">Status</span>
          </div>
          {patients.map((patient) => (
            <DealListRow key={patient.consultationId} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
};

const CorporateDealsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientType = getPatientTypeFromPath(location.pathname);
  const { user } = useAuth();
  const { appName, logoUrl } = useBranding();
  const [searchTerm, setSearchTerm] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'tile' | 'list'>('list');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
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

    return matchesSearch && matchesJurisdiction;
  });

  // Group patients by status
  const pendingPatients = filteredPatients.filter(
    (patient) => {
      const status = patient.dealStatus || "Pre Financial Close";
      return status === "Pre Financial Close" || status === "Post Financial" || status === "Active";
    }
  );

  const completedPatients = filteredPatients.filter(
    (patient) => (patient.dealStatus || "") === "Completed"
  );

  const getActiveCount = (patients: Patient[]) =>
    patients.filter((p) => {
      const status = p.dealStatus || "Pre Financial Close";
      return status === "Pre Financial Close" || status === "Post Financial" || status === "Active";
    }).length;

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

          <div className="flex items-center gap-4">
            {/* Market Scan Button */}
            <button
              onClick={() => navigate("/market-scan")}
              className="flex items-center gap-2 animated-scan-btn text-white rounded-[10px] h-10 px-4 shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_22px_rgba(99,102,241,0.55)] transition-all duration-200 active:scale-95"
            >
              <Crosshair className="w-4 h-4" />
              <span className="text-[13px] font-bold tracking-wide whitespace-nowrap">Corporate X-Ray</span>
            </button>
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
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-[24px] font-semibold text-[#1a2256]">
                      Deal Listing
                    </h2>
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

                {/* Tabs Selector Bar */}
                <div className="flex border-b border-slate-200 mb-6 w-full">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3.5 px-6 text-[15px] font-semibold relative transition-all flex items-center gap-2 ${
                      activeTab === 'active' 
                        ? 'text-[#1a2256] border-b-2 border-b-[#1a2256]' 
                        : 'text-slate-400 hover:text-[#1a2256]/70 border-b-2 border-b-transparent'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${activeTab === 'active' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>Active Deals</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTab === 'active' ? 'bg-[#1a2256]/10 text-[#1a2256]' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {pendingPatients.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`pb-3.5 px-6 text-[15px] font-semibold relative transition-all flex items-center gap-2 ${
                      activeTab === 'completed' 
                        ? 'text-[#1a2256] border-b-2 border-b-[#1a2256]' 
                        : 'text-slate-400 hover:text-[#1a2256]/70 border-b-2 border-b-transparent'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${activeTab === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>Completed Deals</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      activeTab === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {completedPatients.length}
                    </span>
                  </button>
                </div>

                {/* Conditional Content Rendering */}
                {activeTab === 'active' ? (
                  pendingPatients.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-[#1a2256]/10 rounded-[24px] text-slate-400 font-medium shadow-sm">
                      No active deals found.
                    </div>
                  ) : (
                    <PatientSection
                      title="Active Deals"
                      patients={pendingPatients}
                      viewMode={viewMode}
                      bgColor="bg-blue-50/50"
                      borderColor="border-blue-200"
                      badgeColor="bg-blue-100 text-blue-700"
                      icon={<Clock className="w-5 h-5 text-blue-600" />}
                    />
                  )
                ) : (
                  completedPatients.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-[#1a2256]/10 rounded-[24px] text-slate-400 font-medium shadow-sm">
                      No completed deals found.
                    </div>
                  ) : (
                    <PatientSection
                      title="Completed Deals"
                      patients={completedPatients}
                      viewMode={viewMode}
                      bgColor="bg-green-50/50"
                      borderColor="border-green-200"
                      badgeColor="bg-green-100 text-green-700"
                      icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                    />
                  )
                )}

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

export default CorporateDealsPage;
