import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, User2, Loader2, Stethoscope, Target, AlertCircle, Plus, Edit2, Pill, Activity, FileText, BrainCircuit, Users, Tag, CheckCircle, Search } from 'lucide-react';
import { Patient, VitalSigns } from '@/types/patient';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

interface CustomCategoryItem {
  name: string;
  field: string;
  value: string;
}

const editFormLabelClass =
  'text-[#1a2256] font-bold text-[13px] uppercase tracking-wide block';
const editFormTextareaClass =
  'resize-none rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white focus-visible:ring-[#1a2256]/10 transition-all text-[15px] font-medium leading-relaxed w-full';

interface PatientOverviewProps {
  patientData: Patient[];
  loading?: boolean;
  error?: string | null;
  consultationId: string;
  onAllergyUpdate?: () => void;
  isConsultationCompleted?: boolean;
  onViewReport?: () => void;
  onViewAIInterpretations?: () => void;
  onCompleteConsultation?: () => void;
  onProceedToDischarge?: () => void;
  isCompleting?: boolean;
  vitals?: VitalSigns | null;
  enabledCategories?: { field: string, name: string, description: string }[];
  isInpatient?: boolean;
}

export const PatientOverview = ({
  patientData,
  loading,
  error,
  consultationId,
  onAllergyUpdate,
  isConsultationCompleted,
  onViewReport,
  onViewAIInterpretations,
  onCompleteConsultation,
  onProceedToDischarge,
  isCompleting: isCompletingProp,
  vitals,
  enabledCategories = [],
  isInpatient = false,
}: PatientOverviewProps): JSX.Element => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editAllergy, setEditAllergy] = useState('');
  const [editComorbidity, setEditComorbidity] = useState('');
  const [isEditConsultationModalOpen, setIsEditConsultationModalOpen] = useState(false);
  const [isSavingConsultation, setIsSavingConsultation] = useState(false);
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editChiefComplaint, setEditChiefComplaint] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editMedicalHistory, setEditMedicalHistory] = useState('');
  const [editPurposeOfVisit, setEditPurposeOfVisit] = useState('');
  const [editUrgentConcerns, setEditUrgentConcerns] = useState('');
  const [editCurrentMedication, setEditCurrentMedication] = useState('');
  const [editFamilySocialHistory, setEditFamilySocialHistory] = useState('');
  const [editCustomCategories, setEditCustomCategories] = useState<CustomCategoryItem[]>([]);

  const { toast } = useToast();

  // Parse custom categories from patient data
  const parsedCustomCategories: CustomCategoryItem[] = (() => {
    try {
      const raw = patientData?.[0]?.customCategories;
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();

  const allCategories = useMemo(() => {
    const categories = [...enabledCategories];

    // Add any categories from parsedCustomCategories that are not in enabledCategories
    parsedCustomCategories.forEach(customCat => {
      const field = customCat.field || `custom_${customCat.name.toLowerCase().replace(/\s+/g, '_')}`;
      const exists = categories.some(cat =>
        (cat.field && cat.field.trim().toLowerCase() === field.trim().toLowerCase()) ||
        (cat.name && customCat.name && cat.name.trim().toLowerCase() === customCat.name.trim().toLowerCase())
      );

      if (!exists) {
        categories.push({
          field: field,
          name: customCat.name,
          description: ''
        });
      }
    });

    return categories;
  }, [enabledCategories, parsedCustomCategories]);

  const displayCategories = useMemo(() => {
    if (!isInpatient) return allCategories;
    return [
      { field: 'lenders', name: 'Lenders', description: '' },
      { field: 'borrower', name: 'Borrowers', description: '' },
      { field: 'arranger', name: 'Arranger', description: '' },
      { field: 'primaryTmu', name: 'TMU', description: '' },
      { field: 'primaryFo', name: 'FO', description: '' }
    ];
  }, [allCategories, isInpatient]);

  useEffect(() => {
    if (consultationId && patientData?.length > 0) {
      const p = patientData[0];
      setPatient(p);
      setEditAllergy(p.allergy || '');
      setEditComorbidity(p.comorbidity || '');
      setEditChiefComplaint(p.chiefComplaint || '');
      setEditSymptoms(p.symptoms || '');
      setEditDuration(p.duration || '');
      setEditMedicalHistory(p.medicalHistory || '');
      setEditPurposeOfVisit(p.purposeOfVisit || '');
      setEditUrgentConcerns(p.urgentConcerns || '');
      setEditCurrentMedication(p.currentMedication || '');
      setEditFamilySocialHistory(p.familySocialHistory || '');

      // Initialize custom categories for editing
      try {
        const raw = p.customCategories;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setEditCustomCategories(parsed);
        }
      } catch { /* ignore */ }
    }
  }, [consultationId, patientData]);

  useEffect(() => {
    const handleOverviewFieldUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { field, content, value } = customEvent.detail;
      const finalValue = content || value || '';

      switch (field) {
        case 'chiefComplaint':
          setEditChiefComplaint(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditConsultationModalOpen(true);
          break;
        case 'symptoms':
          setEditSymptoms(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditConsultationModalOpen(true);
          break;
        case 'medicalHistory':
          setEditMedicalHistory(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditConsultationModalOpen(true);
          break;
        case 'familySocialHistory':
          setEditFamilySocialHistory(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditConsultationModalOpen(true);
          break;
        case 'allergy':
        case 'allergies':
          setEditAllergy(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditModalOpen(true);
          break;
        case 'comorbidity':
          setEditComorbidity(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditModalOpen(true);
          break;
        case 'currentMedication':
          setEditCurrentMedication(prev => prev ? `${prev}, ${finalValue}` : finalValue);
          setIsEditConsultationModalOpen(true);
          break;
      }
    };

    const handleVisitInfoRequested = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail?.data || customEvent.detail;
      console.log('PatientOverview: Received AI visit information updates', data);

      if (data.chiefComplaint !== undefined) setEditChiefComplaint(data.chiefComplaint);
      if (data.symptoms !== undefined) setEditSymptoms(data.symptoms);
      if (data.duration !== undefined) setEditDuration(data.duration);
      if (data.medicalHistory !== undefined) setEditMedicalHistory(data.medicalHistory);
      if (data.purposeOfVisit !== undefined) setEditPurposeOfVisit(data.purposeOfVisit);
      if (data.urgentConcerns !== undefined) setEditUrgentConcerns(data.urgentConcerns);
      if (data.familySocialHistory !== undefined) setEditFamilySocialHistory(data.familySocialHistory);
      if (data.allergy !== undefined) setEditAllergy(data.allergy);
      if (data.comorbidity !== undefined) setEditComorbidity(data.comorbidity);
      if (data.currentMedication !== undefined) setEditCurrentMedication(data.currentMedication);

      if (data.customFields) {
        setEditCustomCategories(prev => prev.map(cat => {
          const aiValue = data.customFields[cat.name] || data.customFields[cat.field];
          if (aiValue !== undefined) {
            return { ...cat, value: aiValue };
          }
          return cat;
        }));
      }

      setIsEditConsultationModalOpen(true);

      document.dispatchEvent(new CustomEvent('ai-visit-information-completed', {
        detail: { success: true, message: 'Form populated with suggested values' }
      }));
    };

    document.addEventListener('ai-overview-field-update', handleOverviewFieldUpdate);
    document.addEventListener('ai-visit-information-requested', handleVisitInfoRequested);

    return () => {
      document.removeEventListener('ai-overview-field-update', handleOverviewFieldUpdate);
      document.removeEventListener('ai-visit-information-requested', handleVisitInfoRequested);
    };
  }, [enabledCategories, editCustomCategories]);

  const handleOpenEditModal = () => {
    setEditAllergy(patient?.allergy || '');
    setEditComorbidity(patient?.comorbidity || '');
    setIsEditModalOpen(true);
  };

  const handleOpenEditConsultationModal = () => {
    setEditSymptoms(patient?.symptoms || '');
    setEditChiefComplaint(patient?.chiefComplaint || '');
    setEditDuration(patient?.duration || '');
    setEditMedicalHistory(patient?.medicalHistory || '');
    setEditPurposeOfVisit(patient?.purposeOfVisit || '');
    setEditUrgentConcerns(patient?.urgentConcerns || '');
    setEditCurrentMedication(patient?.currentMedication || '');
    setEditFamilySocialHistory(patient?.familySocialHistory || '');
    setEditAllergy(patient?.allergy || '');
    setEditComorbidity(patient?.comorbidity || '');

    const customCats = allCategories.filter(c => c.field.startsWith('custom_') || (![
      'chiefComplaint', 'purposeOfVisit', 'urgentConcerns', 'symptoms', 'medicalHistory',
      'allergy', 'medication', 'familySocialHistory', 'comorbidity', 'vitals'
    ].includes(c.field)));

    const mergedCustom: CustomCategoryItem[] = customCats.map((cat) => {
      const existing = parsedCustomCategories.find(c =>
        (c.field && c.field.trim().toLowerCase() === cat.field.trim().toLowerCase()) ||
        (c.name && cat.name && c.name.trim().toLowerCase() === cat.name.trim().toLowerCase())
      );
      return {
        field: cat.field,
        name: cat.name,
        value: existing?.value || ''
      };
    });

    setEditCustomCategories(mergedCustom);
    setIsEditConsultationModalOpen(true);
  };

  const handleSaveAllergiesComorbidities = async () => {
    if (!consultationId) return;
    try {
      setIsSaving(true);
      await apiService.updateAllergiesAndComorbidities({
        consultationId,
        allergy: editAllergy,
        comorbidity: editComorbidity
      });
      if (patient) {
        setPatient({ ...patient, allergy: editAllergy, comorbidity: editComorbidity });
      }
      onAllergyUpdate?.();
      setIsEditModalOpen(false);
      toast({
        title: "Success",
        description: "Allergies and comorbidities updated successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update allergies and comorbidities",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveConsultationInformation = async () => {
    if (!consultationId) return;
    try {
      setIsSavingConsultation(true);

      const customCategoriesJson = editCustomCategories.length > 0
        ? JSON.stringify(editCustomCategories)
        : undefined;

      const payload = {
        consultationId,
        chiefComplaint: editChiefComplaint,
        symptoms: editSymptoms,
        duration: editDuration,
        medicalHistory: editMedicalHistory,
        purposeOfVisit: isInpatient ? (patient?.purposeOfVisit || '') : editPurposeOfVisit,
        urgentConcerns: editUrgentConcerns,
        currentMedication: editCurrentMedication,
        familySocialHistory: editFamilySocialHistory,
        allergy: editAllergy,
        comorbidity: editComorbidity,
        customCategories: customCategoriesJson
      };

      await apiService.updateConsultationInformation(payload);

      if (patient) {
        setPatient({
          ...patient,
          ...payload,
          customCategories: customCategoriesJson || patient.customCategories
        });
      }

      onAllergyUpdate?.();
      setIsEditConsultationModalOpen(false);
      toast({
        title: "Success",
        description: isInpatient
          ? "Admission information updated successfully"
          : "Visit information updated successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update visit information",
        variant: "destructive"
      });
    } finally {
      setIsSavingConsultation(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] overflow-hidden border border-[#e0e3f5] p-3 pb-3">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-[#64549f]" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="bg-white rounded-[20px] overflow-hidden border border-[#e0e3f5] p-3 pb-3">
        <div className="flex flex-col items-center justify-center h-48 bg-red-50 rounded-xl border border-red-100 p-6">
          <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-700 font-medium">{error || 'Patient data not found'}</p>
        </div>
      </div>
    );
  }

  const allergyItems = patient.allergy ? patient.allergy.split(',').map(s => s.trim()).filter(Boolean) : [];
  const comorbidityItems = patient.comorbidity ? patient.comorbidity.split(',').map(s => s.trim()).filter(Boolean) : [];

  const getCategoryIcon = (field: string) => {
    switch (field) {
      case 'lenders': return <Users className="w-4 h-4 text-[#64549f]" />;
      case 'borrower': return <User2 className="w-4 h-4 text-[#64549f]" />;
      case 'arranger': return <User2 className="w-4 h-4 text-[#64549f]" />;
      case 'primaryTmu': return <User2 className="w-4 h-4 text-[#64549f]" />;
      case 'primaryFo': return <User2 className="w-4 h-4 text-[#64549f]" />;
      case 'chiefComplaint': return <BrainCircuit className="w-4 h-4 text-[#64549f]" />;
      case 'purposeOfVisit': return <Target className="w-4 h-4 text-[#64549f]" />;
      case 'urgentConcerns': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'symptoms': return <Activity className="w-4 h-4 text-[#64549f]" />;
      case 'medicalHistory': return <FileText className="w-4 h-4 text-[#64549f]" />;
      case 'allergy': return <CheckCircle className="w-4 h-4 text-[#64549f]" />;
      case 'medication': return <Pill className="w-4 h-4 text-[#64549f]" />;
      case 'familySocialHistory': return <Users className="w-4 h-4 text-[#64549f]" />;
      case 'comorbidity': return <Stethoscope className="w-4 h-4 text-[#64549f]" />;
      default: return <Tag className="w-4 h-4 text-[#64549f]" />;
    }
  };
  const renderCategoryValue = (category: { field: string, name: string, description: string }) => {
    const { field } = category;
    switch (field) {
      case 'lenders':
        const lenderItems = patient.lenders ? patient.lenders.split(',').map(s => s.trim()).filter(Boolean) : [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {lenderItems.length > 0 ? lenderItems.map((item, idx) => (
              <span key={idx} className="border border-[#d6d8e3] rounded-[7px] px-3 py-0.5 text-[0.875rem] font-medium text-[#161616] font-['Inter'] bg-[#f8f9fc] text-slate-800">
                {item}
              </span>
            )) : (
              <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">Standard Bank of South Africa (SBSA)</span>
            )}
          </div>
        );
      case 'borrower': return (
        <div className="flex flex-wrap items-center gap-2.5 py-0.5 w-full">
          <span
            className="text-[0.94rem] font-semibold text-blue-600 hover:underline cursor-pointer font-['Inter']"
            onClick={() => navigate(`/borrower/${patient?.consultationId}`)}
          >
            {patient?.borrower || 'ORION MANUFACTURING HOLDINGS LIMITED'}
          </span>
          <Badge variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-[11px] font-bold py-0.5 px-2 rounded-full whitespace-nowrap shadow-none">
            2 Risk Factors
          </Badge>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsScanning(true);
              setTimeout(() => {
                setIsScanning(false);
                navigate(`/borrower/${patient?.consultationId}`);
              }, 1500);
            }}
            disabled={isScanning}
            className={`h-[21px] px-2 rounded-md text-[8px] font-extrabold tracking-widest uppercase transition-all shadow-sm flex items-center gap-1 active:scale-95 border-0 ${isScanning
              ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 cursor-not-allowed animate-pulse shadow-none'
              : 'animated-btn-gradient text-white'
              }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span></span>
              </>
            ) : (
              <>
                <Search className="w-2.5 h-2.5 text-white" />
                <span className="animate-text-glow">Scan</span>
              </>
            )}
          </Button>
        </div>
      );
      case 'arranger': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.arranger || 'Anagha KM'}</span>;
      case 'primaryTmu': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.primaryTmu || 'Tmu1'}</span>;
      case 'primaryFo': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.primaryFo || 'Pratheesh K P'}</span>;
      case 'chiefComplaint': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.chiefComplaint || 'N/A'}</span>;
      case 'purposeOfVisit': return (
        <div className="flex-1 flex flex-wrap items-center gap-x-2">
          <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">
            {patient.purposeOfVisit || 'N/A'}
          </span>
          {patient.duration && (
            <span className="text-[0.94rem] font-medium text-[#e65100] font-['Inter'] bg-[#fff3e0] px-1.5 rounded-sm">
              {patient.duration}
            </span>
          )}
        </div>
      );
      case 'urgentConcerns': return (
        <span className="text-[0.94rem] font-bold text-red-600 font-['Inter']">
          {patient.urgentConcerns && patient.urgentConcerns !== 'undefined' && patient.urgentConcerns !== 'None identified' ? patient.urgentConcerns : 'None'}
        </span>
      );
      case 'symptoms': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.symptoms || 'N/A'}</span>;
      case 'medicalHistory': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.medicalHistory || 'N/A'}</span>;
      case 'allergy': return (
        <div className="flex flex-wrap gap-1.5">
          {allergyItems.length > 0 ? allergyItems.map((item, idx) => (
            <span key={idx} className="border border-[#d6d8e3] rounded-[7px] px-3 py-0.5 text-[0.875rem] font-medium text-[#161616] font-['Inter'] bg-[#f8f9fc]">
              {item}
            </span>
          )) : (
            <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">None</span>
          )}
        </div>
      );
      case 'medication': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.currentMedication && patient.currentMedication !== 'undefined' ? patient.currentMedication : 'N/A'}</span>;
      case 'familySocialHistory': return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{patient.familySocialHistory && patient.familySocialHistory !== 'undefined' ? patient.familySocialHistory : 'N/A'}</span>;
      case 'comorbidity': return (
        <div className="flex flex-wrap gap-1.5">
          {comorbidityItems.length > 0 ? comorbidityItems.map((item, idx) => (
            <span key={idx} className="border border-[#d6d8e3] rounded-[7px] px-3 py-0.5 text-[0.875rem] font-medium text-[#161616] font-['Inter'] bg-[#f8f9fc]">
              {item}
            </span>
          )) : (
            <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">None</span>
          )}
        </div>
      );
      default:
        const savedValue = parsedCustomCategories.find(c =>
          (c.field && c.field.trim().toLowerCase() === field.trim().toLowerCase()) ||
          (c.name && category.name && c.name.trim().toLowerCase() === category.name.trim().toLowerCase())
        )?.value;
        return <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter']">{savedValue || 'N/A'}</span>;
    }
  };

  return (
    <div className="bg-white rounded-[20px] overflow-hidden fade-in border border-[#e0e3f5] p-3 pb-3">
      <div className="space-y-0">
        {/* Deal Info Header */}
        <div className="bg-[#fbfcfd] rounded-t-[20px] p-6 border-b border-[#e0e3f5] text-left">
          {/* Deal Name - Full Width */}
          <div className="mb-5">
            <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Deal Name</div>
            <h2 className="text-[22px] font-extrabold text-slate-800 mt-0.5 leading-tight font-['Inter']">
              {patient.dealName || `${patient.firstName} ${patient.surName}`}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Column 1: Deal ID & Status */}
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Deal Id</div>
                <div className="text-[15px] font-bold text-slate-800 mt-1.5 font-['Inter']">
                  {patient.dealId || `#AG${patient.consultationId}`}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block" />
                  <span className="text-[15px] font-bold text-slate-800">
                    {patient.dealStatus || "Pre Financial Close"}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Created on, Type */}
            <div className="space-y-4">
              <div>
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Created on</div>
                <div className="text-[15px] font-medium text-slate-700 mt-0.5">
                  {patient.dealCreatedOn || "15 May 2026 10:02"}
                </div>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Type</div>
                <div className="text-[15px] font-medium text-slate-700 mt-0.5">
                  {patient.dealType || "3rd Party Mandate"}
                </div>
              </div>
            </div>

            {/* Column 3: Last Updated and Action Buttons */}
            <div className="space-y-4 flex flex-col justify-between items-start md:items-end">
              <div className="w-full text-left md:text-right">
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Last Updated</div>
                <div className="text-[15px] font-medium text-slate-700 mt-0.5">
                  {patient.dealLastUpdated || "15 May 2026 10:02"}
                </div>
              </div>
              <div className="w-full flex flex-col items-start md:items-end gap-3">
                {!isInpatient && (
                  <div className="mt-2 flex flex-wrap gap-2 justify-start md:justify-end">
                    <Button variant="outline" onClick={onViewAIInterpretations} className="flex items-center gap-2 h-8 rounded-lg text-[0.94rem] font-medium font-['Inter'] whitespace-nowrap">
                      <BrainCircuit className="w-4 h-4" />
                      AI Findings
                    </Button>
                    {onViewReport && (
                      <Button variant="outline" onClick={onViewReport} className="flex items-center gap-2 h-8 rounded-lg text-[0.94rem] font-medium font-['Inter'] whitespace-nowrap">
                        <FileText className="w-4 h-4" />
                        Report
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs / Body */}
        <div className="p-6">
          <div className="border border-[#e0e3f5] rounded-xl overflow-hidden shadow-sm">
            <div className="bg-[#edf2f9]/50 px-4 py-3 border-b border-[#e0e3f5] flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
                DEAL PARTICIPANTS
              </span>
              {!isInpatient && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleOpenEditConsultationModal} className="h-8 px-4 rounded-[10px] text-[13px] font-semibold shadow-sm transition-all active:scale-95">
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              )}
            </div>

            <div className="divide-y divide-[#e0e3f5]">
              {displayCategories.map((category, index) => {
                const getBankingCategoryName = (field: string, originalName: string) => {
                  switch (field) {
                    case 'lenders': return 'Lenders';
                    case 'borrower': return 'Borrowers';
                    case 'arranger': return 'Arranger';
                    case 'primaryTmu': return 'TMU';
                    case 'primaryFo': return 'FO';
                    case 'chiefComplaint': return 'Business Description';
                    case 'purposeOfVisit': return 'Transaction Rationale';
                    case 'urgentConcerns': return 'Critical Deal Risks';
                    case 'symptoms': return 'Transaction Background';
                    case 'medicalHistory': return 'Client History & Background';
                    case 'allergy': return 'Risk Mitigation & Covenants';
                    case 'medication': return 'Key Terms / Facility Covenants';
                    case 'familySocialHistory': return 'Shareholder & Group Structure';
                    case 'comorbidity': return 'Regulatory & Environmental Approvals';
                    default: return originalName || field;
                  }
                };

                return (
                  <div key={category.field + index} className="flex flex-col sm:flex-row sm:items-center min-h-[44px] bg-white group hover:bg-[#fcfdfe] transition-colors">
                    <div className="bg-[#edf2f9] w-full sm:w-[250px] flex items-center gap-2 px-3 py-2 sm:py-0 sm:self-stretch flex-shrink-0">
                      {getCategoryIcon(category.field)}
                      <span className="text-[0.94rem] font-medium text-[#161616] font-['Inter'] capitalize">
                        {getBankingCategoryName(category.field, category.name)}
                      </span>
                    </div>
                    <div className="flex-1 px-4 py-2 sm:py-1 flex items-center justify-between gap-2 border-t sm:border-t-0 border-[#e0e3f5]/50">
                      {renderCategoryValue(category)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#e0e3f5]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-semibold text-[#1a2256]">
                  Edit Deal Covenants & Regulatory Info
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-5 bg-white">
              <div className="space-y-2 text-left">
                <Label htmlFor="allergy" className="text-[#1a2256] font-bold text-[13px] ml-1 uppercase">RISK MITIGATION & COVENANTS</Label>
                <Textarea
                  id="allergy"
                  value={editAllergy}
                  onChange={(e) => setEditAllergy(e.target.value)}
                  placeholder="Enter risk mitigation parameters and covenants"
                  className="resize-none rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
                  rows={2}
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="comorbidity" className="text-[#1a2256] font-bold text-[13px] ml-1 uppercase">REGULATORY & ENVIRONMENTAL APPROVALS</Label>
                <Textarea
                  id="comorbidity"
                  value={editComorbidity}
                  onChange={(e) => setEditComorbidity(e.target.value)}
                  placeholder="Enter regulatory approvals and considerations"
                  className="resize-none rounded-[12px] border-[#e0e3f5] bg-[#fcfdfe] focus:bg-white transition-all text-[15px] font-medium"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="p-6 bg-[#fbfcfd] border-t border-[#f0f3f9] gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="rounded-[12px] h-11 px-6 font-bold">
                Cancel
              </Button>
              <Button variant="outline" onClick={handleSaveAllergiesComorbidities} disabled={isSaving} className="rounded-[12px] h-11 px-8 font-bold shadow-sm transition-all active:scale-[0.98]">
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Consultation Modal */}
        <Dialog open={isEditConsultationModalOpen} onOpenChange={setIsEditConsultationModalOpen}>
          <DialogContent className="max-w-5xl rounded-[24px] border-[#e0e3f5] p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-[#e0e3f5]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-semibold text-[#1a2256]">
                  Edit Deal Details & Terms
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="p-6 bg-[#fcfcfd] h-[75vh] flex flex-col overflow-hidden">
              <Tabs defaultValue="current-visit" className="w-full flex flex-col flex-1 overflow-hidden">
                <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-6 border-b border-[#e0e3f5] rounded-none mb-6 shrink-0">
                  <TabsTrigger value="current-visit" className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent">
                    Transaction Context
                  </TabsTrigger>
                  <TabsTrigger value="medical-background" className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent">
                    Client Context
                  </TabsTrigger>
                  <TabsTrigger value="medications-allergies" className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent">
                    Terms & Risk Mitigation
                  </TabsTrigger>
                  {editCustomCategories.length > 0 && (
                    <TabsTrigger value="custom-categories" className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground data-[state=active]:border-[#64549f] data-[state=active]:text-[#64549f] data-[state=active]:shadow-none data-[state=active]:bg-transparent">
                      Custom Category
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="flex-1 overflow-y-auto medical-scroll pr-2 -mr-2 pb-4 text-left">
                  <TabsContent value="current-visit" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label className={editFormLabelClass}>Business Description</Label>
                      <Textarea
                        value={editChiefComplaint}
                        onChange={(e) => setEditChiefComplaint(e.target.value)}
                        className={editFormTextareaClass}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={editFormLabelClass}>Transaction Background</Label>
                      <Textarea
                        value={editSymptoms}
                        onChange={(e) => setEditSymptoms(e.target.value)}
                        className={editFormTextareaClass}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div className="space-y-2 flex flex-col">
                        <Label className={editFormLabelClass}>Deal Timeline / Term</Label>
                        <Textarea
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                          placeholder="e.g. 5 years"
                          className={`${editFormTextareaClass} min-h-[88px]`}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2 flex flex-col">
                        <Label className={editFormLabelClass}>Critical Deal Risks</Label>
                        <Textarea
                          value={editUrgentConcerns}
                          onChange={(e) => setEditUrgentConcerns(e.target.value)}
                          className={`${editFormTextareaClass} min-h-[88px]`}
                          rows={2}
                        />
                      </div>
                    </div>
                    {!isInpatient && (
                      <div className="space-y-2">
                        <Label className={editFormLabelClass}>Transaction Rationale</Label>
                        <Textarea
                          value={editPurposeOfVisit}
                          onChange={(e) => setEditPurposeOfVisit(e.target.value)}
                          className={editFormTextareaClass}
                          rows={2}
                        />
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="medical-background" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label className={editFormLabelClass}>Client History & Background</Label>
                      <Textarea
                        value={editMedicalHistory}
                        onChange={(e) => setEditMedicalHistory(e.target.value)}
                        className={editFormTextareaClass}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={editFormLabelClass}>Shareholder & Group Structure</Label>
                      <Textarea
                        value={editFamilySocialHistory}
                        onChange={(e) => setEditFamilySocialHistory(e.target.value)}
                        className={editFormTextareaClass}
                        rows={4}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="medications-allergies" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label className={editFormLabelClass}>Key Terms / Facility Covenants</Label>
                      <Textarea
                        value={editCurrentMedication}
                        onChange={(e) => setEditCurrentMedication(e.target.value)}
                        className={editFormTextareaClass}
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-allergies" className={editFormLabelClass}>Risk Mitigation & Covenants</Label>
                      <Textarea
                        id="edit-allergies"
                        value={editAllergy}
                        onChange={(e) => setEditAllergy(e.target.value)}
                        placeholder="Enter covenants"
                        className={editFormTextareaClass}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-comorbidity" className={editFormLabelClass}>Regulatory & Environmental Approvals</Label>
                      <Textarea
                        id="edit-comorbidity"
                        value={editComorbidity}
                        onChange={(e) => setEditComorbidity(e.target.value)}
                        placeholder="Enter approvals"
                        className={editFormTextareaClass}
                        rows={2}
                      />
                    </div>
                  </TabsContent>

                  {editCustomCategories.length > 0 && (
                    <TabsContent value="custom-categories" className="space-y-4 mt-0">
                      {editCustomCategories.map((cat, idx) => (
                        <div key={cat.field || idx} className="space-y-2">
                          <Label className={editFormLabelClass}>{cat.name}</Label>
                          <Textarea
                            value={cat.value}
                            onChange={(e) => setEditCustomCategories(prev => prev.map((c, i) => i === idx ? { ...c, value: e.target.value } : c))}
                            className={editFormTextareaClass}
                            rows={4}
                          />
                        </div>
                      ))}
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </div>

            <DialogFooter className="p-6 bg-[#fbfcfd] border-t border-[#f0f3f9] gap-3">
              <Button variant="outline" onClick={() => setIsEditConsultationModalOpen(false)} disabled={isSavingConsultation} className="rounded-[12px] h-11 px-6 font-bold">
                Cancel
              </Button>
              <Button onClick={handleSaveConsultationInformation} disabled={isSavingConsultation} className="rounded-[12px] h-10 px-6 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white flex items-center gap-2">
                {isSavingConsultation ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
