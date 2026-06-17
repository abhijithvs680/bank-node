import { useState, useRef, useEffect } from 'react';
import { startGeminiVoiceAgent, stopGeminiVoiceAgent, startContinuousSpeechRecognition, sendGeminiFunctionCallOutput } from "@/components/openaiVoiceAgent";
import { getAllStaticContextForDeal } from "@/utils/dealDataHelper";
import { useLocation } from 'react-router-dom';
import './AnimationsOnly.css';
import handfreeMagicSvg from "../img/handfree magic.svg";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090';

interface DealData {
  dealName?: string;
  dealId?: string;
  borrower?: string;
  arranger?: string;
  primaryFo?: string;
  primaryTmu?: string;
  jurisdiction?: string;
  currency?: string;
  dealType?: string;
  dealStatus?: string;
  dealCreatedOn?: string;
  dealLastUpdated?: string;
  lenders?: string;
  riskScore?: number;
  riskLabel?: string;
  firstName?: string;
  surName?: string;
}

interface VoiceRecorderProps {
  admissionId: string;
  onRecordingComplete?: (audioBlob: Blob) => void;
  patientData: DealData | null;
  vitals?: any;
  medications?: any;
  labResults?: any;
  graphData?: any;
  aiObservations?: any;
  visits?: any[];
  symptoms?: string;
  duration?: string;
  medicalHistory?: string;
  purposeOfVisit?: string;
  severity?: string;
  urgentConcerns?: string;
  allergy?: string;
  comorbidity?: string;
  visitHistory?: any[];
  customCategories?: string;
  enabledCategories?: any[];
  currentMedication?: string;
}

