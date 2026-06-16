import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { startVoiceAgent, stopVoiceAgent, startContinuousSpeechRecognition, startGeminiVoiceAgent, stopGeminiVoiceAgent } from "@/components/openaiVoiceAgent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { apiService } from '@/services/apiService';
import { useLocation } from 'react-router-dom';
import './AnimationsOnly.css';
import handfreeMagicSvg from "../img/handfree magic.svg";
import { Mic, Sparkles } from "lucide-react";
interface PatientData {
  title?: string;
  firstName: string;
  surName: string;
  age: number;
  gender: string;
  admissionType: string;
  bedNumber: string;
  admissionDateTime: string;
  assignedPhysician: string;
  admissionReason: string;
  primaryDiagnosis: string;
  secondaryDiagnoses: string;
  allergies: string;
  heartRate: string;
  bpSystolic: string;
  bpDiastolic: string;
  respRate: string;
  spo2: string;
  temperature: string;
  gcs: string;
  notes?: string;
  medications?: string;
  labResults?: string;
}

interface VoiceRecorderProps {
  admissionId: string;
  onRecordingComplete?: (audioBlob: Blob) => void;
  patientData: PatientData | null;
  vitals?: any;
  medications?: any;
  labResults?: any;
  graphData?: any;
  aiObservations?: any;
  visits?: any[];
  // Additional consultation context
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
  onRecordingComplete,
  patientData,
  vitals,
  medications,
  labResults,
  graphData,
  aiObservations,
  visits,
  symptoms,
  duration,
  medicalHistory,
  purposeOfVisit,
  severity,
  urgentConcerns,
  allergy,
  comorbidity,
  visitHistory,
  customCategories,
  enabledCategories,
  currentMedication
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(true);
  const intervalRef = useRef(null);
  const recognitionRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  let recognition: any = null;
  const [messages, setMessages] = useState<{ user: string; ai: string }[]>([]);

