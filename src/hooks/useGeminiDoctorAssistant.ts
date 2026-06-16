import { useState, useEffect, useCallback, useRef } from 'react';
import { ClinicalData, TranscriptEntry, initialClinicalData, AmbientAssistantSettings, VisitInfo } from '@/types/doctorAssistant';
import { ambientSocketService } from '@/services/ambientSocketService';
import type { AmbientAuthPayload, AmbientConnectedResponse, AmbientOutputJsonResponse, AmbientConnectionClosedResponse } from '@/services/ambientSocketService';
import { authService } from '@/services/authService';
import { nanoid } from 'nanoid';

const formatVisitInfoForPrompt = (visitInfo: VisitInfo): string => {
  const lines: string[] = [];
  if (visitInfo.chiefComplaint) lines.push(`- chiefComplaint: ${visitInfo.chiefComplaint}`);
  if (visitInfo.purposeOfVisit) lines.push(`- purposeOfVisit: ${visitInfo.purposeOfVisit}`);
  if (visitInfo.symptoms) lines.push(`- symptoms: ${visitInfo.symptoms}`);
  if (visitInfo.duration) lines.push(`- duration: ${visitInfo.duration}`);
  if (visitInfo.urgentConcerns) lines.push(`- urgentConcerns: ${visitInfo.urgentConcerns}`);
  if (visitInfo.medicalHistory) lines.push(`- medicalHistory: ${visitInfo.medicalHistory}`);
  if (visitInfo.allergy) lines.push(`- allergy: ${visitInfo.allergy}`);
  if (visitInfo.comorbidity) lines.push(`- comorbidity: ${visitInfo.comorbidity}`);
  if (visitInfo.familySocialHistory) lines.push(`- familySocialHistory: ${visitInfo.familySocialHistory}`);
  if (visitInfo.currentMedication) lines.push(`- currentMedication: ${visitInfo.currentMedication}`);
  if (visitInfo.notes) lines.push(`- notes: ${visitInfo.notes}`);
  if (visitInfo.customCategories && typeof visitInfo.customCategories === 'object') {
    Object.entries(visitInfo.customCategories).forEach(([key, value]) => {
      if (value) lines.push(`- ${key}: ${value}`);
    });
  }
  return lines.length > 0 ? lines.join('\n') : '(none provided)';
};

const VISIT_INFO_FALLBACK_RULES = `
VISIT_INFO FALLBACK (required):
- extraction_stream_start includes visit_info with pre-charted consultation values.
- Always retain visit_info in your working context for the full extraction.
- If ambient listening/recording does NOT clearly mention a field, use the matching visit_info value in clinical_data.
- Only replace a visit_info value when the recording explicitly states new or corrected information for that field.
- Do not invent values beyond what appears in visit_info or the recording.`;

// ─── Dynamic Knowledgebase Generator ───
const generateKnowledgebase = (settings?: AmbientAssistantSettings, patientContext?: VisitInfo | null): string => {
  const enabledCategories = settings?.categories.filter(c => c.enabled) || [];

  let text = "Organize extracted medical knowledge strictly into these clinical domains:\n";

  if (enabledCategories.length > 0) {
    text += enabledCategories.map((cat, i) => `${i + 1}. ${cat.name}: ${cat.description}`).join('\n');
  } else {
    text += "Generic clinical data extraction.";
  }

  // visit_info from extraction_stream_start / audio_chunk payload
  if (patientContext) {
    text += "\n\nVISIT_INFO (pre-charted — use when recording lacks data):\n";
    text += formatVisitInfoForPrompt(patientContext);
    text += VISIT_INFO_FALLBACK_RULES;
  }

  text += `\n\nCRITICAL ANTI-HALLUCINATION RULES:
1. NEVER invent, fabricate, or assume any clinical information.
2. ONLY extract information that is CLEARLY and EXPLICITLY stated in the conversation.
3. If the audio is silent, unclear, or contains only background noise, do ABSOLUTELY NOTHING.
4. Do NOT assume missing details (e.g., if a medication is mentioned without dose, do not invent a dose).
5. Maintain strict adherence to the patient's existing history unless new information is clearly stated.
6. All extracted values MUST be translated to English.

Focus extraction on the identified domains only. Also identify assessment, plan, prescriptions, and lab orders when mentioned.`;

  return text;
};

