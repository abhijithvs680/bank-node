import { useState, useEffect, useCallback, useRef } from 'react';
import { ClinicalData, TranscriptEntry, initialClinicalData, AmbientAssistantSettings, defaultCategories } from '@/types/doctorAssistant';
import { apiService } from '@/services/apiService';
import { startVoiceAgent, stopVoiceAgent, muteVoiceAgent, unmuteVoiceAgent } from '@/components/openaiVoiceAgent';

// Build extraction tools dynamically — only include fields for enabled categories
const buildExtractionTools = (settings: AmbientAssistantSettings) => {
  const enabledFields = settings.categories
    .filter(c => c.enabled)
    .map(c => c.field);
  console.log("enabledFields", enabledFields);

  // Always keep the full field set as a fallback if nothing is enabled
  const fieldEnum = enabledFields.length > 0 ? enabledFields : [
    "chiefComplaint",
    "hpiOnset", "hpiLocation", "hpiDuration", "hpiCharacter",
    "hpiSeverity", "hpiTiming", "hpiModifyingFactors", "associatedSymptom",
    "pastMedicalHistory", "medication", "allergy", "familyHistory",
    "socialSmoke", "socialAlcohol", "socialDrugs", "socialOccupation", "socialLiving",
    "redFlag", "physicalExam", "assessment", "plan", "labOrder"
  ];

  return [
    {
      type: "function",
      name: "update_clinical_data",
      description: "Update extracted clinical information from the doctor-patient conversation. Call this whenever you identify clinical information.",
      parameters: {
        type: "object",
        properties: {
          field: {
            type: "string",
            enum: fieldEnum,
            description: "The clinical field to update"
          },
          value: {
            type: "string",
            description: "The value to set for this field"
          },
          allergyReaction: {
            type: "string",
            description: "For allergies, the reaction type (e.g., rash, anaphylaxis)"
          },
          medicationDose: {
            type: "string",
            description: "For medications, the dosage"
          }
        },
        required: ["field", "value"]
      }
    },
    {
      type: "function",
      name: "add_transcript",
      description: "Add a transcript entry from the conversation. Call this for each meaningful statement.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The spoken text"
          },
          speaker: {
            type: "string",
            enum: ["doctor", "patient", "unknown"],
            description: "Who said this"
          }
        },
        required: ["text"]
      }
    }
  ];
};

const buildDynamicPrompt = (settings: AmbientAssistantSettings): string => {
  const enabledCategories = settings.categories.filter(c => c.enabled);

  let categoriesText = "Do NOT extract any specific clinical categories. Only provide conversation transcripts.";
  
  if (enabledCategories.length > 0) {
    categoriesText = enabledCategories.map((cat, index) => {
      return `${index + 1}. ${cat.name} (field: "${cat.field}") - ${cat.description}`;
    }).join('\n\n');
  }

  const finalPrompt = `You are a medical scribe AI assistant listening to a doctor-patient conversation. 
Your job is to extract and structure clinical information in real-time.

IMPORTANT: You are in LISTEN-ONLY mode. Do NOT speak or respond audibly. 
Only extract information and call the update_clinical_data tool.

CRITICAL ANTI-HALLUCINATION RULES:
- If you hear SILENCE, background noise, static, or no clear human speech, do ABSOLUTELY NOTHING. Do NOT call any tools. Do NOT generate any data.
- NEVER invent, fabricate, or assume any clinical information. You must ONLY extract data from clear, audible, intelligible speech.
- If you are uncertain whether something was said, do NOT extract it. Only extract information you are highly confident was explicitly spoken.
- Do NOT generate example data, placeholder data, or sample conversations.
- If the audio is unclear, muffled, or you cannot make out the words, do NOTHING.
- Wait patiently for clear speech before calling any tools.

LANGUAGE INSTRUCTION: The conversation may be in ANY language (Hindi, Tamil, Telugu, Spanish, etc.).
You MUST ALWAYS translate all extracted information to ENGLISH before storing it.
All values passed to update_clinical_data and add_transcript must be in English.

Extract only the following categories using the update_clinical_data tool:

${categoriesText}

Also call add_transcript for each meaningful statement to build conversation history.
Translate all transcript entries to English as well.

Be accurate and only extract information explicitly stated in the conversation.
Do not infer or make assumptions. Always translate to English.`;

  console.log(finalPrompt, "DYNAMIC_CLINICAL_SCRIBE_PROMPT");
  return finalPrompt;
};

