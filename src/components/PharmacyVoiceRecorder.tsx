import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { startVoiceAgent, stopVoiceAgent, startContinuousSpeechRecognition } from "@/components/openaiVoiceAgent";
import './AnimationsOnly.css';
import { Mic, Sparkles } from "lucide-react";
import { patientMedicineSearchService } from '@/services/patientMedicineSearchService';
import { apiService } from '@/services/apiService';

interface PharmacyVoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  medicinesData?: any[];
  onMedicineSearch?: (query: string) => void;
}

export const PharmacyVoiceRecorder = ({
  onRecordingComplete,
  medicinesData = [],
  onMedicineSearch
}: PharmacyVoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(true);
  const intervalRef = useRef(null);
  const recognitionRef = useRef<any>(null);
  const [messages, setMessages] = useState<{ user: string; ai: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const handleButtonClick = async () => {
    // Build inventory context from IndexedDB
    const medicines = await patientMedicineSearchService.getAllMedicines();

    const inventoryText = medicines.length > 0
      ? medicines.slice(0, 100).map(med =>
        `• ${med.Name}: ${med.Category}, ${med.MedicineType}, Manufacturer: ${med.Manufacturer}`
      ).join('\n')
      : "No inventory data available.";

    if (!isRecording) {
      setError(null);
      setLoading(true);
      try {
        // Get ephemeral key from backend API
        const ephemeralKey = await apiService.getEphemeralKey();
        
        recognitionRef.current = startContinuousSpeechRecognition((userText) => {
          setMessages(prev => [...prev, { user: userText, ai: '' }]);
        });

        await startVoiceAgent({
          ephemeralKey,
          model: "gpt-4o-realtime-preview",
          voice: "alloy",
          tools: [
            {
              type: "function",
              name: "lookupMedicine",
              description: "Search for medicine information, check stock levels, or get medicine details. Use this for any medicine-related queries like 'search antibiotics', 'check stock of paracetamol', 'show me amoxicillin details', 'find availability of aspirin'",
              parameters: {
                type: "object",
                properties: {
                  medicineName: {
                    type: "string",
                    description: "The medicine name, category, or generic name to search/lookup (e.g., 'antibiotics', 'paracetamol', 'amoxicillin')"
                  }
                },
                required: ["medicineName"]
              }
            },
            {
              type: "function",
              name: "getLowStockAlert",
              description: "Get list of medications that are below their stock threshold and need reordering",
              parameters: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    description: "Optional category filter to check specific medication types"
                  }
                },
                required: []
              }
            },
          ],
          instructions: `You are PharmAssist, an AI-powered pharmacy assistant designed to help pharmacy staff with inventory management, medication information, and clinical support.
 

 

Your capabilities:
• Search and retrieve medication information from inventory
• Check drug interactions and provide safety alerts
• Calculate appropriate dosages based on patient parameters
• Suggest alternative medications when needed
• Monitor and alert on low stock levels
• Help with inventory management and stock updates
• Provide evidence-based pharmaceutical information

Guidelines:
• Always verify medication names from the inventory before providing information
• Alert staff immediately about potential drug interactions
• Flag any low stock situations proactively
• Provide clear, professional pharmaceutical terminology
• When suggesting alternatives, consider availability, therapeutic equivalence, and stock levels
• For dosage calculations, always include appropriate warnings and reference clinical guidelines
• Help maintain accurate inventory records
• Respond conversationally but remain clinically precise
• If information is not available in the inventory, clearly state this
• when you are ready to respond, begin with "Hello, how can I assist you today?" 
• Remember Primary language is English. 


Safety Reminders:
• All clinical recommendations are for informational purposes
• Final prescribing decisions rest with licensed healthcare providers
• Critical interactions require immediate pharmacist review
• Stock data shown is current as of this conversation`
        }, {
          onTranscript: (text) => {
            setVoiceMode(true);
            setMessages(prev => {
              if (prev.length === 0) return [{ user: '', ai: text }];
              const updated = [...prev];
              updated[updated.length - 1].ai = text;
              return updated;
            });
          },
          onAIOutput: (text) => {
            console.log("PharmAssist output:", text);
          }
        });
        setLoading(false);
        setIsRecording(true);
      } catch (err: any) {
        setError(err?.message || "Failed to start pharmacy voice assistant.");
        setIsRecording(false);
      }
    } else {
      setIsRecording(false);
      try {
        await stopVoiceAgent();
        setVoiceMode(false);
        clearInterval(intervalRef.current);
      } catch (err: any) {
        setError(err?.message || "Failed to stop pharmacy voice assistant.");
      }
    }
  };

  const stopVoiceMode = async () => {
    stopVoiceAgent();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setVoiceMode(false);
    clearInterval(intervalRef.current);
    setIsRecording(false);
  };

  return (
    <div className="bg-gradient-bg flex items-center">
      {loading ? (
        <div className={`_gradient-border ${voiceMode ? 'active' : ''} `}>
          <div className={`voice-overlay ${voiceMode ? 'active' : ''} listening`}>
            <span className="status-text">  Initializing…</span>
            <button className="stop-btn" onClick={stopVoiceMode}>
              Stop
            </button>
          </div>
        </div>
      ) : isRecording ? (
        <div className={`_gradient-border ${voiceMode ? 'active' : ''}`}>
          <div className={`voice-overlay ${voiceMode ? 'active' : ''} speaking`}>
            <div className="speaking-animation" style={{ display: 'flex' }}>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
              <div className="sound-wave"></div>
            </div>
            <span className="status-text">PharmAssist is listening...</span>
            <button className="stop-btn" onClick={stopVoiceMode}>
              Stop
            </button>
          </div>
        </div>
      ) : (
        <Button className="enable-btn" onClick={handleButtonClick} variant="gradient">
          <Mic className="mic-icon" />
          <Sparkles className="w-4 h-4" />
          <span className='btn-text'>Enable Pharmacy Voice Assistant</span>
        </Button>
      )}
      {error && (
        <div className="text-destructive text-sm mt-2">{error}</div>
      )}
    </div>
  );
};
