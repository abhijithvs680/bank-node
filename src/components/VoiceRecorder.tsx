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
  const [showEnginePopover, setShowEnginePopover] = useState(false);
  const [selectedVoiceEngine, setSelectedVoiceEngine] = useState('cloud-llm');
  const popoverRef = useRef<HTMLDivElement>(null);
  const lastUserPromptRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');

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

  // Close popover when clicking outside
  useEffect(() => {
    if (!showEnginePopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowEnginePopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEnginePopover]);

  // Fire-and-forget voice analytics recording
  const recordVoiceAnalytics = (prompt: string, answer: string) => {
    const finalPrompt = prompt || "Voice query (audio stream)";
    const finalAnswer = answer || "Audio response generated";
    if (!admissionId) return;
    fetch(`${API_BASE_URL}/record_voice_analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: finalPrompt,
        answer: finalAnswer,
        deal_id: admissionId,
        engine: selectedVoiceEngine,
        session_id: sessionIdRef.current || crypto.randomUUID(),
      }),
    }).catch(err => console.error('Voice analytics recording failed:', err));
  };

  const handleButtonClick = async () => {
    if (!isRecording) {
      setLoading(true);
      setError(null);
      sessionIdRef.current = crypto.randomUUID();
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
          lastUserPromptRef.current = userText;
          setMessages(prev => [...prev, { user: userText, ai: '' }]);
        });

        const extendedContextData = patientData
          ? getAllStaticContextForDeal(admissionId || '', patientData)
          : null;
        const dealContextText = getDealContextTextForPrompt(dealContextRecord);
        const geminiTools = selectedVoiceEngine === 'on-premises' ? [] : getGeminiVoiceTools(dealContextRecord);
        let systemInstructionsString = buildDealVoiceSystemInstructions(
          admissionId || '',
          extendedContextData ?? { dealId: admissionId },
          dealContextText,
          { waitForUser: true, engine: selectedVoiceEngine }
        );

        const savedRedactOptions = localStorage.getItem('redactOptions');
        if (savedRedactOptions && savedRedactOptions !== '[]') {
          const formData = new FormData();
          formData.append('context', systemInstructionsString);
          formData.append('redact_options', savedRedactOptions);
          formData.append('action', 'initializeAgentContext');

          try {
            const maskRes = await fetch('https://innov-dev.beta.injomo.com/workflow.trigger/bankagentsorchestration6a3d14c877195', {
              method: 'POST',
              body: formData
            });
            if (maskRes.ok) {
              const maskData = await maskRes.json();
              if (maskData && maskData[0]) {
                const originalContext = systemInstructionsString;
                let maskedContext = maskData[0].masked_text || maskData[0].answer || maskData[0].context || maskData[0].masked_context;
                
                if (maskedContext) {
                  const originalFirstWord = originalContext.split(/\s+/)[0];
                  const maskedFirstWord = maskedContext.split(/\s+/)[0];
                  
                  if (maskedFirstWord !== originalFirstWord && maskedFirstWord.startsWith('<') && maskedFirstWord.endsWith('>')) {
                    maskedContext = maskedContext.replace(maskedFirstWord, originalFirstWord);
                  }
                  
                  systemInstructionsString = maskedContext;
                }
              }
            }
          } catch (e) {
            console.error('Failed to mask system instructions:', e);
          }
        }

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
              recordVoiceAnalytics("Voice query passed", text);
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
    <div className="relative bg-gradient-bg flex items-center">
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
          onClick={() => setShowEnginePopover(prev => !prev)}
        >
          <img src={handfreeMagicSvg} alt="" className="w-5 h-5" />
          <span className="text-[12px] font-semibold font-['Inter']   whitespace-nowrap">Hands-Free Mode</span>
        </button>}

      {/* Engine Selection Popover */}
      {showEnginePopover && !isRecording && !loading && (
        <div
          ref={popoverRef}
          className="absolute top-full right-0 mt-2 z-[99999] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-[260px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#fdc148]/20 flex items-center justify-center">
                <img src={handfreeMagicSvg} alt="" className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[12px] font-bold text-[#1a2256]">Select Engine</h4>
                <p className="text-[9px] text-slate-400 font-medium">Choose execution engine for voice mode</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              {[
                { value: 'cloud-llm', label: 'Cloud-LLM', desc: 'Cloud-hosted model', color: 'blue' },
                { value: 'on-premises', label: 'On-Premises', desc: 'Local infrastructure', color: 'violet' },
                { value: 'on-premises-lora', label: 'On-Premises-LoRA', desc: 'Fine-tuned local model', color: 'emerald' },
              ].map(opt => {
                const isSelected = selectedVoiceEngine === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedVoiceEngine(opt.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#1a2256] text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isSelected ? 'bg-white' : `bg-${opt.color}-400`
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-[11px] font-bold block ${isSelected ? 'text-white' : 'text-[#1a2256]'}`}>{opt.label}</span>
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>{opt.desc}</span>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                setShowEnginePopover(false);
                handleButtonClick();
              }}
              className="w-full h-9 bg-[#fdc148] hover:bg-[#f5b530] text-[#1a2256] text-[12px] font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              Start Voice Mode
            </button>
          </div>
        </div>
      )}
    </div>
  );

};