export const useDoctorAssistant = (settings: AmbientAssistantSettings = { categories: defaultCategories }) => {
  // Keep a ref so startListening always uses the latest settings without re-creating the callback
  const settingsRef = useRef<AmbientAssistantSettings>(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [clinicalData, setClinicalData] = useState<ClinicalData>(initialClinicalData);
  const [conversationHistory, setConversationHistory] = useState<TranscriptEntry[]>([]);
  const [hasRecordedData, setHasRecordedData] = useState(false);

  // Helper to check if clinical data has content
  const hasContent = (data: ClinicalData): boolean => {
    return !!(
      data.chiefComplaint ||
      data.hpiDetails.onset ||
      data.hpiDetails.location ||
      data.pastMedicalHistory.length > 0 ||
      data.medications.length > 0 ||
      data.allergies.length > 0 ||
      data.redFlags.length > 0 ||
      data.assessment ||
      data.plan.length > 0
    );
  };

  // Handle clinical data updates from AI
  const handleClinicalUpdate = useCallback((event: CustomEvent) => {
    const { field, value, allergyReaction, medicationDose, callId } = event.detail;

    setClinicalData(prev => {
      const updated = { ...prev };

      switch (field) {
        case 'chiefComplaint':
          updated.chiefComplaint = value;
          break;
        case 'hpiOnset':
          updated.hpiDetails = { ...updated.hpiDetails, onset: value };
          break;
        case 'hpiLocation':
          updated.hpiDetails = { ...updated.hpiDetails, location: value };
          break;
        case 'hpiDuration':
          updated.hpiDetails = { ...updated.hpiDetails, duration: value };
          break;
        case 'hpiCharacter':
          updated.hpiDetails = { ...updated.hpiDetails, character: value };
          break;
        case 'hpiSeverity':
          updated.hpiDetails = { ...updated.hpiDetails, severity: value };
          break;
        case 'hpiTiming':
          updated.hpiDetails = { ...updated.hpiDetails, timing: value };
          break;
        case 'hpiModifyingFactors':
          updated.hpiDetails = { ...updated.hpiDetails, modifyingFactors: value };
          break;
        case 'associatedSymptom':
          if (!updated.hpiDetails.associatedSymptoms.includes(value)) {
            updated.hpiDetails = {
              ...updated.hpiDetails,
              associatedSymptoms: [...updated.hpiDetails.associatedSymptoms, value]
            };
          }
          break;
        case 'pastMedicalHistory':
          if (!updated.pastMedicalHistory.includes(value)) {
            updated.pastMedicalHistory = [...updated.pastMedicalHistory, value];
          }
          break;
        case 'medication':
          if (!updated.medications.some(m => m.name === value)) {
            updated.medications = [...updated.medications, { name: value, dose: medicationDose }];
          }
          break;
        case 'allergy':
          if (!updated.allergies.some(a => a.allergen === value)) {
            updated.allergies = [...updated.allergies, { allergen: value, reaction: allergyReaction }];
          }
          break;
        case 'familyHistory':
          if (!updated.familyHistory.includes(value)) {
            updated.familyHistory = [...updated.familyHistory, value];
          }
          break;
        case 'socialSmoke':
          updated.socialHistory = { ...updated.socialHistory, smoking: value };
          break;
        case 'socialAlcohol':
          updated.socialHistory = { ...updated.socialHistory, alcohol: value };
          break;
        case 'socialDrugs':
          updated.socialHistory = { ...updated.socialHistory, drugs: value };
          break;
        case 'socialOccupation':
          updated.socialHistory = { ...updated.socialHistory, occupation: value };
          break;
        case 'socialLiving':
          updated.socialHistory = { ...updated.socialHistory, livingSituation: value };
          break;
        case 'redFlag':
          if (!updated.redFlags.includes(value)) {
            updated.redFlags = [...updated.redFlags, value];
          }
          break;
        case 'physicalExam':
          if (!updated.physicalExam.includes(value)) {
            updated.physicalExam = [...updated.physicalExam, value];
          }
          break;
        case 'assessment':
          updated.assessment = value;
          break;
        case 'plan':
          if (!updated.plan.includes(value)) {
            updated.plan = [...updated.plan, value];
          }
          break;
        case 'labOrder':
          if (!updated.labOrders || (Array.isArray(updated.labOrders) && !updated.labOrders.some(l => l.testName === value))) {
            const currentLabs = Array.isArray(updated.labOrders) ? updated.labOrders : [];
            updated.labOrders = [...currentLabs, { testName: value, description: "" }];
          }
          break;
      }

      return updated;
    });

    // Dispatch completion event
    document.dispatchEvent(new CustomEvent('doctor-assistant-update-completed', {
      detail: { callId, success: true }
    }));
  }, []);

  // Handle transcript entries
  const handleTranscript = useCallback((event: CustomEvent) => {
    const { text, speaker, callId } = event.detail;

    setConversationHistory(prev => [
      ...prev,
      {
        text,
        speaker: speaker || 'unknown',
        timestamp: new Date()
      }
    ]);

    // Dispatch completion event
    document.dispatchEvent(new CustomEvent('doctor-assistant-transcript-completed', {
      detail: { callId, success: true }
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener('doctor-assistant-update-requested', handleClinicalUpdate as EventListener);
    document.addEventListener('doctor-assistant-transcript-requested', handleTranscript as EventListener);

    return () => {
      document.removeEventListener('doctor-assistant-update-requested', handleClinicalUpdate as EventListener);
      document.removeEventListener('doctor-assistant-transcript-requested', handleTranscript as EventListener);
    };
  }, [handleClinicalUpdate, handleTranscript]);

  const startListening = useCallback(async () => {
    // Clear previous session data to prevent stale/hallucinated data from persisting
    setClinicalData(initialClinicalData);
    setConversationHistory([]);
    setHasRecordedData(false);

    setIsConnecting(true);
    try {
      // Get ephemeral key from backend API
      const ephemeralKey = await apiService.getEphemeralKey();

      await startVoiceAgent({
        ephemeralKey,
        model: "gpt-4o-realtime-preview",
        voice: "alloy",
        tools: buildExtractionTools(settingsRef.current),
        instructions: buildDynamicPrompt(settingsRef.current),
        listenOnly: true, // Don't produce audio output, just listen and extract
        temperature: 0
      });

      setIsListening(true);
    } catch (error) {
      console.error('Failed to start Doctor Assistant:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await stopVoiceAgent();
    } finally {
      setIsListening(false);
      // Always set hasRecordedData to true after stopping - the widget will check hasContent
      setHasRecordedData(true);
    }
  }, []);

  const clearData = useCallback(() => {
    setClinicalData(initialClinicalData);
    setConversationHistory([]);
    setHasRecordedData(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      unmuteVoiceAgent();
      setIsMuted(false);
    } else {
      muteVoiceAgent();
      setIsMuted(true);
    }
  }, [isMuted]);

  return {
    isListening,
    isConnecting,
    isMuted,
    clinicalData,
    conversationHistory,
    hasRecordedData,
    startListening,
    stopListening,
    setClinicalData,
    clearData,
    toggleMute,
  };
};
