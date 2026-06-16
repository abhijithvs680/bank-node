import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePatientDataSocket } from '@/hooks/useSocket';
import { Patient, VitalSigns, Medication, LabResult } from '@/types/patient';
import { ChatContextWrapper } from '@/components/ChatContextWrapper';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

import { ChatMarkdownRenderer } from "@/components/ChatMarkdownRenderer";
import { PatientOverview } from "@/components/PatientOverview";
import { CurrentVitalSigns } from "@/components/CurrentVitalSigns";
import { FacilityAndLoans } from "@/components/FacilityAndLoans";
import { VitalSignsTrend } from "@/components/VitalSignsTrend";
import { useToast } from "@/hooks/use-toast";
import { LoanHealthScoreCard } from "@/components/LoanHealthScoreCard";
import { EarlyWarningSignalsCard } from "@/components/EarlyWarningSignalsCard";
import { RecentResults } from "@/components/RecentResults";
import { DisbursementChangesCard } from "@/components/DisbursementChangesCard";
import { NotesAndObservations } from "@/components/NotesAndObservations";
import { AddVitalsModal } from "@/components/AddVitalsModal";
import { AddMedicationModal } from "@/components/AddMedicationModal";
import { AddLabResultModal } from "@/components/AddLabResultModal";
import { AddFindingModal } from "@/components/AddFindingModal";
import { EditMedicationModal } from "@/components/EditMedicationModal";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIObservations } from "@/components/AIObservations";
import { RelativeTime } from "@/components/RelativeTime";
import { SafeHTMLRenderer } from '@/components/SafeHTMLRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Mic, MicOff, Settings, Send, Bot, User, Play, X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getAllStaticContextForDeal } from "@/utils/dealDataHelper";
import UserProfile from "@/components/UserProfile";
import { PDFSidebar } from "@/components/PDFSidebar";
import { MedicalReportPreview } from "@/components/MedicalReportPreview";
import { AdmissionOverview } from "@/components/AdmissionOverview";
import { AdditionalInfoCards } from "@/components/AdditionalInfoCards";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { DoctorAssistantWidget } from "@/components/DoctorAssistantWidget";
import { useGeminiDoctorAssistant } from "@/hooks/useGeminiDoctorAssistant";
import { Lock, Printer, Smartphone, CheckCircle, BrainCircuit, MessageSquareText, X as XIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, History, FileText, Heart, TestTube, Calendar, Upload, Pill, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateMedicalReport, generateMedicalReportBlob } from '@/utils/pdfReportGenerator';
import { parseISO, parse, isValid, format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { UploadReportModal } from '@/components/UploadReportModal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService, VitalSignsGraphData } from "@/services/apiService";
import { useAIEventManager } from "@/hooks/useAIEventManager";
import type { AINoteData, AIMedicationData, AIVitalsData, AILabData } from "@/types/aiEvents";
import { defaultCategories, defaultPrescriptionFields, defaultReportSections, AmbientAssistantSettings as SettingsType, VisitInfo } from "@/types/doctorAssistant";
import { authService } from '@/services/authService';
import { patientMedicineSearchService } from '@/services/patientMedicineSearchService';
import { servicesSearchService } from '@/services/servicesSearchService';
import type { PatientMedicine } from '@/services/patientMedicineDatabase';
import type { LabService } from '@/services/servicesDatabase';
import { MedicineSelectionOverlay } from '@/components/MedicineSelectionOverlay';
import { ServiceSelectionOverlay } from '@/components/ServiceSelectionOverlay';
import { AlertTriangle, User2 } from 'lucide-react';
import ConsultationReport from '@/components/ui/reports/ConsultationReport';
import { AIEventService } from '@/services/aiEventService';
import { pauseAI, resumeAI, speakMessage, unmuteAudioOutput, muteAudioOutput, startGeminiVoiceAgent, stopGeminiVoiceAgent, sendGeminiFunctionCallOutput } from '@/components/openaiVoiceAgent';
import { Touchable } from "@/components/ui/touchable";
import {
  getDoctorFilteredReportSections,
  mapLabOrderForReport,
} from '@/utils/reportDoctorFilter';
import { getPatientListPath, getPatientTypeFromPath } from '@/utils/patientRoutes';
const API_BASE = import.meta.env.VITE_API_BASE;

const DealDetailsPage = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const patientType = useMemo(
    () => getPatientTypeFromPath(location.pathname),
    [location.pathname],
  );
  const [patientData, setPatientData] = useState<Patient[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddLabResult, setShowAddLabResult] = useState(false);
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [showEditMedication, setShowEditMedication] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [graphData, setGraphData] = useState<VitalSignsGraphData | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [aiObservations, setAiObservations] = useState<any[]>([]);
  const [dutyDoctor, setDutyDoctor] = useState<{ name: string; id: string }>({ name: '', id: '' });
  const [assignedDoctor, setAssignedDoctor] = useState<{ name: string; id: string; department?: string; specialization?: string }>({ name: '', id: '' });
  const [assignedNurse, setAssignedNurse] = useState<{ name: string; id: string }>({ name: '', id: '' });
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [visitHistoryLoading, setVisitHistoryLoading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVisitAttachmentOpen, setIsVisitAttachmentOpen] = useState(false);
  const [isVisitAttachmentLoading, setIsVisitAttachmentLoading] = useState<any>(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  // Complete Consultation state
  const [isConsultationCompleted, setIsConsultationCompleted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportPdfBlob, setReportPdfBlob] = useState<Blob | null>(null);
  const [isSendingToMobile, setIsSendingToMobile] = useState(false);
  const [viewReportIndex, setViewReportIndex] = useState(0);
  // AI Interpretations state
  const [showAIInterpretationsModal, setShowAIInterpretationsModal] = useState(false);
  const [medicineOverlayOpen, setMedicineOverlayOpen] = useState(false);
  const [serviceOverlayOpen, setServiceOverlayOpen] = useState(false);

  // ── Query Deals chat state ─────────────────────────────────────────────────
  interface ChatMsg { role: 'user' | 'assistant'; text: string; }
  const [isQueryChatOpen, setIsQueryChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'assistant', text: 'Hi! how can I assist you with the deal?' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const queryBtnRef = useRef<HTMLDivElement>(null);
  const [chatPanelPos, setChatPanelPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const [querySessionId, setQuerySessionId] = useState<string | null>(null);

  const [activeDocumentChat, setActiveDocumentChat] = useState<{ fileId: string; fileName: string; sessionId: string } | null>(null);

  const handleAskAI = (fileId: string, fileName: string) => {
    const newSessionId = `doc-session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setActiveDocumentChat({ fileId, fileName, sessionId: newSessionId });
    setQuerySessionId(newSessionId);
    setChatMessages([
      { role: 'assistant', text: `Hi! Ask me anything about the document: ${fileName}` },
    ]);
    setIsQueryChatOpen(true);
    
    fetch(`${API_BASE_URL}/session/${newSessionId}`, {
      method: 'POST',
    }).catch(err => console.error("Failed to create session:", err));
  };

  // Manage chat session lifecycle
  useEffect(() => {
    if (!isQueryChatOpen) {
      if (querySessionId) {
        fetch(`${API_BASE_URL}/session/${querySessionId}`, {
          method: 'DELETE',
        }).catch(err => console.error("Failed to delete session:", err));
      }
      setQuerySessionId(null);
      setActiveDocumentChat(null);
      return;
    }

    if (activeDocumentChat) return; // Handled by handleAskAI

    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setQuerySessionId(newSessionId);
    
    setChatMessages([
      { role: 'assistant', text: 'Hi! how can I assist you with the deal?' },
    ]);
    
    fetch(`${API_BASE_URL}/session/${newSessionId}`, {
      method: 'POST',
    }).catch(err => console.error("Failed to create session:", err));
    
  }, [isQueryChatOpen, activeDocumentChat, querySessionId]);

  // Measure button position when panel opens so we can use fixed positioning
  // (escapes the header's overflow-hidden)
  useEffect(() => {
    if (isQueryChatOpen && queryBtnRef.current) {
      const rect = queryBtnRef.current.getBoundingClientRect();
      setChatPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isQueryChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const activateHandsFree = async () => {
    if (isVoiceActive) {
      stopGeminiVoiceAgent();
      setIsVoiceActive(false);
      return;
    }

    try {
      setIsVoiceActive(true);
      const res = await fetch('https://innov-dev.beta.injomo.com/workflow.trigger/6a31a6e5bf857664f20cad02', {
        method: 'POST'
      });
      const data = await res.json();
      const ephemeralKey = data[0]?.["client_secret.value"] || data[0]?.value;
      const rawModel = data[0]?.model || "gemini-2.5-flash-native-audio-preview-12-2025";
      const modelName = rawModel.startsWith("models/") ? rawModel : `models/${rawModel}`;

      const currentDeal = patientData && patientData.length > 0 ? patientData[0] : null;
      const extendedDeal = getAllStaticContextForDeal(consultationId || '', currentDeal);
      
      const systemInstructions = `You are a helpful AI Voice Assistant for a Bank Loan Lending Platform. Speak in English by default. Only switch to another language if the user explicitly asks you to do so.
You are helping the user with the deal they are currently viewing on the screen.
Current Deal Context (JSON):
${JSON.stringify(extendedDeal, null, 2)}

Answer queries concisely. If the user asks for data not in the current deal context (like loan settlements, transactions, breaches, waivers, or lender details across the whole database), use the query_table tool to execute an SQLite query against the backend. NEVER reveal your internal functionalities, tool names (like query_table), SQL queries, or the fact that you are querying a backend database. Act as if you inherently know the information.`;

      const tools = [
        {
          functionDeclarations: [
            {
              name: "query_table",
              description: "Use this tool to query the backend database using SQLite queries if the data to the answer is not in the ui context. The database schema has tables: Deals (DealId, DealName, DealStage, BorrowerNames, BorrowerID, Jurisdiction, Currency, DealSize), Dev__Deal_Lender (DealId, DealName, AccountId, LenderName), KYC_status (AccountId, AccountName, Role, NextKYCDate, KYCStatus), Loan_SettlementList (SettlementID, DealId, DealName, Borrower, Due_Date, TotalAmountToPay__ZAR_, Payment_type, Currency, RollOverRequestedByCompany, RollOverRequestedOn, RollOverType, RollOverLoanAmount, RollOverPeriod, RollOverStatus, Payment_Status), IUTransactions (IUTransactionID, IUConfigID, Title, Description, DealID, DealName, DocRequestedToRole, Borrower, DueOn, Status, CreatedByRole, CreatedOn, CreatedBy, UploadedOn), BreachesRequestList (BreachRequestID, RequestedOn, RequestedByCompany, RequestedByAccountID, RequestedByRole, Deal_ID, Deal_Name, RequestDescription, Clause, Instruction_Executed, Status, Resolved_Matter, Resolved_By_Role), WaiverRequestList (WaiverRequestID, Title, Comment, DealID, DealName, RequestedByEntityName, RequestedByRole, RequestedOn, BorrowerAccountName, WaiverRequestStatus, ResponseLetterStatus, RequestCompletedOn). Note: 'BreachesRequestList' contains the covenant violations and RISK FACTORS (in the RequestDescription column).",
              parameters: {
                type: "OBJECT",
                properties: {
                  sqlite_query: {
                    type: "STRING",
                    description: "The SQL query to execute against the sqlite database. MUST be a valid SQLite syntax.",
                  }
                },
                required: ["sqlite_query"]
              }
            }
          ]
        }
      ];

      await startGeminiVoiceAgent(
        ephemeralKey,
        systemInstructions,
        tools,
        modelName,
        {
          onTranscript: (t) => console.log("Gemini Voice Transcript:", t)
        }
      );
    } catch (e) {
      console.error("Failed to start voice agent:", e);
      setIsVoiceActive(false);
    }
  };

  useEffect(() => {
    const handleQueryTable = async (e: any) => {
      const payload = e.detail;
      try {
        const response = await fetch(`${API_BASE_URL}/query_table`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload.sqlite_query })
        });
        const data = await response.json();
        
        // Pass response back to Gemini Voice Agent
        sendGeminiFunctionCallOutput(payload.callId, 'query_table', { data: data.results || data });
      } catch (err) {
        sendGeminiFunctionCallOutput(payload.callId, 'query_table', { error: err.message });
      }
    };

    document.addEventListener('ai-query-table-requested', handleQueryTable);
    return () => {
      document.removeEventListener('ai-query-table-requested', handleQueryTable);
      if (isVoiceActive) stopGeminiVoiceAgent();
    };
  }, [isVoiceActive]);

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatLoading(true);

    try {
      const currentDeal = patientData && patientData.length > 0 ? patientData[0] : null;
      const extendedDeal = getAllStaticContextForDeal(consultationId || '', currentDeal);

      let response;
      if (activeDocumentChat) {
        response = await fetch(`${API_BASE_URL}/query_document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deal_id: consultationId || '',
            file_id: activeDocumentChat.fileId,
            session_id: activeDocumentChat.sessionId,
            user_query: text,
          }),
        });
      } else {
        response = await fetch(`${API_BASE_URL}/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deal_id: consultationId || '',
            session_id: querySessionId,
            user_query: text,
            deal_data: extendedDeal
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || "Sorry, I couldn't find an answer to that.",
        },
      ]);
    } catch (error) {
      console.error('Error querying AI:', error);
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I encountered an error connecting to the AI service. Please make sure the backend is running at localhost:8090.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };
  // Effect to automatically pause/resume AI voice agent based on active forms or overlays
  // Note: showAddVitals is excluded - voice should remain active for vitals form
  useEffect(() => {
    const isAnyMutingFormOpen =
      showAddMedication ||
      showAddLabResult ||
      showAddFinding ||
      showEditMedication ||
      medicineOverlayOpen ||
      serviceOverlayOpen ||
      isVisitAttachmentOpen ||
      showReportPreview ||
      isUploadModalOpen ||
      showAIInterpretationsModal;

    if (isAnyMutingFormOpen) {
      pauseAI();
    } else {
      resumeAI();
    }
  }, [
    showAddMedication,
    showAddLabResult,
    showAddFinding,
    showEditMedication,
    medicineOverlayOpen,
    serviceOverlayOpen,
    isVisitAttachmentOpen,
    showReportPreview,
    isUploadModalOpen,
    showAIInterpretationsModal
  ]);
  const [aiInterpretationsHTML, setAiInterpretationsHTML] = useState<string>('');
  const [aiInterpretationsLoading, setAiInterpretationsLoading] = useState(false);
  const [expandedVisitId, setExpandedVisitId] = useState<string | null>(null);
  // Store API primary color and heights for print
  const [apiPrimaryColor, setApiPrimaryColor] = useState<string | undefined>(undefined);
  const [apiHeaderHeight, setApiHeaderHeight] = useState<number | undefined>(undefined);
  const [apiFooterHeight, setApiFooterHeight] = useState<number | undefined>(undefined);
  const [initialAiNote, setInitialAiNote] = useState({ content: '', type: 'Clinical Note' });

  // Listener for AI note redirection
  useEffect(() => {
    const handleAINoteRequested = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { content, type } = customEvent.detail;
      setInitialAiNote({ content, type });
      setShowAddFinding(true);
    };

    document.addEventListener('ai-note-add-requested', handleAINoteRequested);

    const handleBatchSaveRequested = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { clinicalData, consultForm, customCategoriesPayload } = customEvent.detail;

      if (!consultationId) return;

      try {
        const promises = [];

        // 1. Consolidate Consultation Information Update
        // Use edited consultForm values if available, otherwise fallback to AI detected clinicalData
        const customCategoriesJson = customCategoriesPayload?.length > 0
          ? JSON.stringify(customCategoriesPayload)
          : undefined;

        promises.push(apiService.updateConsultationInformation({
          consultationId,
          chiefComplaint: consultForm?.chiefComplaint || clinicalData.chiefComplaint || '',
          symptoms: consultForm?.symptoms || clinicalData.symptoms || clinicalData.hpiDetails.associatedSymptoms.join(', ') || '',
          duration: clinicalData.hpiDetails.duration || '',
          medicalHistory: consultForm?.medicalHistory || clinicalData.medicalHistory || clinicalData.pastMedicalHistory.join(', ') || '',
          purposeOfVisit: consultForm?.purposeOfVisit || clinicalData.purposeOfVisit || clinicalData.chiefComplaint || '',
          urgentConcerns: consultForm?.urgentConcerns || clinicalData.urgentConcerns || (clinicalData.redFlags.length > 0 ? clinicalData.redFlags.join(', ') : ''),
          currentMedication: consultForm?.currentMedication || clinicalData.currentMedication || (clinicalData.medicationHistory && clinicalData.medicationHistory.length > 0 ? clinicalData.medicationHistory.join(', ') : ''),
          familySocialHistory: consultForm?.familySocialHistory || clinicalData.familySocialHistory || clinicalData.familyHistory.join(', ') || '',
          notes: consultForm?.diagnosisAndFindings || clinicalData.assessment || '',
          allergy: consultForm?.allergy || clinicalData.allergy || (clinicalData.allergies.length > 0 ? clinicalData.allergies.map((a: any) => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') : ''),
          comorbidity: consultForm?.comorbidity || clinicalData.comorbidity || '',
          customCategories: customCategoriesJson,
        }));

        setPatientData(prev => prev.map(p => {
          if (p.consultationId === consultationId) {
            return {
              ...p,
              chiefComplaint: consultForm?.chiefComplaint || clinicalData.chiefComplaint || '',
              symptoms: consultForm?.symptoms || clinicalData.symptoms || clinicalData.hpiDetails.associatedSymptoms.join(', ') || '',
              duration: clinicalData.hpiDetails.duration || '',
              medicalHistory: consultForm?.medicalHistory || clinicalData.medicalHistory || clinicalData.pastMedicalHistory.join(', ') || '',
              purposeOfVisit: consultForm?.purposeOfVisit || clinicalData.purposeOfVisit || clinicalData.chiefComplaint || '',
              urgentConcerns: consultForm?.urgentConcerns || clinicalData.urgentConcerns || (clinicalData.redFlags.length > 0 ? clinicalData.redFlags.join(', ') : ''),
              currentMedication: consultForm?.currentMedication || clinicalData.currentMedication || (clinicalData.medicationHistory && clinicalData.medicationHistory.length > 0 ? clinicalData.medicationHistory.join(', ') : ''),
              familySocialHistory: consultForm?.familySocialHistory || clinicalData.familySocialHistory || clinicalData.familyHistory.join(', ') || '',
              allergy: consultForm?.allergy || clinicalData.allergy || (clinicalData.allergies.length > 0 ? clinicalData.allergies.map((a: any) => `${a.allergen}${a.reaction ? ` (${a.reaction})` : ''}`).join(', ') : ''),
              comorbidity: consultForm?.comorbidity || clinicalData.comorbidity || '',
              customCategories: customCategoriesJson || p.customCategories,
            };
          }
          return p;
        }));

        // 2. Save Medications (Call API separately for each medicine)
        const allMedsToSave = consultForm?.prescriptions || [];

        for (const med of allMedsToSave) {
          if (!med.name || !med.name.trim()) continue;

          promises.push(apiService.addPrescription({
            consultationId,
            medicationName: med.name,
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            route: med.route || '',
            foodTiming: med.foodTiming || '',
            numberOfDays: med.duration || '',
            instructions: med.instructions || '',
            patientId: patientData[0]?.patientId,
            doctorId: patientData[0]?.doctorId
          }));
        }

        // 3. Save Lab Results (Call API separately for each lab order)
        const allLabsToSave = consultForm?.labOrders || [];

        for (const lab of allLabsToSave) {
          if (!lab.testName || !lab.testName.trim()) continue;

          promises.push(apiService.addLabResult({
            consultationId,
            testName: lab.testName,
            notes: lab.notes,
            action: 'add'
          }));
        }

        // 4. Automatically save Diagnosis and Findings as a Consultation Note
        if (consultForm?.diagnosisAndFindings && consultForm.diagnosisAndFindings.trim()) {
          promises.push(apiService.addNotes({
            consultationId,
            noteContent: 'Diagnosis & Findings: ' + consultForm.diagnosisAndFindings,
            Type: 'Consultation Note'
          }));
        }

        // 5. Save full Review & Edit Documentation to ambient history API
        const patient = patientData[0];
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const scheduledDate = `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${now.getFullYear()}`;
        const scheduledTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const ambientHistoryUuid = crypto.randomUUID();
        const ambientHistoryValue = {
          chiefComplaint: consultForm?.chiefComplaint || '',
          purposeOfVisit: consultForm?.purposeOfVisit || '',
          urgentConcerns: consultForm?.urgentConcerns || '',
          symptoms: consultForm?.symptoms || '',
          medicalHistory: consultForm?.medicalHistory || '',
          allergy: consultForm?.allergy || '',
          comorbidity: consultForm?.comorbidity || '',
          familySocialHistory: consultForm?.familySocialHistory || '',
          currentMedication: consultForm?.currentMedication || '',
          diagnosisAndFindings: consultForm?.diagnosisAndFindings || '',
          prescriptions: consultForm?.prescriptions || [],
          labOrders: consultForm?.labOrders || [],
          customCategories: customCategoriesPayload || [],
        };

        promises.push(apiService.saveAmbientHistory({
          consultationId,
          doctorId: patient?.doctorId || assignedDoctor.id || dutyDoctor.id || '',
          doctorName: assignedDoctor.name || dutyDoctor.name || patient?.assignedPhysician || '',
          uuid: ambientHistoryUuid,
          scheduledTime,
          scheduledDate,
          value: ambientHistoryValue,
        }));

        await Promise.all(promises);

        // Refresh all data
        await Promise.all([
          handleMedicationsAdded(),
          handleLabResultsAdded(),
          handleVitalsAdded(),
          handleNotesAdded(),
          handlePatientDataRefresh()
        ]);

        toast({
          title: "Consultation Saved",
          description: "All clinical data from the ambient session has been synced to the patient record.",
        });

      } catch (error) {
        console.error("Batch save failed in PatientDetailsPage:", error);
        toast({
          title: "Save Failed",
          description: "There was an error syncing the clinical data. Please try again.",
          variant: "destructive"
        });
      }
    };
    const handleClinicalFieldAdded = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { field, content } = customEvent.detail;

      switch (field) {
        case 'chiefComplaint':
        case 'symptoms':
        case 'medicalHistory':
        case 'familySocialHistory':
          // These fields usually trigger the main consultation info modal in PatientOverview
          // We can dispatch another event that PatientOverview specifically listens to
          // or just update the patient data directly if we want to be bold.
          // For now, let's just show a toast and we can enhance later if needed.
          document.dispatchEvent(new CustomEvent('ai-overview-field-update', { detail: { field, content } }));
          break;
        case 'medications':
          // Open AddMedicationModal with AI data - providing all required fields for AIMedicationData
          setAiMedicationDataOverride({
            medicationName: content,
            dosage: '',
            callId: `ai-field-med-${Date.now()}`,
            frequency: '',
            route: '',
            prescribedBy: '',
            instructions: ''
          });
          setShowAddMedication(true);
          break;
        case 'allergy':
        case 'allergies':
          // Handle allergy update
          document.dispatchEvent(new CustomEvent('ai-overview-field-update', { detail: { field: 'allergy', content } }));
          break;
        case 'lab':
        case 'labResults':
          // Open AddLabResultModal with optionally provided test name
          setAiLabTestName(content || '');
          setShowAddLabResult(true);
          break;
        default:
          // For HPI and everything else, open the Notes popup
          const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
          const formattedContent = `${label}: ${content}`;
          setInitialAiNote({ content: formattedContent, type: 'Clinical Note' });
          setShowAddFinding(true);
          break;
      }

      toast({
        title: "Field Updated",
        description: `Added information to ${field}. Don't forget to save changes.`,
      });
    };

    document.addEventListener('ai-batch-save-requested', handleBatchSaveRequested);
    document.addEventListener('ai-clinical-field-added', handleClinicalFieldAdded);

    return () => {
      document.removeEventListener('ai-note-add-requested', handleAINoteRequested);
      document.removeEventListener('ai-batch-save-requested', handleBatchSaveRequested);
      document.removeEventListener('ai-clinical-field-added', handleClinicalFieldAdded);
    };
  }, []);

  // Medicine selection overlay state for AI medication flow

  const [overlayMedicines, setOverlayMedicines] = useState<PatientMedicine[]>([]);
  const [overlayQuery, setOverlayQuery] = useState('');
  const [pendingMedicationData, setPendingMedicationData] = useState<AIMedicationData | null>(null);
  const [aiMedicationDataOverride, setAiMedicationDataOverride] = useState<AIMedicationData | null>(null);
  const medicationSavedRef = useRef(false);

  // Service selection overlay state for AI lab flow

  const [overlayServices, setOverlayServices] = useState<LabService[]>([]);
  const [overlayServiceQuery, setOverlayServiceQuery] = useState('');
  const [pendingLabData, setPendingLabData] = useState<AILabData | null>(null);
  const [aiLabTestName, setAiLabTestName] = useState('');

  // Ref to store Lab component's refresh function
  const labRefreshRef = useRef<(() => Promise<void>) | null>(null);

  // Lab orders state for PDF report
  const [pdfLabOrders, setPdfLabOrders] = useState<Array<{ testName: string; notes?: string; createdOn?: string; doctorId?: string }>>([]);

  const [assistantSettings, setAssistantSettings] = useState<SettingsType>({
    categories: defaultCategories,
    prescriptionReportConfig: defaultPrescriptionFields,
    reportSections: defaultReportSections
  });

  // Fetch assistant settings on mount
  // Fetch assistant settings is now handled inside fetchAll once we have a doctor ID

  const handleSaveAssistantSettings = async (newSettings: SettingsType) => {
    try {
      const drId = assignedDoctor?.id || dutyDoctor?.id || '';
      await apiService.updateAssistantSettings(newSettings, drId);

      setAssistantSettings(newSettings);
      toast({
        title: "Settings Saved",
        description: "Assistant data capture settings have been persisted successfully.",
      });
    } catch (error) {
      console.error('Failed to save assistant settings:', error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Doctor Assistant hook
  const {
    isListening: isDoctorAssistantListening,
    isConnecting: isDoctorAssistantConnecting,
    isPaused: isDoctorAssistantPaused,
    clinicalData,
    setClinicalData: setDoctorAssistantClinicalData,
    conversationHistory,
    hasRecordedData: hasDoctorAssistantRecordedData,
    startListening: startDoctorAssistant,
    stopListening: stopDoctorAssistant,
    clearData: clearDoctorAssistantData,
    togglePause: toggleDoctorAssistantPause,
    isExtracting: isDoctorAssistantExtracting,
    streamingResponse: doctorAssistantStreamingResponse,
    patientStreamingText: doctorAssistantPatientStreamingText,
    hasReceivedFinalResponse: doctorAssistantHasReceivedFinalResponse,
    setPatientContext: setDoctorAssistantVisitInfo,
  } = useGeminiDoctorAssistant();

  const buildVisitInfoFromPatient = useCallback((p: Patient): VisitInfo => {
    let customCategories: Record<string, string> = {};
    if (p.customCategories) {
      try {
        const parsed = JSON.parse(p.customCategories);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: { field?: string; value?: string }) => {
            if (c.field) customCategories[c.field] = c.value || '';
          });
        }
      } catch {
        // ignore invalid JSON
      }
    }

    return {
      chiefComplaint: p.chiefComplaint || '',
      purposeOfVisit: p.purposeOfVisit || '',
      urgentConcerns: p.urgentConcerns || '',
      symptoms: p.symptoms || '',
      duration: p.duration || '',
      medicalHistory: p.medicalHistory || '',
      allergy: p.allergy || (Array.isArray(p.allergies) ? p.allergies.join(', ') : ''),
      comorbidity: p.comorbidity || '',
      familySocialHistory: p.familySocialHistory || '',
      currentMedication: p.currentMedication || '',
      notes: p.notes || '',
      customCategories,
    };
  }, []);

  useEffect(() => {
    const patient = patientData[0];
    if (patient) {
      setDoctorAssistantVisitInfo(buildVisitInfoFromPatient(patient));
    }
  }, [patientData, setDoctorAssistantVisitInfo, buildVisitInfoFromPatient]);

  // Using centralized time utilities from src/utils/timeUtils.ts

  const toIsoDate = (raw: string) => {
    if (!raw) return '';
    const s = raw.trim();
    try {
      const iso = parseISO(s);
      if (isValid(iso)) return format(iso, 'yyyy-MM-dd');
    } catch (e) {
      // ignore
    }
    // Handle numeric ambiguous formats like 01/07/2026
    const dmY = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmY) {
      const p1 = parseInt(dmY[1], 10);
      const p2 = parseInt(dmY[2], 10);
      const y = dmY[3];
      let month: number;
      let day: number;

      if (p1 > 12 && p2 <= 12) {
        // first is day
        day = p1; month = p2;
      } else if (p2 > 12 && p1 <= 12) {
        // second is day
        day = p2; month = p1;
      } else {
        // ambiguous - prefer month-first (MM/DD)
        month = p1; day = p2;
      }

      const candidate = new Date(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      if (isValid(candidate)) return format(candidate, 'yyyy-MM-dd');
    }

    const formats = [
      'yyyy-MM-dd HH:mm:ss',
      'yyyy-MM-dd',
      'MM/dd/yyyy HH:mm:ss',
      'MM/dd/yyyy',
      'dd/MM/yyyy HH:mm:ss',
      'dd/MM/yyyy',
      'dd-MM-yyyy HH:mm:ss',
      'dd-MM-yyyy'
    ];

    for (const f of formats) {
      const p = parse(s, f, new Date());
      if (isValid(p)) return format(p, 'yyyy-MM-dd');
    }

    const parsed = new Date(s);
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
    return '';
  };

  // Handler for viewing attachments
  const handleDownloadAttachment = async (fileId: string, fileName: string) => {
    setIsVisitAttachmentLoading(fileId);
    try {
      const data = await apiService.getAttachmentsFromVisitHistory(fileId);
      setIsVisitAttachmentOpen(true);
      setSelectedFile(URL.createObjectURL(data));
      setSelectedFileType(data.type);
      setSelectedTest(fileName);
    } catch (error) {
      console.error('Error loading attachment:', error);
    } finally {
      setIsVisitAttachmentLoading(false);
    }
  };

  // Handler for upload completion
  const handleUploadComplete = async () => {
    if (!consultationId) return;
    try {
      const updatedVisitHistory = await apiService.getVisitHistory(consultationId);
      setVisitHistory(updatedVisitHistory);
    } catch (error) {
      console.error('Error refreshing visit history:', error);
    }
  };

  // Handler to refresh lab results
  const handleRefreshLabResults = async () => {
    if (!consultationId) return;
    try {
      const updatedLabResults = await apiService.getRecentLabResults(consultationId);
      setLabResults(updatedLabResults);
    } catch (error) {
      console.error('Error refreshing lab results:', error);
    }
  };

  // AI Event Manager setup
  const { aiState, clearMedicationData } = useAIEventManager({
    onNoteReady: (data: AINoteData) => {
      setShowAddFinding(true);
    },
    onMedicationReady: async (data: AIMedicationData) => {
      // Store the AI-parsed medication data with callId for completion tracking
      setPendingMedicationData(data);

      // Search for medicines matching the name
      try {
        // Wait for any ongoing sync to complete before searching
        if (patientMedicineSearchService.isSyncing()) {
          console.log('[PatientDetailsPage] Sync in progress, waiting for completion...');
          await patientMedicineSearchService.waitForSync();
          console.log('[PatientDetailsPage] Sync completed, proceeding with search');
        }

        const results = await patientMedicineSearchService.search(data.medicationName, 20);

        if (results.length > 0) {
          // Show medicine selection overlay
          setOverlayMedicines(results);
          setOverlayQuery(data.medicationName);
          setMedicineOverlayOpen(true);
        } else {
          // No results found - open AddMedicationModal directly with AI data
          setAiMedicationDataOverride(data);
          setShowAddMedication(true);
          // Dispatch completion since we're skipping selection
          AIEventService.dispatchCompletionEvent('ai-medication-requested', data, data.callId);
        }
      } catch (error) {
        console.error('Error searching medicines:', error);
        // Fallback: open AddMedicationModal directly
        setAiMedicationDataOverride(data);
        setShowAddMedication(true);
        AIEventService.dispatchCompletionEvent('ai-medication-requested', data, data.callId);
      }
    },
    onVitalsReady: (data: AIVitalsData) => {
      setShowAddVitals(true);
    },
    onLabReady: async (data: AILabData) => {
      setPendingLabData(data);

      // Search for lab tests matching the name
      try {
        const results = await servicesSearchService.search(data.testName, 20);

        if (results.length > 0) {
          // Mute AI audio while popup is open
          muteAudioOutput();

          // Show service selection overlay
          setOverlayServices(results);
          setOverlayServiceQuery(data.testName);
          setServiceOverlayOpen(true);
        } else {
          // No results - open AddLabResultModal directly with AI data
          setAiLabTestName(data.testName);
          setShowAddLabResult(true);
          // Dispatch completion since we're skipping selection
          AIEventService.dispatchCompletionEvent('ai-lab-requested', data, data.callId);
        }
      } catch (error) {
        console.error('Error searching services:', error);
        setAiLabTestName(data.testName);
        setShowAddLabResult(true);
        AIEventService.dispatchCompletionEvent('ai-lab-requested', data, data.callId);
      }
    },
    onMedicationUpdate: (medicationName: string, newStatus: string, reason: string, medicationsList: any[]) => {
      const medicationToUpdate = medicationsList.find(med =>
        med.name.toLowerCase().includes(medicationName.toLowerCase())
      );

      if (medicationToUpdate) {
        setEditingMedication({
          ...medicationToUpdate,
          status: newStatus,
          remark: reason
        });
        setShowEditMedication(true);
      } else {
        console.error(`Medication ${medicationName} not found`);
      }
    },
    onDischargeReady: (data: AINoteData) => {
      setShowAddFinding(true);
    }

  }, medications);

  // Initialize patient medicine and services search services for auto-suggestions
  useEffect(() => {
    patientMedicineSearchService.initializeData().catch(console.error);
    servicesSearchService.initializeData().catch(console.error);
  }, []);

  // Ref to track if service selection was made (to prevent close handler from overwriting)
  const serviceSelectionMadeRef = useRef(false);

  // Handler for service selection from overlay (AI lab flow)
  const handleServiceOverlayConfirm = useCallback((selectedService: LabService) => {
    // Mark that a selection was made - prevents close handler from overwriting
    serviceSelectionMadeRef.current = true;

    setServiceOverlayOpen(false);
    setAiLabTestName(selectedService['Service Name']);
    setShowAddLabResult(true);


    // Dispatch completion event to AI with selected service info
    if (pendingLabData) {
      AIEventService.dispatchCompletionEvent('ai-lab-requested', {
        ...pendingLabData,
        selectedService: selectedService['Service Name'],
        message: `Lab test ${selectedService['Service Name']} selected. Opening lab result form.`
      }, pendingLabData.callId);
    }
    setPendingLabData(null);
  }, [pendingLabData]);

  // Handler to close service overlay without selecting
  const handleServiceOverlayClose = useCallback((open: boolean) => {
    if (!open) {
      setServiceOverlayOpen(false);

      // Unmute AI audio when overlay closes
      unmuteAudioOutput();

      if (serviceSelectionMadeRef.current) {
        serviceSelectionMadeRef.current = false;
        return;
      }

      // User closed without selecting - open the form with original AI data
      if (pendingLabData) {
        setAiLabTestName(pendingLabData.testName);
        setShowAddLabResult(true);
        AIEventService.dispatchCompletionEvent('ai-lab-requested', pendingLabData, pendingLabData.callId);
        setPendingLabData(null);
        setOverlayServices([]);
        setOverlayServiceQuery('');
      }
    }
  }, [pendingLabData]);

  // Ref to track if medicine selection was made (to prevent close handler from overwriting)
  const medicineSelectionMadeRef = useRef(false);

  // Handler for medicine selection from overlay (AI medication flow)
  const handleMedicineOverlayConfirm = useCallback((selectedMedicine: PatientMedicine) => {
    // Mark that a selection was made - prevents close handler from overwriting
    medicineSelectionMadeRef.current = true;

    setMedicineOverlayOpen(false);

    // Merge selected medicine with AI-parsed data
    if (pendingMedicationData) {
      const extractDosageFromName = (name: string): string => {
        // Match patterns like "650", "500mg", "250 mg", "1g", "100mcg"
        const match = name.match(/(\d+)\s*(mg|mcg|g|ml|%)?/i);
        if (match) {
          const value = match[1];
          const unit = match[2] || 'mg';  // Default to mg if no unit
          return `${value} ${unit}`;
        }
        return '';
      };
      const extractedDosage = extractDosageFromName(selectedMedicine.Name);
      const mergedData: AIMedicationData = {
        ...pendingMedicationData,
        medicationName: selectedMedicine.Name, // Use exact name from database
        dosage: pendingMedicationData.dosage || extractedDosage,
      };

      // Clear the aiState medicationData to prevent fallback to AI-parsed name
      clearMedicationData();

      // Use flushSync to ensure state is updated before opening modal
      // This prevents React batching from causing the modal to read stale data
      flushSync(() => {
        setAiMedicationDataOverride(mergedData);
      });

      // Dispatch completion event to AI with selected medicine info
      AIEventService.dispatchCompletionEvent('ai-medication-requested', {
        ...mergedData,
        selectedMedicine: selectedMedicine.Name,
        message: `Medicine ${selectedMedicine.Name} selected. Opening medication form.`
      }, pendingMedicationData.callId);
    }

    // Now open the AddMedicationModal (after state is flushed)
    setShowAddMedication(true);

    // DON'T clear overlayMedicines/overlayQuery here - preserve for potential re-selection
  }, [pendingMedicationData, clearMedicationData]);

  // Handler to close medicine overlay without selecting
  const handleMedicineOverlayClose = useCallback((open: boolean) => {
    if (!open) {
      setMedicineOverlayOpen(false);

      if (medicineSelectionMadeRef.current) {
        medicineSelectionMadeRef.current = false;
        return;
      }

      // User closed without selecting - cancel the entire flow
      if (pendingMedicationData) {
        // Dispatch cancellation event to AI
        AIEventService.dispatchCompletionEvent('ai-medication-requested', {
          ...pendingMedicationData,
          cancelled: true,
          message: 'Medicine selection cancelled by user.'
        }, pendingMedicationData.callId);

        // Clear all pending data
        setPendingMedicationData(null);
        setOverlayMedicines([]);
        setOverlayQuery('');
        clearMedicationData();
      }
    }
  }, [pendingMedicationData, clearMedicationData]);
  const handleVitalsAdded = () => {
    // Refresh vitals data after adding new vitals
    if (consultationId) {
      const fetchVitals = async () => {
        try {
          const graphData = await apiService.getVitalSignsGraphData(consultationId);
          console.log('Fetched vitals graph data 3:', graphData);

          setGraphData(graphData);
          // Extract current vitals from graph data
          if (graphData) {
            import('@/utils/vitalsUtils').then(({ extractCurrentVitals }) => {
              const currentVitals = extractCurrentVitals(graphData, consultationId);
              setVitals(currentVitals);
            });
          }
        } catch (error) {
          console.error('Error refreshing vitals:', error);
        }
      };
      fetchVitals();
    }
  };

  // Refresh notes data after adding new notes
  const handleNotesAdded = async () => {
    if (!consultationId) return;
    try {
      const data = await apiService.getNotes(consultationId);
      setVisits(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error refreshing notes:', error);
    }
  };

  // Refresh medications data after adding new medication
  const handleMedicationsAdded = async () => {
    if (!consultationId) return;
    try {
      const data = await apiService.getCurrentMedicationsByPatient(consultationId);
      if (data && 'medications' in data) {
        setMedications(data.medications);
      } else if (Array.isArray(data)) {
        setMedications(data);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error('Error refreshing medications:', error);
    }
  };

  // Refresh lab results data after adding new lab result
  const handleLabResultsAdded = async () => {
    if (!consultationId) return;
    try {
      // Refresh lab results using the Lab component's refresh function
      // This calls viewLabResults API (hmsviewlabresult6965e0b5b1120)
      if (labRefreshRef.current) {
        await labRefreshRef.current();
      }
      // Also refresh the recent results
      const data = await apiService.getRecentLabResults(consultationId);
      setLabResults(data);

      // Refresh PDF lab orders to ensure report is up-to-date
      const labData = await apiService.viewLabResults(consultationId);
      setPdfLabOrders((labData || []).map((lab: any) => mapLabOrderForReport(lab)));
    } catch (error) {
      console.error('Error refreshing lab results:', error);
    }
  };

  // Refresh patient info (Chief Complaints, History, etc.)
  const handlePatientDataRefresh = async () => {
    if (!consultationId) return;
    try {
      const data = await apiService.getPatientByConsultationId(consultationId, patientType);
      setPatientData(data);
    } catch (error) {
      console.error('Error refreshing patient info:', error);
    }
  };

  // Handler for socket patient data updates
  const handlePatientDataUpdate = useCallback(async (data: {
    identifier?: string,
    identifier_value?: string,
    tags?: string,
    _type: string,
    admissionid?: string
  }) => {
    if (!consultationId) return;

    switch (data._type) {
      case 'Vitals':
        handleVitalsAdded();
        break;

      case 'Medications':
        await handleMedicationsAdded();
        break;

      case 'Notes':
        await handleNotesAdded();
        break;

      case 'Lab Results':
      case 'lab':
        await handleLabResultsAdded();
        break;

      case 'AI Observations':
        try {
          const obsData = await apiService.getAIObservations(consultationId);
          setAiObservations(obsData || []);
        } catch (error) {
          console.error('Failed to load AI observations data', error);
        }
        break;

      case 'Visit History':
        try {
          const historyData = await apiService.getVisitHistory(consultationId);
          setVisitHistory(historyData);
        } catch (error) {
          console.error('Failed to load visit history data', error);
        }
        break;
    }
  }, [consultationId]);

  // Use the shared socket service for patient data updates
  usePatientDataSocket(handlePatientDataUpdate, { consultationId });

  // AI event management is now handled by useAIEventManager hook

  // Fetch staff lists on mount
  useEffect(() => {
    if (!consultationId) return;

    const fetchWrapper = async (fetchFn, setStateFn, errorMessage, transformFn = (data) => data) => {
      try {
        const data = await fetchFn();
        setStateFn(transformFn(data));
      } catch (error) {
        console.error(errorMessage, error);
        throw error; // Re-throw to be caught by fetchAll
      }
    };

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([
          fetchWrapper(
            () => apiService.getPatientByConsultationId(consultationId, patientType),
            (data) => {
              setPatientData(data);
              if (Array.isArray(data) && data.length > 0) {
                setDutyDoctor({ name: data[0].dutyDoctorNetworkName || '', id: data[0].dutyDoctorNetworkGdid || '' });
                setAssignedDoctor({
                  name: data[0].doctorName || data[0].assignedPhysician || '',
                  id: data[0].primaryConsultantNetworkGdid || data[0].doctorId || '',
                  department: data[0].doctorDepartment || '',
                  specialization: data[0].doctorSpecialization || ''
                });
                setAssignedNurse({ name: data[0].dutyNurseNetworkName || '', id: data[0].dutyNurseNetworkGdid || '' });

                // Fetch assistant settings once we have the doctor ID
                const drId = data[0].primaryConsultantNetworkGdid || data[0].doctorId || data[0].dutyDoctorNetworkGdid || '';
                console.log('drId', drId);
                // if (drId) {
                apiService.getAssistantSettings(drId)
                  .then(savedSettings => {
                    if (savedSettings) {
                      setAssistantSettings(prev => ({
                        ...prev,
                        ...savedSettings,
                        // Ensure we don't accidentally set sections/config to undefined if missing from API
                        categories: savedSettings.categories || prev.categories,
                        reportSections: savedSettings.reportSections || prev.reportSections,
                        prescriptionReportConfig: savedSettings.prescriptionReportConfig || prev.prescriptionReportConfig
                      }));
                    }
                  })
                  .catch(error => console.error('Failed to fetch assistant settings:', error));
                // }

                // Check if consultation is already completed
                if (data[0].consultationStatus === 'Completed') {
                  setIsConsultationCompleted(true);
                }
              }
              else {
                console.warn('Empty patient data returned for consultationId:', consultationId);
                setPatientData([]);
              }
            },
            'Failed to load patient data'
          ),
          fetchWrapper(
            () => apiService.getVitalSignsGraphData(consultationId),
            (data) => {
              setGraphData(data);
              console.log('Extracted current vitals:', data);
              // Extract current vitals from graph data
              if (data) {
                try {
                  import('@/utils/vitalsUtils').then(({ extractCurrentVitals }) => {
                    try {
                      const currentVitals = extractCurrentVitals(data, consultationId);
                      setVitals(currentVitals);
                    } catch (error) {
                      console.error('Error extracting current vitals:', error);
                      // Set default vitals if extraction fails
                      setVitals({
                        consultationId,
                        timestamp: new Date().toISOString(),
                        heartRate: 0,
                        bloodPressureSystolic: 0,
                        bloodPressureDiastolic: 0,
                        respiratoryRate: 0,
                        temperature: 0,
                        oxygenSaturation: 0,
                        painLevel: 0,
                        consciousnessLevel: "Alert",
                        glasgowComaScale: { total: 0 },
                        bloodGlucose: 0
                      });
                    }
                  });
                } catch (error) {
                  console.error('Error loading vitalsUtils:', error);
                }
              }
            },
            'Failed to load vital signs data'
          ),
          fetchWrapper(
            () => apiService.getNotes(consultationId),
            setVisits,
            'Failed to load notes'
          ),
          fetchWrapper(
            () => apiService.getCurrentMedicationsByPatient(consultationId),
            (data) => {
              if (data && 'medications' in data) {
                setMedications(data.medications);
              } else if (Array.isArray(data)) {
                setMedications(data);
              } else {
                setMedications([]);
              }
            },
            'Failed to load medications'
          ),
          fetchWrapper(
            async () => {
              const labResults = await apiService.getRecentLabResults(consultationId);
              return labResults;
            },
            setLabResults,
            'Failed to load lab results'
          ),
          fetchWrapper(
            () => apiService.getAIObservations(consultationId),
            (data) => setAiObservations(data || []),
            'Failed to load AI observations'
          ),
          fetchWrapper(
            () => apiService.getVisitHistory(consultationId),
            setVisitHistory,
            'Failed to load visit history'
          ),
          // Fetch lab orders for PDF report
          fetchWrapper(
            () => apiService.viewLabResults(consultationId),
            (labData) => {
              setPdfLabOrders(labData.map((lab: any) => mapLabOrderForReport(lab)));
            },
            'Failed to load lab orders for report'
          ),
        ]);
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [consultationId]);

  const handleEditMedication = (medication: any) => {
    setEditingMedication(medication);
    setShowEditMedication(true);
  };

  const handleMedicationUpdated = async () => {
    // Refresh medications from the correct API after update
    if (!consultationId) return;
    try {
      const data = await apiService.getCurrentMedicationsByPatient(consultationId);
      if (data && 'medications' in data) {
        setMedications(data.medications);
      } else if (Array.isArray(data)) {
        setMedications(data);
      } else {
        setMedications([]);
      }
    } catch (error) {
      console.error('Error refreshing medications:', error);
    }
  };



  // Callback to receive Lab component's refresh function
  const handleLabRefresh = useCallback((refreshFn: () => Promise<void>) => {
    labRefreshRef.current = refreshFn;
  }, []);

  const getReportSectionsForConsultationDoctor = useCallback(() => {
    const consultationDoctorId = String(patientData[0]?.doctorId ?? '').trim();
    return getDoctorFilteredReportSections(visits, medications, pdfLabOrders, consultationDoctorId);
  }, [patientData, visits, medications, pdfLabOrders]);

  const buildReportPatientData = (patient: Patient) => ({
    firstName: patient.firstName,
    surName: patient.surName,
    age: patient.age,
    gender: patient.gender,
    consultationId: patient.consultationId,
    patientId: patient.patientId,
    dateOfBirth: patient.dateOfBirth,
    admissionReason: patient.admissionReason,
    primaryDiagnosis: patient.primaryDiagnosis,
    secondaryDiagnoses: patient.secondaryDiagnoses,
    allergies: patient.allergies,
    bedNumber: patient.bedNumber,
    admissionDateTime: patient.admissionDateTime,
    chiefComplaint: patient.chiefComplaint,
    symptoms: patient.symptoms,
    duration: patient.duration,
    medicalHistory: patient.medicalHistory,
    purposeOfVisit: patient.purposeOfVisit,
    severity: patient.severity,
    urgentConcerns: patient.urgentConcerns,
    allergy: patient.allergy,
    comorbidity: patient.comorbidity,
    familySocialHistory: patient.familySocialHistory,
    customCategories: (() => {
      try {
        const raw = patient?.customCategories;
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((c: any) => ({ name: c.name, value: c.value, field: c.field })) : [];
      } catch { return []; }
    })(),
  });

  // Generate PDF Medical Report
  const handleGenerateReport = () => {
    const patient = patientData[0];
    const { notes: transformedNotes, medications: reportMedications, labOrders: reportLabOrders } =
      getReportSectionsForConsultationDoctor();

    generateMedicalReport({
      patient: buildReportPatientData(patient),
      doctor: {
        name: patient.assignedPhysician || assignedDoctor.name || dutyDoctor.name || 'Not Assigned',
        id: patient.doctorId || assignedDoctor.id || dutyDoctor.id,
      },
      medications: reportMedications,
      labOrders: reportLabOrders,
      notes: transformedNotes,
      vitals: vitals || undefined,
      generatedDate: new Date(),
      primaryColorHex: '#1a2256',
      prescriptionConfig: assistantSettings.prescriptionReportConfig,
      reportSections: assistantSettings.reportSections
    });
  };

  // Generate PDF Blob helper
  const generatePdfBlob = async () => {
    const patient = patientData[0];
    const { notes: transformedNotes, medications: reportMedications, labOrders: reportLabOrders } =
      getReportSectionsForConsultationDoctor();

    return await generateMedicalReportBlob({
      patient: buildReportPatientData(patient),
      doctor: {
        name: patient.assignedPhysician || assignedDoctor.name || dutyDoctor.name || 'Not Assigned',
        id: patient.doctorId || assignedDoctor.id || dutyDoctor.id,
      },
      medications: reportMedications,
      labOrders: reportLabOrders,
      notes: transformedNotes,
      vitals: vitals || undefined,
      generatedDate: new Date(),
      isPrintMode: true, // Print mode: empty space instead of header/footer
      prescriptionConfig: assistantSettings.prescriptionReportConfig,
      reportSections: assistantSettings.reportSections
    });
  };

  // Complete Consultation Handler - Fetches custom blocks for preview
  const handleProceedToDischarge = async () => {
    if (!consultationId) return;
    setIsCompleting(true);

    try {
      const { redirect_url } = await apiService.prepareDischargeDocument(consultationId);
      window.open(redirect_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error preparing discharge:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare discharge document.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!consultationId) return;
    setIsCompleting(true);

    try {
      // Fetch custom header/footer, color, and heights from API first
      const customBlocks = await apiService.getPdfCustomBlocks(consultationId);

      // Store the color and heights for later use in print
      setApiPrimaryColor(customBlocks.Color);
      setApiHeaderHeight(customBlocks.HeaderHeight);
      setApiFooterHeight(customBlocks.FooterHeight);

      // Generate PDF WITH custom header/footer, primary color, and dynamic heights for preview
      const pdfBlob = await generatePdfBlobWithCustomBlocks(
        customBlocks.Header,
        customBlocks.Footer,
        customBlocks.Color,
        customBlocks.HeaderHeight,
        customBlocks.FooterHeight
      );

      setReportPdfBlob(pdfBlob);
      setShowReportPreview(true);

      // Fire complete consultation API in background
      apiService.completeConsultation(consultationId)
        .then(() => setIsConsultationCompleted(true))
        .catch((error) => console.error('Error completing consultation:', error));

    } catch (error) {
      console.error('Error fetching custom blocks:', error);
      // Fallback: Generate PDF without custom blocks if API fails
      const pdfBlob = await generatePdfBlob();
      setReportPdfBlob(pdfBlob);
      setShowReportPreview(true);
    } finally {
      setIsCompleting(false);
    }
  };

  // Memoized reports array for View Report navigation (sorted by date, newest first)
  const viewReportsList = useMemo(() => {
    return labResults
      .filter(result => result.FileFullPath)
      .sort((a, b) => {
        const dateA = new Date(a.CreatedAt || 0).getTime();
        const dateB = new Date(b.CreatedAt || 0).getTime();
        return dateB - dateA;
      })
      .map(result => ({
        id: result.Id,
        fileName: result.FileName,
        fileUrl: result.FileFullPath,
        mimeType: result.MimeType || 'application/pdf',
        testName: result.TestName || 'General',
        findings: result.Findings || '',
        summary: result.Summary || ''
      }));
  }, [labResults]);

  // View Report Handler - Shows lab results with navigation
  const handleViewReport = () => {
    if (viewReportsList.length > 0) {
      setViewReportIndex(0); // Start at latest (index 0)
      setIsVisitAttachmentOpen(true);
    }
  };

  // Handler for navigating between reports in View Report sidebar
  const handleViewReportNavigate = (index: number) => {
    setViewReportIndex(index);
  };

  // Print from Preview Handler - Generates PDF WITHOUT header/footer BUT WITH API color and heights
  const handlePrintFromPreview = async () => {
    // Generate PDF without custom header/footer but with API color and heights for printing
    const printPdfBlob = await generatePdfBlobForPrint(apiPrimaryColor, apiHeaderHeight, apiFooterHeight);

    const url = URL.createObjectURL(printPdfBlob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  // Generate PDF Blob for printing - no header/footer but with API color and heights
  const generatePdfBlobForPrint = async (primaryColorHex?: string, headerHeight?: number, footerHeight?: number) => {
    const patient = patientData[0];
    const { notes: transformedNotes, medications: reportMedications, labOrders: reportLabOrders } =
      getReportSectionsForConsultationDoctor();

    return await generateMedicalReportBlob({
      patient: buildReportPatientData(patient),
      doctor: {
        name: patient.assignedPhysician || assignedDoctor.name || dutyDoctor.name || 'Not Assigned',
        id: patient.doctorId || assignedDoctor.id || dutyDoctor.id,
      },
      medications: reportMedications,
      labOrders: reportLabOrders,
      notes: transformedNotes,
      vitals: vitals || undefined,
      generatedDate: new Date(),
      isPrintMode: true,        // Remove header/footer
      primaryColorHex,          // Keep API color
      headerHeight,             // Keep API header height for spacing
      footerHeight,             // Keep API footer height for spacing
      prescriptionConfig: assistantSettings.prescriptionReportConfig,
      reportSections: assistantSettings.reportSections
    });
  };

  // Generate PDF Blob with custom header/footer, primary color, and dynamic heights
  const generatePdfBlobWithCustomBlocks = async (
    customHeader: string,
    customFooter: string,
    primaryColorHex?: string,
    headerHeight?: number,
    footerHeight?: number
  ) => {
    const patient = patientData[0];
    const { notes: transformedNotes, medications: reportMedications, labOrders: reportLabOrders } =
      getReportSectionsForConsultationDoctor();

    return await generateMedicalReportBlob({
      patient: buildReportPatientData(patient),
      doctor: {
        name: patient.assignedPhysician || assignedDoctor.name || dutyDoctor.name || 'Not Assigned',
        id: patient.doctorId || assignedDoctor.id || dutyDoctor.id,
      },
      medications: reportMedications,
      labOrders: reportLabOrders,
      notes: transformedNotes,
      vitals: vitals || undefined,
      generatedDate: new Date(),
      customHeader,
      customFooter,
      primaryColorHex,
      headerHeight,
      footerHeight,
      prescriptionConfig: assistantSettings.prescriptionReportConfig,
      reportSections: assistantSettings.reportSections
    });
  };

  // Send Report to Mobile Handler - Uses existing PDF with custom blocks
  const handleSendToMobileFromPreview = async () => {
    if (!consultationId || !reportPdfBlob) return;
    setIsSendingToMobile(true);
    try {
      // Use the existing PDF blob (already has custom header/footer from preview)
      await apiService.sendReportToMobile(consultationId, reportPdfBlob);
      setShowReportPreview(false);
    } catch (error) {
      console.error('Error sending report to mobile:', error);
    } finally {
      setIsSendingToMobile(false);
    }
  };

  // AI Interpretations Handler
  const handleViewAIInterpretations = async () => {
    if (!consultationId) return;
    setAiInterpretationsLoading(true);
    setShowAIInterpretationsModal(true);
    try {
      const html = await apiService.getAIInterpretations(consultationId);
      setAiInterpretationsHTML(html);
    } catch (error) {
      console.error('Error fetching AI interpretations:', error);
      setShowAIInterpretationsModal(false);
    } finally {
      setAiInterpretationsLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Patient Details...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive">Error: {error}</div>;
  }

  if (!patientData || patientData.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-[#f8f9fc] min-h-screen">
        No deal data available. Please verify the deal ID or try again.
      </div>
    );
  }
  const patient = patientData[0];

  return (
    <div className="min-h-screen bg-[#ebeef9]">
      {/* Header - Gradient Theme */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20 sticky top-0 z-50">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[200%] bg-indigo-500/5 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative h-full px-6 md:px-12 lg:px-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Touchable
              onClick={() => navigate('/corporate-deals')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-white group-hover:text-white transition-colors" />
            </Touchable>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-white leading-tight">Deal 360</h1>
                  {/* <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${patientType === 'inpatient'
                      ? 'bg-teal-400/15 text-teal-100 border-teal-300/30'
                      : 'bg-sky-400/15 text-sky-100 border-sky-300/30'
                      }`}
                  >
                    {patientType === 'inpatient' ? 'IP' : 'OP'}
                  </span> */}
                </div>
                <p className="text-[13px] text-white/50 font-medium">Detailed Deal Overview</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Query Deals button */}
            <button
              id="query-deals-btn"
              onClick={() => setIsQueryChatOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#0ea5e9] to-[#38bdf8] hover:from-[#0284c7] hover:to-[#0ea5e9] text-white rounded-[8px] h-10 px-4 shadow-[0_4px_15px_rgba(14,165,233,0.35)] hover:shadow-[0_6px_22px_rgba(14,165,233,0.5)] transition-all duration-200 active:scale-95"
            >
              <MessageSquareText className="w-4 h-4" />
              <span className="text-[12px] font-semibold font-['Inter'] whitespace-nowrap">Ask AI</span>
            </button>

            <VoiceRecorder
              admissionId={consultationId || ''}
              patientData={{
                dealName: patient.dealName,
                dealId: patient.dealId,
                borrower: patient.borrower,
                arranger: patient.arranger,
                primaryFo: patient.primaryFo,
                primaryTmu: patient.primaryTmu,
                jurisdiction: patient.jurisdiction,
                currency: patient.currency,
                dealType: patient.dealType,
                dealStatus: patient.dealStatus,
                dealCreatedOn: patient.dealCreatedOn,
                dealLastUpdated: patient.dealLastUpdated,
                lenders: patient.lenders,
                firstName: patient.firstName,
                surName: patient.surName,
              }}
            />
            <div className="h-[53px] border-l border-white/30" />
            <UserProfile variant="header" />
          </div>
        </div>
      </header>


      <main className="py-3 px-6 md:px-12 lg:px-16 transition-all duration-300">
        <div className="flex gap-4">
          {/* Left Column (Main Clinical View) */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header (Always Visible in Left Column) */}
            <PatientOverview
              patientData={patientData}
              consultationId={consultationId || ''}
              onAllergyUpdate={() => {
                if (consultationId) {
                  apiService.getPatientByConsultationId(consultationId, patientType).then(data => {
                    setPatientData(data);
                  }).catch(err => console.error('Error refreshing patient data:', err));
                }
              }}
              isConsultationCompleted={isConsultationCompleted}
              isCompleting={isCompleting}
              isInpatient={patientType === 'inpatient'}
              onProceedToDischarge={handleProceedToDischarge}
              onViewReport={handleViewReport}
              onViewAIInterpretations={handleViewAIInterpretations}
              onCompleteConsultation={handleCompleteConsultation}
              vitals={vitals}
              enabledCategories={
                assistantSettings.categories
                  .filter(c => c.enabled)
                  .map(c => ({
                    field: c.field,
                    name: c.name,
                    description: c.description
                  }))
              }
            />

            <Tabs defaultValue="patient-care" className="w-full">
              <div className="mb-3 border-b border-[#e0e3f5]">
                <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-6 border-b-0 rounded-none">
                  <TabsTrigger
                    value="patient-care"
                    className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground transition-all 
                               data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                               hover:text-foreground"
                  >
                    Facility & Loans
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="notes"
                    className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground transition-all 
                               data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                               hover:text-foreground"
                  >
                    Notes & Observations
                  </TabsTrigger> */}
                  <TabsTrigger
                    value="labs"
                    className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground transition-all 
                               data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                               hover:text-foreground"
                  >
                    File Storage
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="history"
                    className="rounded-none border-b-2 border-transparent px-2 py-3 text-[1.06rem] font-medium text-muted-foreground transition-all 
                               data-[state=active]:border-[#1a2256] data-[state=active]:text-[#1a2256] data-[state=active]:shadow-none data-[state=active]:bg-transparent 
                               hover:text-foreground"
                  >
                    History
                  </TabsTrigger> */}
                </TabsList>
              </div>

              {/* Patient Care Tab content */}
              <TabsContent value="patient-care" className="mt-0 outline-none space-y-4 min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                {patientType === 'inpatient' ? (
                  <FacilityAndLoans consultationId={consultationId || ""} currency={patientData?.[0]?.currency} />
                ) : (
                  <>
                    <CurrentVitalSigns onAddVitals={() => setShowAddVitals(true)} vitals={vitals} loading={loading} error={error} />
                    <VitalSignsTrend graphData={graphData} />
                  </>
                )}
              </TabsContent>

              {/* Notes & Observations Tab content */}
              {/* <TabsContent value="notes" className="mt-0 outline-none min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                <NotesAndObservations
                  onAddFinding={() => setShowAddFinding(true)}
                  visits={visits}
                  admissionId={consultationId}
                  loading={loading}
                  setVisits={setVisits}
                  onNoteAdded={handleNotesAdded}
                />
              </TabsContent> */}

              <TabsContent value="labs" className="mt-0 outline-none min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                <div className="bg-white rounded-[24px] border border-[#e0e3f5] p-4 shadow-sm h-full flex flex-col">
                  <RecentResults
                    admissionId={consultationId}
                    labResults={labResults}
                    loading={loading}
                    error={error}
                    onRefreshLabResults={handleLabResultsAdded}
                    patientName={patientName}
                    onViewReport={(index) => {
                      setViewReportIndex(index);
                      setIsVisitAttachmentOpen(true);
                    }}
                    onAskAI={handleAskAI}
                  />
                </div>
              </TabsContent>

              {/* History Tab content */}
              {/* <TabsContent value="history" className="mt-0 outline-none min-h-[600px] animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                <div className="bg-white rounded-[20px] border border-[#e0e3f5] p-4 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[1.125rem] font-semibold text-[#1a2256]">Visit History</h3>
                  </div>
                  {visitHistoryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1a2256]/20" />
                    </div>
                  ) : visitHistory && visitHistory.length > 0 ? (
                    <div className="space-y-3">
                      {visitHistory.map((visit) => {
                        const isExpanded = expandedVisitId === visit.rowID;
                        const visitDate = (visit.ScheduledDate || visit.VisitedOn || '').split(' ')[0];
                        return (
                          <div key={visit.rowID} className="border border-[#edf2f9] rounded-xl p-4 hover:bg-[#fbfcfd] transition-colors">
                            <div
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setExpandedVisitId(isExpanded ? null : visit.rowID)}
                            >
                              <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-[#64549f] shrink-0" />
                                <div>
                                  <p className="text-[0.875rem] font-semibold text-[#1a2256]">
                                    Dr. {visit.DoctorName || 'Unknown Doctor'}
                                  </p>
                                  <p className="text-[0.81rem] text-muted-foreground mt-0.5">
                                    Purpose of Visit:   {visit.PurposeOfVisit || 'No reason recorded'}
                                  </p>
                                  <p className="text-[0.81rem] text-[#64549f] mt-0.5">
                                    {visitDate}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs">{visit.Status || 'Completed'}</Badge>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-[#edf2f9] space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                {visit.UrgentConcerns && (
                                  <div>
                                    <h4 className="text-[0.75rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">Urgent Concerns</h4>
                                    <p className="text-[0.875rem] text-red-600 font-medium">{visit.UrgentConcerns}</p>
                                  </div>
                                )}
                                {visit.ConsultationHistory && visit.ConsultationHistory !== visit.Ai_Interpretation && (
                                  <div>
                                    <h4 className="text-[0.81rem] font-bold text-[#1a2256] uppercase tracking-wider mb-2">Consultation History</h4>
                                    {visit.ConsultationHistory.includes('</h2>') ? (
                                      <div className="bg-white rounded-xl border border-[#e2e8f0] p-1">
                                        <ConsultationReport
                                          htmlContent={visit.ConsultationHistory}
                                          patientName={visit.Name}
                                          doctorName={visit.DoctorName}
                                          reportDate={visitDate}
                                        />
                                      </div>
                                    ) : (
                                      <div className="text-[0.875rem] text-[#4a5568] leading-relaxed bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                                        <SafeHTMLRenderer content={visit.ConsultationHistory} />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {visit.Prescriptions && visit.Prescriptions.length > 0 && (
                                  <div>
                                    <h4 className="text-[0.81rem] font-bold text-[#1a2256] uppercase tracking-wider mb-2">Prescriptions</h4>
                                    <div className="space-y-2">
                                      {visit.Prescriptions.map((p: any, pIdx: number) => (
                                        <div key={pIdx} className="flex items-center justify-between p-2 bg-[#f8fafc] rounded-md border border-[#e2e8f0]">
                                          <div>
                                            <span className="text-[0.875rem] font-semibold text-[#1a2256]">{p.MedicationName}</span>
                                            <span className="mx-2 text-muted-foreground">•</span>
                                            <span className="text-[0.81rem] text-muted-foreground">{p.Dosage}</span>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[0.81rem] font-medium text-[#64549f]">{p.Frequency}</p>
                                            <p className="text-[0.75rem] text-muted-foreground">{p.Duration}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No visit history available for this patient.
                    </div>
                  )}
                </div>
              </TabsContent> */}
            </Tabs>
          </div>

          {/* Right Column (Always Visible) */}
          <div className="w-[480px] shrink-0 space-y-4">
            {patientType === 'inpatient' && patientData[0]?.inpatientAdmission && (
              <AdmissionOverview
                admission={patientData[0].inpatientAdmission}
                consultationId={consultationId || ''}
                onStaffUpdated={handlePatientDataRefresh}
              />
            )}

            {/* Loan Health Score Card */}
            <LoanHealthScoreCard consultationId={consultationId || ''} />

            {/* Early Warning Signals Card */}
            <EarlyWarningSignalsCard consultationId={consultationId || ''} />

            {/* What's Changed Since Last Disbursement Card */}
            <DisbursementChangesCard consultationId={consultationId || ''} />
          </div>
        </div>
      </main>

      {/* Modals - Pass all required props */}
      <AddVitalsModal
        consultationId={consultationId || ''}
        isOpen={showAddVitals}
        onClose={() => {
          setShowAddVitals(false);
        }}
        onVitalsAdded={handleVitalsAdded}
        initialVitalsData={aiState.vitalsData ? {
          heartRate: aiState.vitalsData.heartRate?.toString(),
          bloodPressureSystolic: aiState.vitalsData.bloodPressureSystolic?.toString(),
          bloodPressureDiastolic: aiState.vitalsData.bloodPressureDiastolic?.toString(),
          temperature: aiState.vitalsData.temperature?.toString(),
          oxygenSaturation: aiState.vitalsData.oxygenSaturation?.toString(),
          respiratoryRate: aiState.vitalsData.respiratoryRate?.toString(),
          painLevel: aiState.vitalsData.painLevel?.toString(),
          bloodGlucose: aiState.vitalsData.bloodGlucose?.toString(),
          glasgowComaScale: aiState.vitalsData.glasgowComaScale?.toString()
        } : undefined}
      />

      <AddMedicationModal
        key={aiMedicationDataOverride?.medicationName || 'default'}
        consultationId={consultationId || ''}
        isOpen={showAddMedication}
        onClose={() => {
          setShowAddMedication(false);
          setAiMedicationDataOverride(null);

          // Skip reopening overlay if medication was just saved
          if (medicationSavedRef.current) {
            medicationSavedRef.current = false;
            setPendingMedicationData(null);
            setOverlayMedicines([]);
            setOverlayQuery('');
            return;
          }

          // If we still have overlay medicines and pending data, reopen selection popup
          if (overlayMedicines.length > 0 && pendingMedicationData) {
            setMedicineOverlayOpen(true);
          } else {
            // Clear all pending state when truly done
            setPendingMedicationData(null);
            setOverlayMedicines([]);
            setOverlayQuery('');
          }
        }}
        onMedicationAdded={() => {
          // Mark that medication was saved successfully
          medicationSavedRef.current = true;

          handleMedicationsAdded();
          // Close the medicine overlay and clear all overlay state after successful save
          setMedicineOverlayOpen(false);
          setPendingMedicationData(null);
          setOverlayMedicines([]);
          setOverlayQuery('');
        }}
        initialMedicationData={aiMedicationDataOverride || aiState.medicationData}
      />

      {/* Medicine Selection Overlay for AI medication flow */}
      <MedicineSelectionOverlay
        open={medicineOverlayOpen}
        onOpenChange={handleMedicineOverlayClose}
        medicines={overlayMedicines}
        onConfirm={(medicine) => {
          // Find the full PatientMedicine object by name
          const fullMedicine = overlayMedicines.find(m => m.Name === medicine.Name);
          if (fullMedicine) {
            handleMedicineOverlayConfirm(fullMedicine);
          }
        }}
        searchQuery={overlayQuery}
      />

      {/* Service Selection Overlay for AI lab flow */}
      <ServiceSelectionOverlay
        open={serviceOverlayOpen}
        onOpenChange={handleServiceOverlayClose}
        services={overlayServices}
        onConfirm={handleServiceOverlayConfirm}
        searchQuery={overlayServiceQuery}
      />

      <AddLabResultModal
        consultationId={consultationId || ''}
        isOpen={showAddLabResult}
        onClose={() => {
          setShowAddLabResult(false);
          setAiLabTestName('');
        }}
        onLabResultAdded={handleLabResultsAdded}
        initialTestName={aiLabTestName}
      />

      <AddFindingModal
        consultationId={consultationId || ''}
        isOpen={showAddFinding}
        onClose={() => {
          setShowAddFinding(false);
          setInitialAiNote({ content: '', type: 'Clinical Note' });
        }}
        onNoteAdded={handleNotesAdded}
        initialNotes={initialAiNote.content || aiState.noteData?.notes || aiState.dischargeData?.notes || ''}
        initialFindingType={initialAiNote.type || aiState.noteData?.findingType || aiState.dischargeData?.findingType || ''}
      />

      <EditMedicationModal
        medication={editingMedication}
        patientId={consultationId || ''}
        open={showEditMedication}
        onOpenChange={setShowEditMedication}
        onMedicationUpdated={handleMedicationUpdated}
      />

      {/* Upload Report Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        admission_id={consultationId || ''}
        onUploadComplete={handleUploadComplete}
      />

      {/* PDF Viewer for View Report and Visit Attachments */}
      <PDFSidebar
        isOpen={isVisitAttachmentOpen}
        onClose={() => {
          setIsVisitAttachmentOpen(false);
          setSelectedFile('');
          setSelectedFileType('');
          setViewReportIndex(0);
        }}
        reports={viewReportsList.length > 0 && !selectedFile ? viewReportsList : undefined}
        currentIndex={viewReportIndex}
        onNavigate={handleViewReportNavigate}
        pdfUrl={selectedFile}
        testName={selectedTest}
        selectedFileType={selectedFileType}
        patientName={`${patientData[0]?.firstName || ''} ${patientData[0]?.surName || ''}`}
      />

      {/* Medical Report Preview Sidebar */}
      <MedicalReportPreview
        isOpen={showReportPreview}
        onClose={() => setShowReportPreview(false)}
        pdfBlob={reportPdfBlob}
        patientName={`${patient.firstName} ${patient.surName}`}
        onPrint={handlePrintFromPreview}
        onSendToMobile={handleSendToMobileFromPreview}
        isSendingToMobile={isSendingToMobile}
      />

      {/* AI Interpretations Modal */}
      {/* AI Interpretations Modal */}
      <Dialog open={showAIInterpretationsModal} onOpenChange={setShowAIInterpretationsModal}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[24px] border-[#e0e3f5] shadow-2xl [&>button]:text-white">
          <div className="bg-gradient-to-r from-[#1a2256] to-[#64549f] px-6 py-4 shrink-0">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 font-normal">
                <BrainCircuit className="w-5 h-5 text-white/80" />
                AI Consultation Summary
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 medical-scroll bg-[#fbfcfd]">
            {aiInterpretationsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-[#1a2256]/20 mb-4" />
                <span className="text-muted-foreground font-medium">Analyzing Clinical Data...</span>
              </div>
            ) : (
              <div className="ai-interpretation-content">
                <ConsultationReport
                  htmlContent={aiInterpretationsHTML}
                  patientName={`${patient.firstName} ${patient.surName}`}
                  doctorName={assignedDoctor.name || dutyDoctor.name || 'Not Assigned'}
                  reportDate={new Date().toLocaleDateString()}
                />
              </div>
            )}
          </div>

          {/* Fixed Done Button Footer */}
          <div className="px-6 py-4 border-t bg-white shrink-0 flex justify-end">
            <Button
              onClick={() => setShowAIInterpretationsModal(false)}
              className="rounded-[12px] h-11 px-10 font-bold bg-[#1a2256] hover:bg-[#1a2256]/90 text-white shadow-lg shadow-[#1a2256]/20 transition-all active:scale-[0.98]"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Query Deals Dialog */}
      <Dialog open={isQueryChatOpen} onOpenChange={setIsQueryChatOpen}>
        <DialogContent className="max-w-[520px] w-full p-0 gap-0 overflow-hidden rounded-[18px] border-[#1a2256]/20 bg-[#f8fbff] shadow-2xl [&>button]:hidden z-[9999] !left-auto !right-6 !top-auto !bottom-6 !translate-x-0 !translate-y-0">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-5 py-3.5 bg-[#1a2256] shrink-0 relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[0.94rem] font-bold text-white">Ask AI</p>
            </div>
            <button
              onClick={() => setIsQueryChatOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <XIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-[460px] overflow-y-auto px-5 py-4 space-y-3 bg-[#f8fbff] medical-scroll">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-[#1a2256] flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-sm">
                    <MessageSquareText className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-[16px] overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-[#1a2256] text-white rounded-br-[4px] shadow-sm px-4 py-2.5 text-[0.85rem] leading-relaxed'
                      : 'bg-white border border-[#dde9f8] shadow-sm rounded-bl-[4px]'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="px-4 py-3">
                      <ChatMarkdownRenderer content={msg.text} />
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1a2256] flex items-center justify-center shadow-sm">
                  <MessageSquareText className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-[#dde9f8] rounded-[16px] rounded-bl-[4px] px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a2256]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a2256]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a2256]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-3.5 border-t border-[#1a2256]/10 bg-white flex items-center gap-2.5 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
              placeholder="Ask about a deal, clause, covenant…"
              className="flex-1 rounded-[10px] border border-[#c5ddf5] px-4 py-2.5 text-[0.85rem] outline-none focus:border-[#1a2256] focus:ring-2 focus:ring-[#1a2256]/15 transition-all placeholder:text-[#a0b8cc]"
            />
            <button
              onClick={sendChatMessage}
              disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-[10px] bg-[#1a2256] flex items-center justify-center text-white shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default DealDetailsPage;
