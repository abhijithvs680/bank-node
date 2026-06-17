import { useState, useRef, useEffect } from 'react';
import { startGeminiVoiceAgent, stopGeminiVoiceAgent, startContinuousSpeechRecognition, sendGeminiFunctionCallOutput, touchVoiceAgentActivity } from "@/components/openaiVoiceAgent";
import { VoiceIdleModal } from '@/components/VoiceIdleModal';
import { getAllStaticContextForDeal } from "@/utils/dealDataHelper";
import {
  buildDealVoiceSystemInstructions,
  ensureSqliteDatabase,
  executeDealQuery,
  formatQueryTableToolError,
  formatQueryTableToolResponse,
  formatWebSearchToolError,
  formatWebSearchToolResponse,
  getDealContextTextForPrompt,
  getGeminiVoiceTools,
  loadDealContext,
} from "@/services/dealContextService";
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
  const [showIdleModal, setShowIdleModal] = useState(false);

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

  // Listen for query_table tool calls (local IndexedDB / SQLite)
  useEffect(() => {
    const handleQueryTable = async (e: any) => {
      const payload = e.detail;
      try {
        const data = await executeDealQuery(payload.sqlite_query, admissionId || undefined);
        sendGeminiFunctionCallOutput(
          payload.callId,
          'query_table',
          formatQueryTableToolResponse(data),
          { scheduling: 'INTERRUPT' }
        );
      } catch (err: any) {
        sendGeminiFunctionCallOutput(
          payload.callId,
          'query_table',
          formatQueryTableToolError(err.message),
          { scheduling: 'INTERRUPT' }
        );
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
        sendGeminiFunctionCallOutput(
          payload.callId,
          'web_search',
          formatWebSearchToolResponse(data.answer ?? data.results ?? data),
          { scheduling: 'INTERRUPT' }
        );
      } catch (err: any) {
        sendGeminiFunctionCallOutput(
          payload.callId,
          'web_search',
          formatWebSearchToolError(err.message),
          { scheduling: 'INTERRUPT' }
        );
      }
    };

    document.addEventListener('ai-web-search-requested', handleWebSearch);
    return () => {
      document.removeEventListener('ai-web-search-requested', handleWebSearch);
    };
  }, [admissionId]);

  useEffect(() => {
    const handleIdleTimeout = () => {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch {
        // ignore
      }
      clearInterval(intervalRef.current);
      setVoiceMode(false);
      setIsRecording(false);
      setLoading(false);
      setShowIdleModal(true);
    };

    document.addEventListener('voice-agent-idle-timeout', handleIdleTimeout);
    return () => document.removeEventListener('voice-agent-idle-timeout', handleIdleTimeout);
  }, []);

  const handleButtonClick = async () => {
    if (!isRecording) {
      setLoading(true);
      setError(null);
      try {
        // Fetch voice key and deal index in parallel; only schema goes to Gemini (rows load on demand).
        const [res, dealContextRecord] = await Promise.all([
          fetch('https://innov-dev.beta.injomo.com/workflow.trigger/6a31a6e5bf857664f20cad02', {
            method: 'POST',
          }),
          loadDealContext(admissionId || '', { buildSqlite: false }),
        ]);
        const data = await res.json();
        const ephemeralKey = data[0]?.["client_secret.value"] || data[0]?.value;
        const rawModel = data[0]?.model || "gemini-2.5-flash-native-audio-preview-12-2025";
        const modelName = rawModel.startsWith("models/") ? rawModel : `models/${rawModel}`;

        if (!ephemeralKey) {
          throw new Error("Failed to get ephemeral key from endpoint");
        }

        // Pre-build SQLite in the background so the first query_table call is instant.
        void ensureSqliteDatabase(admissionId || '').catch((err) => {
          console.error('Failed to prewarm deal SQLite:', err);
        });

        recognitionRef.current = startContinuousSpeechRecognition((userText) => {
          touchVoiceAgentActivity();
          setMessages(prev => [...prev, { user: userText, ai: '' }]);
        });

        const extendedContextData = patientData
          ? getAllStaticContextForDeal(admissionId || '', patientData)
          : null;
        const dealContextText = getDealContextTextForPrompt(dealContextRecord);
        const geminiTools = getGeminiVoiceTools(dealContextRecord);
        const systemInstructionsString = buildDealVoiceSystemInstructions(
          admissionId || '',
          extendedContextData ?? { dealId: admissionId },
          dealContextText,
          { waitForUser: true }
        );

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
      <VoiceIdleModal open={showIdleModal} onClose={() => setShowIdleModal(false)} />
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