// ─── Dynamic Schema Generator ───
const generateSchema = (settings?: AmbientAssistantSettings) => {
  const enabledCategories = settings?.categories.filter(c => c.enabled) || [];

  const schema: any = {
    transcript: {
      instruction: "Store each meaningful doctor-patient statement translated to English",
      entries: [
        { speaker: "doctor | patient", text: "Translated statement in English", timestamp: "optional" }
      ]
    },
    clinical_data: {
      chiefComplaint: { instruction: "Main reason for visit", value: "" },
      purposeOfVisit: { instruction: "The specific goal of today's consultation", value: "" },
      symptoms: { instruction: "Detailed symptoms", value: "" },
      allergy: { items: [] },
      medicalHistory: { instruction: "Past medical history", value: "" },
      urgentConcerns: { instruction: "High-priority or emergency issues noted", value: "" },
      redFlag: { items: [] },
      comorbidity: { instruction: "Co-existing medical conditions", value: "" },
      social_history: {
        socialSmoke: { value: "" },
        socialAlcohol: { value: "" },
        socialOccupation: { value: "" }
      },
      medication: { instruction: "Current active medications the patient is taking", value: "" },
      assessment: { instruction: "Diagnosis and clinical assessment", value: "" },
      plan: { instruction: "Treatment plan and recommendations", value: "" },
      prescriptions: {
        instruction: "List of newly prescribed medications with dose, frequency, and duration",
        items: [{ name: "", dosage: "", frequency: "", duration: "" }]
      },
      labOrders: {
        instruction: "List of lab tests or investigations requested by the doctor",
        items: [{ testName: "", description: "" }]
      }
    },
    meta: {
      language_handling: "All extracted values must be translated to English before storing",
      strict_rules: [
        "Do NOT infer or assume missing data",
        "Only extract explicitly stated information",
        "Do NOT generate responses or speak",
        "Operate in LISTEN-ONLY mode",
        "Always call update_clinical_data for structured fields",
        "Always call add_transcript for conversation entries",
        "extraction_stream_start includes visit_info — preserve those values when recording does not mention a field",
        "Use visit_info as fallback for empty clinical_data fields not covered by the recording"
      ],
      visit_info_handling: "When ambient recording is silent or omits a field, output the visit_info value for that field instead of leaving it empty"
    }
  };

  // Add any additional dynamic custom categories using the category field ID
  const baseFields = [
    'chiefComplaint', 'symptoms', 'allergy',
    'medicalHistory', 'redFlag', 'comorbidity', 'familySocialHistory',
    'purposeOfVisit', 'urgentConcerns', 'medication'
  ];
  enabledCategories.forEach(cat => {
    if (!baseFields.includes(cat.field)) {
      // Use category field ID as the schema key for consistency with UI mapping
      const schemaKey = cat.field;
      if (!schema.clinical_data[schemaKey]) {
        schema.clinical_data[schemaKey] = { instruction: cat.description || cat.name, value: "" };
      }
    }
  });

  return schema;
};

// ─── Dynamic Instructions Generator ───
const generateInstructions = (settings?: AmbientAssistantSettings, visitInfo?: VisitInfo | null): string => {
  const enabledCategories = settings?.categories.filter(c => c.enabled) || [];
  let prompt = `You are a medical scribe. Extract and structure information. 
All output MUST be in English. 
Extract the following:
`;
  enabledCategories.forEach(cat => { prompt += `- ${cat.name} (${cat.field})\n`; });
  prompt += `\nAlso identify "assessment", "plan", "prescriptions", and "labOrders".
For "prescriptions", extract if the doctor mentions starting or prescribing any medications with their frequency, dosage, and duration.
For "labOrders", extract any tests the doctor recommends with a brief reason if mentioned.`;

  if (visitInfo) {
    prompt += `\n\nVISIT_INFO (included in extraction_stream_start — keep when recording lacks data):\n`;
    prompt += formatVisitInfoForPrompt(visitInfo);
    prompt += VISIT_INFO_FALLBACK_RULES;
  }

  return prompt;
};