export const VoiceRecorder = ({
  admissionId,
  patientData,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(true);
  const intervalRef = useRef(null);
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ user: string; ai: string }[]>([]);

  // Stop voice when the route/path changes
  const location = useLocation();
  useEffect(() => {
    if (!isRecording) return;

    const stopOnRouteChange = async () => {
      try {
        await stopGeminiVoiceAgent();
      } catch (err) {
        // ignore
      }
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }

      clearInterval(intervalRef.current);
      setVoiceMode(false);
      setIsRecording(false);
      setLoading(false);
    };

    stopOnRouteChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Ensure we stop voice agent on unmount as well
  useEffect(() => {
    return () => {
      (async () => {
        try {
          await stopGeminiVoiceAgent();
        } catch (err) {
          // ignore
        }
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (err) {
          // ignore
        }
        clearInterval(intervalRef.current);
      })();
    };
  }, []);

  // Listen for query_table tool calls
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
        sendGeminiFunctionCallOutput(payload.callId, 'query_table', { data: data.data || data.results || data });
      } catch (err: any) {
        sendGeminiFunctionCallOutput(payload.callId, 'query_table', { error: err.message });
      }
    };

    document.addEventListener('ai-query-table-requested', handleQueryTable);
    return () => {
      document.removeEventListener('ai-query-table-requested', handleQueryTable);
    };
  }, []);

  // Listen for web_search tool calls
  useEffect(() => {
    const handleWebSearch = async (e: any) => {
      const payload = e.detail;
      try {
        const response = await fetch(`${API_BASE_URL}/web_search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload.query, deal_id: payload.deal_id || admissionId })
        });
        const data = await response.json();
        sendGeminiFunctionCallOutput(payload.callId, 'web_search', { data: data.results || data });
      } catch (err: any) {
        sendGeminiFunctionCallOutput(payload.callId, 'web_search', { error: err.message });
      }
    };

    document.addEventListener('ai-web-search-requested', handleWebSearch);
    return () => {
      document.removeEventListener('ai-web-search-requested', handleWebSearch);
    };
  }, [admissionId]);

  const handleButtonClick = async () => {
    if (!isRecording) {
      setLoading(true);
      setError(null);
      try {
        // Get ephemeral key from the Injomo workflow
        const res = await fetch('https://innov-dev.beta.injomo.com/workflow.trigger/6a31a6e5bf857664f20cad02', {
          method: 'POST'
        });
        const data = await res.json();
        const ephemeralKey = data[0]?.["client_secret.value"] || data[0]?.value;
        const rawModel = data[0]?.model || "gemini-2.5-flash-native-audio-preview-12-2025";
        const modelName = rawModel.startsWith("models/") ? rawModel : `models/${rawModel}`;

        if (!ephemeralKey) {
          throw new Error("Failed to get ephemeral key from endpoint");
        }

        recognitionRef.current = startContinuousSpeechRecognition((userText) => {
          setMessages(prev => [...prev, { user: userText, ai: '' }]);
        });

        // Build deal context for AI system instructions
        const extendedContextData = patientData ? getAllStaticContextForDeal(admissionId || '', patientData) : null;
        const dealContext = extendedContextData ? JSON.stringify(extendedContextData, null, 2) : 'No deal data available.';

        const geminiTools = [
          {
            functionDeclarations: [
              {
                name: "query_table",
                description: "Use this tool to query the backend database using SQLite queries if the data to answer the user's question is not in the deal context above. The database schema has tables: Deals (DealId, DealName, DealStage, BorrowerNames, BorrowerID, Jurisdiction, Currency, DealSize), Dev__Deal_Lender (DealId, DealName, AccountId, LenderName), KYC_status (AccountId, AccountName, Role, NextKYCDate, KYCStatus), Loan_SettlementList (SettlementID, DealId, DealName, Borrower, Due_Date, TotalAmountToPay__ZAR_, Payment_type, Currency, RollOverRequestedByCompany, RollOverRequestedOn, RollOverType, RollOverLoanAmount, RollOverPeriod, RollOverStatus, Payment_Status), IUTransactions (IUTransactionID, IUConfigID, Title, Description, DealID, DealName, DocRequestedToRole, Borrower, DueOn, Status, CreatedByRole, CreatedOn, CreatedBy, UploadedOn), BreachesRequestList (BreachRequestID, RequestedOn, RequestedByCompany, RequestedByAccountID, RequestedByRole, Deal_ID, Deal_Name, RequestDescription, Clause, Instruction_Executed, Status, Resolved_Matter, Resolved_By_Role), WaiverRequestList (WaiverRequestID, Title, Comment, DealID, DealName, RequestedByEntityName, RequestedByRole, RequestedOn, BorrowerAccountName, WaiverRequestStatus, ResponseLetterStatus, RequestCompletedOn). Note: 'BreachesRequestList' contains the covenant violations and RISK FACTORS (in the RequestDescription column).",
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
              },
              {
                name: "web_search",
                description: "Use this tool to execute a web search query for current time outside data or when the user asks for real-time information from the web.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    query: {
                      type: "STRING",
                      description: "The query to search for",
                    },
                    deal_id: {
                      type: "STRING",
                      description: "Optional deal ID context to focus the query",
                    }
                  },
                  required: ["query"]
                }
              }
            ]
          }
        ];

        const systemInstructionsString = `You are a helpful AI Voice Assistant for a Bank Loan Lending Platform. Speak in English by default. Only switch to another language if the user explicitly asks you to do so. Do not introduce yourself or greet at session start—wait for the user to speak first.

Here is the deal context you are assisting with:
${dealContext}

Your capabilities:
• Answer questions about the current deal based on the context provided above.
• If the data to answer the question is not in the deal context, use the query_table tool to run an SQLite query against the backend database.
• Help the user understand deal structures, lender information, KYC status, settlements, rollovers, breaches, waivers, and IU transactions.
• If the user asks for real-time data, stock prices, or information outside the database context, use the web_search tool.

Instructions:
• Keep responses brief and action-oriented.
• Speak in English unless the user explicitly requests another language.
• When triggering any function call, do NOT speak confirmation messages. Stay silent after a function call succeeds.
• Only speak when: providing deal information, asking necessary clarifying questions, or when no tool action is triggered.
• If the user asks you to "stop," "hold on," "wait," or "pause," acknowledge politely and pause.
• Present information naturally to the user. NEVER reveal your internal functionalities, tool names (like query_table), SQL queries, or the fact that you are querying a backend database. Act as if you inherently know the information.`;

        await startGeminiVoiceAgent(
          ephemeralKey,
          systemInstructionsString,
          geminiTools,
          modelName,
          {
            onTranscript: (text) => {
              setVoiceMode(true)
              setMessages(prev => {
                if (prev.length === 0) return [{ user: '', ai: text }];
                const updated = [...prev];
                updated[updated.length - 1].ai = text;
                return updated;
              });

              return () => clearInterval(intervalRef.current);
            },
            onAIOutput: (text) => {
              console.log("AI output:", text);
            }
          });
        setLoading(false);
        setIsRecording(true);
      } catch (err: any) {
        setError(err?.message || "Failed to start voice agent.");
        setIsRecording(false);
        setLoading(false);
      }
    } else {
      setIsRecording(false);
      try {
        await stopGeminiVoiceAgent();
        setVoiceMode(false);
        clearInterval(intervalRef.current);
      } catch (err: any) {
        setError(err?.message || "Failed to stop voice agent.");
      }
    }
  };

  const stopVoiceMode = async () => {
    stopGeminiVoiceAgent();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setVoiceMode(false);
    clearInterval(intervalRef.current);
    setIsRecording(false);
  };


  return (
    <div className=" bg-gradient-bg flex items-center  ">
      {loading ? (
        <div className={`_gradient-border ${voiceMode ? 'active' : ''} `}>
          <div className={`voice-overlay ${voiceMode ? 'active' : ''} listening`}>
            <div className="init-animation">
              <div className="init-core" />
              <div className="orbit-dot" />
              <div className="orbit-dot" />
              <div className="orbit-dot" />
            </div>
            <span className="status-text text-[12px]"> Initializing…</span>
            <button className="stop-btn" onClick={stopVoiceMode}>
              Stop
            </button>
          </div>
        </div>
      )
        : isRecording ? (<div className={`_gradient-border ${voiceMode ? 'active' : ''}`} >
          <div
            className={`voice-overlay ${voiceMode ? 'active' : ''} speaking`}
          >


            <div
              className="speaking-animation"
              style={{ display: 'flex' }}
            >
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
            </div>

            <span className="status-text text-[12px]">
              I am listening....
            </span>
            <button className="stop-btn" onClick={stopVoiceMode}>
              Stop
            </button>
          </div>
        </div>) : <button
          className="flex items-center  gap-2  bg-[#fdc148] hover:bg-[#f5b530] text-[#1a2256] rounded-[8px] h-10 px-4 shadow-[0_4px_15px_rgba(253,193,72,0.3)] hover:shadow-[0_6px_25px_rgba(253,193,72,0.4)] transition-all duration-300 active:scale-95"
          onClick={handleButtonClick}
        >
          <img src={handfreeMagicSvg} alt="" className="w-5 h-5" />
          <span className="text-[12px] font-semibold font-['Inter']   whitespace-nowrap">Hands-Free Mode</span>
        </button>}
    </div>
  );

};