  // Stop voice when the route/path changes
  const location = useLocation();
  useEffect(() => {
    if (!isRecording) return;

    const stopOnRouteChange = async () => {
      try {
        await stopGeminiVoiceAgent();
      } catch (err) {
        console.error('Error stopping voice agent on route change:', err);
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


  const handleButtonClick = async () => {
    const vitalsText = `• Heart Rate: ${vitals.heartRate ?? 'N/A'} bpm
• Blood Pressure: ${vitals.bloodPressureSystolic ?? 'N/A'}/${vitals.bloodPressureDiastolic ?? 'N/A'} mmHg
• Respiratory Rate: ${vitals.respiratoryRate ?? 'N/A'} breaths/min
• SpO2: ${vitals.oxygenSaturation ?? 'N/A'}%
• Temperature: ${vitals.temperature ?? 'N/A'}°C
• GCS: ${vitals.glasgowComaScale.total ?? 'N/A'}
• Pain Level: ${vitals.painLevel ?? 'N/A'}
• Consciousness Level: ${vitals.consciousnessLevel ?? 'N/A'}
• Blood Glucose: ${vitals.bloodGlucose ?? 'N/A'} mg/dL`;

    // // Format medications (filter out empty or incomplete entries)
    const medicationsText = Array.isArray(medications) && medications.length > 0
      ? medications.filter(med => med.name)
        .map(med => `• ${med.name}, ${med.dosage ?? 'N/A'}, ${med.frequency ?? 'N/A'}, ${med.route ?? 'N/A'}`)
        .join('\n')
      : "No medications prescribed.";
    // // Format lab results
    const labResultsText = Array.isArray(labResults) && labResults.length > 0
      ? labResults
        .map(lab => `• ${lab.FileDisplayName || lab.FileName}: ${lab.Findings || lab.Ai_Summary} || "No findings available"}`)
        .join('\n')
      : "No lab orders available.";
    //vitals history
    const vitalsHistory = Object.entries(graphData || {})
      .filter(([key, arr]) => Array.isArray(arr) && arr.length > 0)
      .map(([vital, arr]) => ({
        vital,
        readings: (arr as any[])
          .filter(item => item && Object.keys(item).length > 0)
          .map(item => ({
            time: item.time,
            value: item.systolic !== undefined && item.diastolic !== undefined
              ? `${item.systolic}/${item.diastolic}`
              : item.value
          }))
      }));
    const vitalsHistoryString = JSON.stringify(vitalsHistory);
    // // Format Notes and  observations
    const notesObservationsText = Array.isArray(visits) && visits.length > 0
      ? visits.map(obs => {
        const writtenOn = obs?.writtenOn?.replace(/:\d{2}$/, '');
        return `• ${obs.Level} created  by ${obs.staff || "Unknown Staff"} on ${writtenOn}: ${obs.notes}`
      }
      ).join('\n\n')
      : "No Notes available.";


    if (!isRecording) {
      setLoading(true);
      setError(null);
      try {
        // Get ephemeral key from backend API
        const ephemeralKey = await apiService.getGeminiEphemeralKey();
        recognitionRef.current = startContinuousSpeechRecognition((userText) => {
          setMessages(prev => [...prev, { user: userText, ai: '' }]);
        });

        // Convert OpenAI tool definitions to Gemini tool definitions
        const geminiTools = [
          {
            functionDeclarations: [
              {
                name: "addMedicalNote",
                description: "Help doctor to add a medical note for a patient, ask for note content, detect type from Admission Note, Progress Note, Consultation Note, Operative Note, Procedure Note, Discharge Note / Summary, Emergency Department Note, Transfer Note automatically if possible.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    note: {
                      type: "STRING",
                      description: "Medical observation or note details"
                    },
                    findingType: {
                      type: "STRING",
                      enum: ["Admission Note", "Progress Note", "Consultation Note", "Operative Note", "Procedure Note", "Discharge Note / Summary", "Emergency Department Note", "Transfer Note"],
                      description: "type of the note"
                    },
                  },
                  required: ["note", "findingType"],
                },
              },
              {
                name: "addMedication",
                description: "Add a new medication to the DETAILED PRESCRIPTION LIST in the Medication section. IMPORTANT RULES: 1) ONLY ask for frequency if not mentioned by doctor. 2) Do NOT ask about dosage, route, food timing, or instructions - capture them ONLY if doctor voluntarily provides them. 3) Never ask follow-up questions like 'Could you please confirm the dosage?' or 'How should it be administered?'. After getting medication name (and frequency if needed)",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    medicationName: {
                      type: "STRING",
                      description: "Name of the medication"
                    },
                    dosage: {
                      type: "STRING",
                      description: "Medication dosage (e.g., '25 mg', '500 mcg') - only capture if doctor mentions it, do NOT ask"
                    },
                    frequency: {
                      type: "STRING",
                      enum: ["once-daily-morning", "once-daily-afternoon", "once-daily-evening", "twice-daily", "three-times-daily", "four-times-daily", "every-4-hours", "every-6-hours", "every-8-hours", "prn"],
                      description: "Frequency of medication administration. Map: 'once daily/once a day/OD/morning' -> once-daily-morning (1-0-0), 'once daily afternoon/0-1-0' -> once-daily-afternoon (0-1-0), 'once at night/evening/HS/bedtime' -> once-daily-evening (0-0-1), 'twice daily/BD/BID' -> twice-daily (1-0-1), 'three times daily/TID/TDS' -> three-times-daily (1-1-1), 'four times daily/QID/QDS' -> four-times-daily (1-1-1-1), 'every 4 hours/Q4H' -> every-4-hours, 'every 6 hours/Q6H' -> every-6-hours, 'every 8 hours/Q8H' -> every-8-hours, 'as needed/PRN' -> prn. Ask for this ONLY if not mentioned"
                    },
                    route: {
                      type: "STRING",
                      enum: ["oral", "iv", "im", "sc", "topical", "inhaled", "sublingual", "vaginal"],
                      description: "Route of administration - only capture if doctor mentions it, do NOT ask"
                    },
                    prescribedBy: {
                      type: "STRING",
                      description: "Doctor who prescribed the medication - do NOT ask"
                    },
                    instructions: {
                      type: "STRING",
                      description: "Special instructions for the medication - only capture if doctor mentions them, do NOT ask"
                    },
                    foodTiming: {
                      type: "STRING",
                      enum: ["before-food", "after-food", "before-bed", "with-food"],
                      description: "When to take medicine relative to meals. Automatically map: 'after food/meal' -> after-food, 'before food/meal' -> before-food, 'before bed/at night/bedtime' -> before-bed, 'with food/during meals' -> with-food. Do NOT ask for this, only capture if doctor mentions it."
                    },
                    numberOfDays: {
                      type: "STRING",
                      description: "Duration of medication in days (e.g., '7', '14', '30'). Extract from phrases like 'for 7 days', 'for a week' (7), 'for two weeks' (14), 'for a month' (30). Do NOT ask for this, only capture if doctor mentions it."
                    }
                  },
                  required: ["medicationName"]
                }
              },
              {
                name: "recordVitals",
                description: "Record vital signs for the patient including heart rate, blood pressure, temperature, oxygen saturation, respiratory rate, and pain level,blood glucose, and Glasgow Coma Scale (GCS).",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    heartRate: {
                      type: "STRING",
                      description: "Heart rate in beats per minute, Do not use special characters"
                    },
                    bloodPressureSystolic: {
                      type: "STRING",
                      description: "Systolic blood pressure (e.g., '120'), Do not use special characters"
                    },
                    bloodPressureDiastolic: {
                      type: "STRING",
                      description: "Diastolic blood pressure (e.g., '80'), Do not use special characters"
                    },
                    temperature: {
                      type: "STRING",
                      description: "Body temperature in Celsius, Do not use special characters"
                    },
                    oxygenSaturation: {
                      type: "STRING",
                      description: "Oxygen saturation percentage, Do not use special characters"
                    },
                    respiratoryRate: {
                      type: "STRING",
                      description: "Respiratory rate per minute, Do not use special characters"
                    },
                    painLevel: {
                      type: "STRING",
                      description: "Pain level on scale of 0-10. Do not use special characters"
                    },
                    bloodGlucose: {
                      type: "STRING",
                      description: "Blood glucose level in mg/dL Also known as blood sugar, Do not use special characters"
                    },
                    glasgowComaScale: {
                      type: "STRING",
                      description: "Glasgow Coma Scale score (3-15). Also known as GCS, Do not use special characters"
                    }
                  }
                }
              },
              {
                name: "addLabResult",
                description: "Add a laboratory test for the patient",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    testName: {
                      type: "STRING",
                      description: "Name of the laboratory test (e.g., 'Liver Function Tests', 'CBC', 'CT Brain', 'MRI', 'Blood Glucose')"
                    }
                  },
                  required: ["testName"]
                }
              },
              {
                name: "updateMedicationStatus",
                description: "Update the status of an existing medication (discontinue, hold, activate)",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    medicationName: {
                      type: "STRING",
                      description: "Name of the medication to update"
                    },
                    newStatus: {
                      type: "STRING",
                      enum: ["active", "discontinued", "on-hold"],
                      description: "New status for the medication"
                    },
                    reason: {
                      type: "STRING",
                      description: "Reason for the status change"
                    }
                  },
                  required: ["medicationName", "newStatus"]
                }
              },
              {
                name: "addDischargeNote",
                description: "Add discharge planning notes and instructions for the patient",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    dischargeStatus: {
                      type: "STRING",
                      description: "Patient's discharge status and readiness"
                    },
                    instructions: {
                      type: "STRING",
                      description: "Discharge instructions for patient care"
                    },
                    followUpPlan: {
                      type: "STRING",
                      description: "Follow-up appointment and care plan"
                    },
                    medications: {
                      type: "STRING",
                      description: "Discharge medications and instructions"
                    }
                  },
                  required: ["dischargeStatus", "instructions"]
                }
              },
              {
                name: "updateVisitInformation",
                description: "Update the patient's VISIT INFO / VISIT INFORMATION (symptoms, purpose of visit, history, summary of active medications, etc.) or custom fields. This will open the edit form in the Visit Info section.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    chiefComplaint: { type: "STRING", description: "Patient's primary complaint" },
                    symptoms: { type: "STRING", description: "Current symptoms" },
                    duration: { type: "STRING", description: "Duration of symptoms" },
                    medicalHistory: { type: "STRING", description: "Past medical history" },
                    purposeOfVisit: { type: "STRING", description: "Reason for today's visit" },
                    urgentConcerns: { type: "STRING", description: "Any urgent or red flag concerns" },
                    familySocialHistory: { type: "STRING", description: "Family or social background" },
                    allergy: { type: "STRING", description: "Known allergies" },
                    comorbidity: { type: "STRING", description: "Co-existing medical conditions" },
                    currentMedication: { type: "STRING", description: "A high-level text summary of current active medications for the Visit Info section (e.g. 'Amlodipine 5mg, Metformin 500mg')." },
                    customFields: {
                      type: "OBJECT",
                      description: "Key-value pairs for custom clinical categories (e.g., {'Surgical History': 'None', 'Vitals': 'Stable'}). Use the exact category names provided in context."
                    }
                  }
                }
              }
            ]
          }
        ];

        const systemInstructionsString = `You are eva, an AI-powered health assistant designed to support me in patient care by providing accurate, evidence-based information. Your role is to assist me—not act as a physician—in understanding patient data, suggesting possible treatment approaches based on guidelines, interpreting test results, and monitoring health risks,and record medical notes. Do not introduce yourself or greet at session start—wait for me to speak first.
          Here is the patient's context I need you to assist with:

          Patient Details:
          Name: ${patientData?.title ?? ''} ${patientData?.firstName} ${patientData?.surName}
          Age: ${patientData?.age} years, ${patientData?.gender === "M" ? "male" : "female"}
          Admitted to: ${patientData?.admissionType} (Bed: ${patientData?.bedNumber})
          Admission Date & Time: ${patientData?.admissionDateTime}
          Attending Physician: ${patientData?.assignedPhysician}
          Reason for Admission: ${patientData?.admissionReason}
          Primary Diagnosis: ${patientData?.primaryDiagnosis}
          Secondary Diagnoses: ${patientData?.secondaryDiagnoses}
          Allergies (from record): ${patientData?.allergies}

          Consultation Information:
          • Symptoms: ${symptoms || 'N/A'}
          • Duration: ${duration || 'N/A'}
          • Medical History: ${medicalHistory || 'N/A'}
          • Purpose of Visit: ${purposeOfVisit || 'N/A'}
          • Severity: ${severity || 'N/A'}
          • Urgent Concerns: ${urgentConcerns || 'N/A'}
          • Allergy: ${allergy || 'None recorded'}
          • Comorbidity: ${comorbidity || 'None recorded'}

          Current Vital Signs:${vitalsText}
          Vitals History:${vitalsHistoryString}
          Notes & Observations:${notesObservationsText}
          Detailed Prescription List (Current Medications): ${medicationsText}
          Recent Lab Results:${labResultsText}

          Visit History:
          ${Array.isArray(visitHistory) && visitHistory.length > 0
            ? visitHistory.map((visit, i) => `• Visit ${i + 1}: Dr. ${visit.NetworkTitle || ''} ${visit.NetworkName || ''} on ${visit.VisitedOn || 'Unknown date'}${visit.AISummary ? ` - Summary: ${visit.AISummary}` : ''}`).join('\n')
            : 'No previous visit history available.'}
          
          Summary of Active Medications (from Visit Info): ${currentMedication || 'None recorded'}

          Additional Visit Information (Custom Fields):
          ${(() => {
            const parsed = (() => {
              try { return customCategories ? JSON.parse(customCategories) : []; } catch { return []; }
            })();
            const enabled = enabledCategories || [];
            return enabled.length > 0
              ? enabled.map(cat => {
                const val = parsed.find((p: any) => p.field === cat.field || p.name === cat.name)?.value || 'N/A';
                return `• ${cat.name || cat.field}: ${val}`;
              }).join('\n')
              : 'No custom fields defined.';
          })()}

          MEDICATION TERMINOLOGY & CAPTURE RULES (CRITICAL):
          • "ACTIVE MEDICATIONS": This refers to the high-level summary string in the Visit Info section. Use the 'updateVisitInformation' tool with the 'currentMedication' property for this.
          • "CURRENT MEDICATION" / "NEW MEDICATION": This refers to adding detailed items to the Prescription/Medication section. Use the 'addMedication' tool for this.
          • If I say "The patient's active medications are...", update the Visit Info summary.
          • If I say "Add a current medication...", use the detailed 'addMedication' tool.

          DETAILED MEDICATION PRESCRIPTION RULES (for addMedication tool):
          • When adding a medication to the prescription list, ONLY ask for FREQUENCY if it wasn't already mentioned by the doctor.
          • Do NOT ask about: Dosage, Route/Administration method, Food timing, or Special instructions.
          • If the doctor voluntarily mentions dosage, route, food timing, or instructions, capture them and auto-fill the form.
          • map: 'after food/meal' -> after-food, 'before food/meal' -> before-food, 'before bed/at night/bedtime' -> before-bed, 'with food/during meals' -> with-food.
          • NEVER ask follow-up questions like "Could you please confirm the dosage?".

          Instructions for eva:
          • If the user asks you to "stop," "hold on a minute," "wait," "pause," acknowledge politely, and pause for 10 seconds.
          • Provide evidence-based recommendations, but do not act as a doctor.
          • Assist me in interpreting test results and identifying possible health risks.
          • Help monitor trends in vital signs and observations.
          • RESPONSE BEHAVIOR (CRITICAL):
          • When triggering any function (medication, notes, vitals, lab tests), do NOT speak confirmation messages.
          • Keep responses brief and action-oriented.
          • Only speak when: providing clinical information, asking necessary clarifying questions, or when no UI action is triggered.
          • After a function call succeeds, stay silent.

          Interaction Guidelines:
          Please respond in clear, compassionate, and clinical English tailored to my needs as a physician. Support me by offering information and analysis without making prescriptive or directive medical recommendations.`;

        await startGeminiVoiceAgent(
          ephemeralKey,
          systemInstructionsString,
          geminiTools,
          {
            onTranscript: (text) => {
              // console.log("Transcript:", text);

              setVoiceMode(true)
              setMessages(prev => {
                if (prev.length === 0) return [{ user: '', ai: text }];
                // Update the last message with AI reply
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
    recognition = startContinuousSpeechRecognition((text) => {
      console.log("User said:", text);
    });

    // To stop later:
    recognition.stop();
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