/** Apply visit_info values when extraction left a field empty */
const applyVisitInfoFallback = (data: ClinicalData, visitInfo: VisitInfo | null): ClinicalData => {
  if (!visitInfo) return data;

  const pick = (extracted: string | undefined, fallback: string | undefined) =>
    (extracted && extracted.trim()) ? extracted : (fallback?.trim() || '');

  const updated: ClinicalData = {
    ...data,
    chiefComplaint: pick(data.chiefComplaint, visitInfo.chiefComplaint),
    purposeOfVisit: pick(data.purposeOfVisit, visitInfo.purposeOfVisit),
    symptoms: pick(data.symptoms, visitInfo.symptoms),
    urgentConcerns: pick(data.urgentConcerns, visitInfo.urgentConcerns),
    medicalHistory: pick(data.medicalHistory, visitInfo.medicalHistory),
    allergy: pick(data.allergy, visitInfo.allergy),
    comorbidity: pick(data.comorbidity, visitInfo.comorbidity),
    familySocialHistory: pick(data.familySocialHistory, visitInfo.familySocialHistory),
    currentMedication: pick(data.currentMedication, visitInfo.currentMedication),
    customFields: { ...data.customFields },
  };

  if (!updated.hpiDetails.duration?.trim() && visitInfo.duration?.trim()) {
    updated.hpiDetails = { ...updated.hpiDetails, duration: visitInfo.duration.trim() };
  }

  if (visitInfo.customCategories && typeof visitInfo.customCategories === 'object') {
    Object.entries(visitInfo.customCategories).forEach(([key, value]) => {
      if (value?.trim() && !updated.customFields[key]?.trim()) {
        updated.customFields[key] = value.trim();
      }
    });
  }

  return updated;
};

// ─── Helper: Blob to base64 ───
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Audio streaming interval (10 seconds) ───
const AUDIO_CHUNK_INTERVAL_MS = 30_000;

// ─── Hook ───
export const useGeminiDoctorAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clinicalData, setClinicalData] = useState<ClinicalData>(initialClinicalData);
  const [conversationHistory, setConversationHistory] = useState<TranscriptEntry[]>([]);
  const [hasRecordedData, setHasRecordedData] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [patientStreamingText, setPatientStreamingText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isStreamStarted, setIsStreamStarted] = useState(false);
  const [hasReceivedFinalResponse, setHasReceivedFinalResponse] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const settingsRef = useRef<AmbientAssistantSettings | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);

  const isRecordingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const patientContextRef = useRef<VisitInfo | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPatientContext = useCallback((context: VisitInfo | null) => {
    patientContextRef.current = context;
  }, []);

  // ─── Map Extraction Result ───
  const mapExtractionToClinicalData = useCallback((parsed: any) => {
    if (!parsed) return;

    try {
      // 1. Transcript
      if (parsed.transcript?.entries && Array.isArray(parsed.transcript.entries)) {
        setConversationHistory(parsed.transcript.entries.map((e: any) => ({
          text: e?.text || '',
          speaker: e?.speaker || 'unknown',
          timestamp: new Date()
        })));
      }

      // 2. Clinical Data (support both wrapped and flat payloads)
      const cd = parsed.clinical_data || parsed;
      if (!cd || typeof cd !== 'object') return;

      setClinicalData(prev => {
        const updated = { ...prev };

        // Handle Chief Complaint
        const cc = cd.chiefComplaint?.value || cd.purposeOfVisit?.value;
        if (cc) updated.chiefComplaint = cc;

        // Handle Symptoms
        if (cd.symptoms?.value) updated.symptoms = cd.symptoms.value;

        // Handle Medical History
        if (cd.medicalHistory?.value) updated.medicalHistory = cd.medicalHistory.value;

        // Handle Comorbidity
        if (cd.comorbidity?.value) updated.comorbidity = cd.comorbidity.value;

        // Handle Assessment
        if (cd.assessment?.value) updated.assessment = cd.assessment.value;

        // Handle Allergy
        if (cd.allergy?.items && Array.isArray(cd.allergy.items)) {
          updated.allergy = cd.allergy.items.map((a: any) => {
            if (typeof a === 'string') return a;
            if (typeof a === 'object' && a !== null) {
              const name = a.allergen || a.name || a.item || '';
              const reaction = a.reaction || a.details || '';
              return `${name}${reaction ? ` (${reaction})` : ''}`;
            }
            return String(a);
          }).filter(Boolean).join(', ');

          // Also sync to the structured allergies array if possible
          updated.allergies = cd.allergy.items.map((a: any) => {
            if (typeof a === 'string') return { allergen: a };
            if (typeof a === 'object' && a !== null) {
              return {
                allergen: a.allergen || a.name || a.item || '',
                reaction: a.reaction || a.details || undefined
              };
            }
            return { allergen: String(a) };
          }).filter(a => a.allergen);
        } else if (cd.allergy?.value) {
          updated.allergy = cd.allergy.value;
        } else if (typeof cd.allergy === 'string') {
          updated.allergy = cd.allergy;
        }

        // Handle Urgent Concerns
        if (cd.urgentConcerns?.value) {
          updated.urgentConcerns = cd.urgentConcerns.value;
        } else if (cd.urgentConcerns?.items && Array.isArray(cd.urgentConcerns.items)) {
          updated.urgentConcerns = cd.urgentConcerns.items.map((i: any) =>
            typeof i === 'string' ? i : JSON.stringify(i)
          ).join(', ');
        }

        // Handle Purpose of Visit
        if (cd.purposeOfVisit?.value) {
          updated.purposeOfVisit = cd.purposeOfVisit.value;
        }

        // Handle Active Medication (mapped to currentMedication)
        if (cd.medication?.value) {
          updated.currentMedication = cd.medication.value;
        } else if (cd["active medications"]?.value) {
          // Fallback for previous schema versions
          updated.currentMedication = cd["active medications"].value;
        }

        // Handle Red Flags
        if (cd.redFlag?.items) updated.redFlags = cd.redFlag.items;

        // Handle Plan
        if (cd.plan?.value) {
          updated.plan = typeof cd.plan.value === 'string'
            ? cd.plan.value.split('\n').filter(Boolean)
            : Array.isArray(cd.plan.value) ? cd.plan.value : [];
        }

        // Handle Prescriptions (Newly prescribed)
        if (cd.prescriptions?.items && Array.isArray(cd.prescriptions.items)) {
          updated.medications = cd.prescriptions.items.map((m: any) => ({
            name: m.name || '',
            frequency: m.frequency || '',
            dosage: m.dosage || '',
            duration: m.duration || ''
          }));
        }

        // Handle Lab Orders
        if (cd.labOrders?.items && Array.isArray(cd.labOrders.items)) {
          updated.labOrders = cd.labOrders.items.map((l: any) => ({
            testName: l.testName || '',
            description: l.description || ''
          }));
        }

        // Handle Social History
        if (cd.social_history) {
          const sh = cd.social_history;
          const parts = [
            sh.socialSmoke?.value ? `Smoking: ${sh.socialSmoke.value}` : null,
            sh.socialAlcohol?.value ? `Alcohol: ${sh.socialAlcohol.value}` : null,
            sh.socialOccupation?.value ? `Occupation: ${sh.socialOccupation.value}` : null
          ].filter(Boolean);
          if (parts.length > 0) updated.familySocialHistory = parts.join(', ');
        }

        // Handle Custom Categories (e.g., surgical history)
        // Detect any key not in the standard set and store it as a custom field
        const standardFields = [
          'chiefComplaint', 'purposeOfVisit', 'symptoms', 'medicalHistory',
          'comorbidity', 'assessment', 'redFlag', 'plan', 'prescriptions',
          'labOrders', 'social_history', 'allergy', 'urgentConcerns',
          'medication', 'active medications'
        ];
        Object.keys(cd).forEach(key => {
          if (!standardFields.includes(key) && cd[key]?.value) {
            updated.customFields = {
              ...updated.customFields,
              [key]: cd[key].value
            };
          }
        });

        return applyVisitInfoFallback(updated, patientContextRef.current);
      });
    } catch (err) {
      console.error('[AmbientScribe] Mapping error:', err);
    }
  }, []);

  // ─── Collect & Send Audio Chunk ───
  const flushAndSendAudioChunk = useCallback(async (closeConnection: boolean = false) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId) {
      console.warn('[AmbientScribe] No session ID, cannot send audio');
      return;
    }

    if (!ambientSocketService.isConnectedStatus()) {
      console.warn('[AmbientScribe] Socket not connected, cannot send audio');
      return;
    }

    // Collect all accumulated chunks
    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = []; // Reset for next interval

    if (chunks.length === 0 && !closeConnection) {
      console.log('[AmbientScribe] No audio chunks to send, skipping');
      return;
    }

    try {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      const audioBase64 = await blobToBase64(audioBlob);

      console.log(`[AmbientScribe] Sending ${closeConnection ? 'FINAL' : ''} audio chunk:`,
        `${chunks.length} slices, ${(audioBlob.size / 1024).toFixed(1)} KB`);

      ambientSocketService.sendAudioChunk(sessionId, audioBase64, closeConnection);
    } catch (error) {
      console.error('[AmbientScribe] Failed to send audio chunk:', error);
    }
  }, []);

  // ─── Start 30-second audio streaming interval ───
  const startAudioStreamingInterval = useCallback(() => {
    // Clear any existing interval
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }

    console.log(`[AmbientScribe] Starting audio streaming interval (${AUDIO_CHUNK_INTERVAL_MS / 1000}s)`);

    audioIntervalRef.current = setInterval(() => {
      if (isRecordingRef.current && !isPausedRef.current) {
        flushAndSendAudioChunk(false);
      }
    }, AUDIO_CHUNK_INTERVAL_MS);
  }, [flushAndSendAudioChunk]);

  // ─── Stop audio streaming interval ───
  const stopAudioStreamingInterval = useCallback(() => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
      console.log('[AmbientScribe] Audio streaming interval stopped');
    }
  }, []);

  // ─── Start Listening ───
  const startListening = useCallback(async (settings?: AmbientAssistantSettings, sessionId?: string, visitInfo?: VisitInfo) => {
    setIsConnecting(true);
    settingsRef.current = settings;
    if (visitInfo) {
      patientContextRef.current = visitInfo;
    }
    isRecordingRef.current = true;
    isPausedRef.current = false;
    setIsPaused(false);
    setHasReceivedFinalResponse(false);
    setIsExtracting(false);
    setIsStreamStarted(false);

    // Generate a unique session ID
    const uniqueSessionId = sessionId || `session-${nanoid(10)}`;
    sessionIdRef.current = uniqueSessionId;

    // Build the prompt and schema for the auth payload
    const prompt = generateInstructions(settings, visitInfo);
    const expectedOutputJson = generateSchema(settings);

    // Get the user token from auth service
    const userToken = authService.getToken();
    if (!userToken) {
      console.error('[AmbientScribe] No user token available, cannot connect');
      setIsConnecting(false);
      return;
    }

    // Build the auth payload
    const authPayload: AmbientAuthPayload = {
      session_id: uniqueSessionId,
      prompt: prompt,
      expected_output_json: expectedOutputJson,
      need_transcription: true,
      user_token: userToken,
      // external_api_url will be injected by the service if not provided
    };

    try {
      // Step 1: Connect to WebSocket with auth
      ambientSocketService.connect(authPayload, {
        onConnected: (data: AmbientConnectedResponse) => {
          console.log('[AmbientScribe] Session ready:', data.session_id);
          setWsConnected(true);
          setIsConnecting(false);

          if (data.has_previous_transcription) {
            console.log('[AmbientScribe] Resuming previous session data');
          }

          // Start the 30s audio streaming interval
          startAudioStreamingInterval();
        },

        onDisconnected: (reason) => {
          console.log('[AmbientScribe] Disconnected:', reason);
          setWsConnected(false);
          stopAudioStreamingInterval();
        },

        onOutputJson: (data: AmbientOutputJsonResponse) => {
          console.log('[AmbientScribe] Real-time extraction received');
          setIsStreamStarted(true);

          // Map the output_json to clinical data
          const outputData = data.output_json;
          if (outputData) {
            mapExtractionToClinicalData(outputData);
          }

          setStreamingResponse(JSON.stringify(outputData, null, 2));
        },

        onConnectionClosed: (data: AmbientConnectionClosedResponse) => {
          console.log('[AmbientScribe] Session finalized');
          console.log('[AmbientScribe] Audio stored at:', data.s3_url);

          // Map the final output
          if (data.final_output_json) {
            mapExtractionToClinicalData(data.final_output_json);
          }

          setHasReceivedFinalResponse(true);
          setIsExtracting(false);
          setIsStreamStarted(false);
          setWsConnected(false);
          stopAudioStreamingInterval();
        },

        onError: (data) => {
          console.error('[AmbientScribe] Error:', data.message);
          setIsExtracting(false);
          setIsStreamStarted(false);
          setIsConnecting(false);
        }
      });

      // Step 2: Start microphone capture
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && !isPausedRef.current) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Record in 2-second slices that accumulate and flush every 30s
      recorder.start(2000);
      setIsListening(true);
      console.log('[AmbientScribe] Recording started (2s slices, 30s flush interval)');
    } catch (error) {
      console.error('[AmbientScribe] Failed to start:', error);
      setIsConnecting(false);
    }
  }, [mapExtractionToClinicalData, startAudioStreamingInterval, stopAudioStreamingInterval]);

  // ─── Stop Listening ───
  const stopListening = useCallback(async () => {
    try {
      // Stop the streaming interval first
      stopAudioStreamingInterval();

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsListening(false);
        setHasRecordedData(true);
        return;
      }

      // Stop the MediaRecorder and wait for final data
      const audioBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        };
        recorder.stop();
      });

      // Release microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      setIsListening(false);
      isPausedRef.current = false;
      setIsPaused(false);
      setHasRecordedData(true);
      isRecordingRef.current = false;
      setIsStreamStarted(false);

      // Send the final audio chunk with close_connection: true
      if (audioBlob.size > 0 && ambientSocketService.isConnectedStatus()) {
        setIsExtracting(true);
        setStreamingResponse('');

        console.log('[AmbientScribe] Sending FINAL audio chunk with close_connection=true');
        const audioBase64 = await blobToBase64(audioBlob);
        const sessionId = sessionIdRef.current;

        if (sessionId) {
          ambientSocketService.sendAudioChunk(sessionId, audioBase64, true);
        }

        // Clear accumulated chunks
        audioChunksRef.current = [];
      } else {
        console.warn('[AmbientScribe] Cannot deliver final audio: no data or not connected');
        // Disconnect anyway
        ambientSocketService.disconnect();
      }
    } catch (error) {
      console.error('[AmbientScribe] Stop operation failed:', error);
    }
  }, [stopAudioStreamingInterval]);

  // ─── Retry Extraction ───
  const retryExtraction = useCallback(async () => {
    // In the new flow, retry means we can re-send the last chunk
    // Since audio is streamed in real-time, retry is a no-op unless we have buffered audio
    console.warn('[AmbientScribe] Retry not applicable in streaming mode');
  }, []);

  // ─── Pause / Resume ───
  const togglePause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isListening) return;

    if (isPaused) {
      if (recorder.state === 'paused') {
        recorder.resume();
      }
      isPausedRef.current = false;
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = true; });
      setIsPaused(false);
    } else {
      if (recorder.state === 'recording') {
        recorder.pause();
      }
      isPausedRef.current = true;
      streamRef.current?.getAudioTracks().forEach(t => { t.enabled = false; });
      setIsPaused(true);
    }
  }, [isPaused, isListening]);

  const clearData = useCallback(() => {
    setClinicalData(initialClinicalData);
    setConversationHistory([]);
    setHasRecordedData(false);
    setHasReceivedFinalResponse(false);
    setIsExtracting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioStreamingInterval();
      ambientSocketService.disconnect();
    };
  }, [stopAudioStreamingInterval]);

  return {
    isListening, isConnecting, isPaused, clinicalData, setClinicalData,
    conversationHistory, hasRecordedData, startListening, stopListening,
    clearData, togglePause, wsConnected, streamingResponse, isExtracting,
    isStreamStarted, retryExtraction,
    hasReceivedFinalResponse, patientStreamingText, setPatientContext
  };
};