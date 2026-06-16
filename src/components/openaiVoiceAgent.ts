// Core OpenAI Realtime Voice Agent Logic (browser-based, modular, no UI dependency)

type SessionParams = {
  apiKey?: string;
  ephemeralKey?: string;
  model?: string;
  voice?: string;
  tools?: any;
  instructions?: string;
  temperature?: number;
  listenOnly?: boolean; // If true, AI won't produce audio output
};

type VoiceAgentCallbacks = {
  onTranscript?: (text: string) => void;
  onAIOutput?: (text: string) => void;
};
async function createSession({
  apiKey,
  model = "gpt-4o-mini-realtime-preview",
  voice = "coral",
  tools = [],
  instructions = "reply only in English",
}: SessionParams): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
    body: JSON.stringify({
      model,
      voice,
      tools,
      turn_detection: { type: "server_vad" }, // push-to-talk; prevents auto cutoff
      instructions,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Failed to create OpenAI session");
  }
  return data.client_secret.value;
}

let pc: RTCPeerConnection | undefined;
let dc: RTCDataChannel | undefined;
let ms: MediaStream | undefined;
let mediaRecorder: MediaRecorder | undefined;
let audioTrack: MediaStreamTrack | undefined;
let audioEl: HTMLAudioElement | undefined;
let isRecording = false;
let isMuted = false;
let isAiPaused = false;
let audioChunks: Blob[] = [];
function sendEvent(event) {
  if (dc && dc.readyState === 'open') {
    dc.send(JSON.stringify(event));
  }
}

// Store pending function call IDs for completion feedback
const pendingFunctionCalls = new Map<string, string>();

// Send function call completion feedback to AI
function sendFunctionCallOutput(callId: string, output: any) {
  if (!dc || !callId) return;

  const dataToAI = {
    type: "response.function_call_output",
    call_id: callId,
    output: output, // don't stringify, send raw JSON object
  };
  console.log("Sending function call output to AI:", dataToAI);

  dc.send(JSON.stringify(dataToAI));
  // Send tool result back
  sendEvent({
    type: 'conversation.item.create',
    item: {
      type: 'function_call_output',
      call_id: callId,
      output: JSON.stringify(dataToAI.output)
    }
  });

  // Trigger response
  sendEvent({ type: 'response.create' });

}

// Setup completion event listeners
function setupCompletionListeners() {
  // Medicine selection completion (from overlay) - receives FULL API data
  document.addEventListener('medicine-selection-complete', (event: any) => {
    const { callId, success, medicine, originalQuery, apiData, error } = event.detail;

    // Check for unified lookupMedicine function call
    const lookupMedicineCallId = pendingFunctionCalls.get('lookupMedicine');

    const matchedCallId = callId && (
      pendingFunctionCalls.has(callId) ||
      lookupMedicineCallId === callId
    );

    if (matchedCallId) {
      if (success && apiData) {
        // Build a rich response message for the AI based on actual API data
        let message = `Medicine: ${medicine}`;

        if (apiData.stock !== undefined) {
          message += `\nStock: ${apiData.stock} units ${apiData.stock > 0 ? '(In Stock)' : '(Out of Stock)'}`;
        }
        if (apiData.mrp !== undefined) {
          message += `\nMRP: ₹${apiData.mrp.toFixed(2)}`;
        }
        if (apiData.composition) {
          message += `\nComposition: ${apiData.composition}`;
        }
        if (apiData.alternatives && apiData.alternatives.length > 0) {
          message += `\nAlternatives available: ${apiData.alternatives.map((a: any) => `${a.name} (Stock: ${a.stock}, ₹${a.mrp})`).join(', ')}`;
        }

        sendFunctionCallOutput(callId, {
          success: true,
          selectedMedicine: medicine,
          originalQuery: originalQuery,
          stock: apiData.stock,
          mrp: apiData.mrp,
          composition: apiData.composition,
          inStock: apiData.inStock,
          alternatives: apiData.alternatives,
          message: message
        });
      } else {
        // Handle error case
        sendFunctionCallOutput(callId, {
          success: false,
          selectedMedicine: medicine,
          originalQuery: originalQuery,
          message: error || `Failed to fetch details for ${medicine}`
        });
      }

      // Clean up
      pendingFunctionCalls.delete('lookupMedicine');
      pendingFunctionCalls.delete(callId);
    }
  });

  // Note completion
  document.addEventListener('ai-note-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('addMedicalNote');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Medical note added successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('addMedicalNote');
    }
  });

  // Medication completion
  document.addEventListener('ai-medication-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('addMedication');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Medication added successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('addMedication');
    }
  });

  // Vitals completion
  document.addEventListener('ai-vitals-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('recordVitals');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Vitals recorded successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('recordVitals');
    }
  });

  // Lab result completion
  document.addEventListener('ai-lab-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('addLabResult');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Lab result added successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('addLabResult');
    }
  });

  // Medication update completion
  document.addEventListener('ai-medication-update-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('updateMedicationStatus');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Medication status updated successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('updateMedicationStatus');
    }
  });

  // Discharge note completion
  document.addEventListener('ai-discharge-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('addDischargeNote');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Discharge note added successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('addDischargeNote');
    }
  });
  
  // Visit Information completion
  document.addEventListener('ai-visit-information-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('updateVisitInformation');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Visit information updated successfully",
        data: event.detail
      });
      pendingFunctionCalls.delete('updateVisitInformation');
    }
  });



  // Pharmacy-specific completion listeners
  // Unified medicine lookup completion listener
  document.addEventListener('ai-medicine-lookup-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('lookupMedicine');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Medicine lookup completed",
        data: event.detail
      });
      pendingFunctionCalls.delete('lookupMedicine');
    }
  });


  document.addEventListener('ai-low-stock-alert-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('getLowStockAlert');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Low stock alert generated",
        data: event.detail
      });
      pendingFunctionCalls.delete('getLowStockAlert');
    }
  });

  // Doctor Assistant completion listeners
  document.addEventListener('doctor-assistant-update-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('update_clinical_data');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Clinical data updated",
        data: event.detail
      });
      pendingFunctionCalls.delete('update_clinical_data');
    }
  });

  document.addEventListener('doctor-assistant-transcript-completed', (event: any) => {
    const callId = pendingFunctionCalls.get('add_transcript');
    if (callId) {
      sendFunctionCallOutput(callId, {
        success: true,
        message: "Transcript added",
        data: event.detail
      });
      pendingFunctionCalls.delete('add_transcript');
    }
  });

}
async function setupVAD(stream: MediaStream) {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  let silenceStart = Date.now();
  const SILENCE_THRESHOLD = 0.01; // adjust
  const SILENCE_DURATION = 1000;  // ms

  function checkSilence() {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);

    if (rms < SILENCE_THRESHOLD) {
      if (Date.now() - silenceStart > SILENCE_DURATION) {
        dc?.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        dc?.send(JSON.stringify({ type: "response.create" }));
        silenceStart = Date.now(); // reset
      }
    } else {
      silenceStart = Date.now(); // reset on speech
    }

    requestAnimationFrame(checkSilence);
  }

  checkSilence();
}

export async function startVoiceAgent({
  apiKey,
  ephemeralKey,
  model = "gpt-4o-mini-realtime-preview",
  voice = "coral",
  tools = [],
  instructions = "reply only in English",
  temperature = 0,
  listenOnly = false,
}: SessionParams, callbacks?: VoiceAgentCallbacks): Promise<boolean | void> {
  if (isRecording) return console.warn("Already recording.");
  isRecording = true;

  // Setup event listeners for function call completion feedback
  setupCompletionListeners();

  audioChunks = [];

  // Use provided ephemeralKey OR create session with apiKey
  let sessionKey: string;
  if (ephemeralKey) {
    sessionKey = ephemeralKey;
  } else if (apiKey) {
    sessionKey = await createSession({
      apiKey,
      model,
      tools,
      voice,
      instructions,
    });
  } else {
    throw new Error("Either ephemeralKey or apiKey must be provided");
  }

  pc = new RTCPeerConnection();
  ms = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioTrack = ms.getTracks()[0];
  pc.addTrack(audioTrack);

  // Play the Assistant's audio output (received over WebRTC) - skip if listen-only mode
  if (!listenOnly) {
    audioEl = new Audio();
    audioEl.autoplay = true;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };
  }

  // Model's events and transcript via RTCDataChannel
  dc = pc.createDataChannel("oai-events");
  dc.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      // Ignore audio/text deltas when AI is paused
      if (isAiPaused && (
        msg.type === "response.audio_transcript.delta" ||
        msg.type === "response.audio.delta" ||
        msg.type === "transcript.delta" ||
        msg.type === "response.output_text.delta"
      )) {
        return;
      }

      if (msg.type === "response.function_call_arguments.done") {
        // Skip all tool calls when muted — prevents hallucinated data from buffered audio
        if (isMuted) {
          console.log("[Muted] Ignoring tool call while muted:", msg.name);
          // Still send a no-op response so the model doesn't hang
          if (msg.call_id) {
            sendFunctionCallOutput(msg.call_id, { success: true, message: "Ignored - microphone is muted" });
          }
          return;
        }
        console.log(JSON.stringify(msg));

        // Mute AI when a relevant tool call is triggered (exclude scribe tools)
        const scribeTools = ['update_clinical_data', 'add_transcript'];
        if (msg.name && !scribeTools.includes(msg.name)) {
          pauseAI();
        }

        // Store call_id for completion feedback
        if (msg.call_id && msg.name) {
          pendingFunctionCalls.set(msg.name, msg.call_id);
        }

        try {
          const aiData = JSON.parse(msg.arguments);

          if (msg.name == "addMedicalNote") {
            const event = new CustomEvent('ai-note-requested', {
              detail: {
                note: aiData.note,
                findingType: aiData.findingType,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "addMedication") {
            const event = new CustomEvent('ai-medication-requested', {
              detail: {
                medicationName: aiData.medicationName,
                dosage: aiData.dosage,
                frequency: aiData.frequency,
                route: aiData.route,
                prescribedBy: aiData.prescribedBy,
                instructions: aiData.instructions,
                callId: msg.call_id,
                numberOfDays: aiData.numberOfDays,
                foodTiming: aiData.foodTiming
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "recordVitals") {
            const event = new CustomEvent('ai-vitals-requested', {
              detail: {
                heartRate: aiData.heartRate,
                bloodPressureSystolic: aiData.bloodPressureSystolic,
                bloodPressureDiastolic: aiData.bloodPressureDiastolic,
                temperature: aiData.temperature,
                oxygenSaturation: aiData.oxygenSaturation,
                respiratoryRate: aiData.respiratoryRate,
                painLevel: aiData.painLevel,
                bloodGlucose: aiData.bloodGlucose,
                glasgowComaScale: aiData.glasgowComaScale,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "addLabResult") {
            const event = new CustomEvent('ai-lab-requested', {
              detail: {
                testName: aiData.testName,
                value: aiData.value,
                unit: aiData.unit,
                normalRange: aiData.normalRange,
                status: aiData.status,
                orderedBy: aiData.orderedBy,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "updateMedicationStatus") {
            const event = new CustomEvent('ai-medication-update-requested', {
              detail: {
                medicationName: aiData.medicationName,
                newStatus: aiData.newStatus,
                reason: aiData.reason,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "addDischargeNote") {
            const event = new CustomEvent('ai-discharge-note-requested', {
              detail: {
                dischargeStatus: aiData.dischargeStatus,
                instructions: aiData.instructions,
                followUpPlan: aiData.followUpPlan,
                medications: aiData.medications,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }
          
          else if (msg.name == "updateVisitInformation") {
            const event = new CustomEvent('ai-visit-information-requested', {
              detail: {
                chiefComplaint: aiData.chiefComplaint,
                symptoms: aiData.symptoms,
                duration: aiData.duration,
                medicalHistory: aiData.medicalHistory,
                purposeOfVisit: aiData.purposeOfVisit,
                urgentConcerns: aiData.urgentConcerns,
                familySocialHistory: aiData.familySocialHistory,
                allergy: aiData.allergy,
                comorbidity: aiData.comorbidity,
                customFields: aiData.customFields,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }



          // Unified medicine lookup function call
          else if (msg.name == "lookupMedicine") {
            // Dispatch unified event for medicine lookup (search, stock check, details)
            const event = new CustomEvent('ai-medicine-lookup-requested', {
              detail: {
                medicineName: aiData.medicineName,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
            // Don't send feedback yet - wait for user selection from overlay
          }

          else if (msg.name == "getLowStockAlert") {
            const event = new CustomEvent('ai-low-stock-alert-requested', {
              detail: {
                searchQuery: aiData.searchQuery,
                category: aiData.category,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          // Doctor Assistant tool calls
          else if (msg.name == "update_clinical_data") {
            const event = new CustomEvent('doctor-assistant-update-requested', {
              detail: {
                field: aiData.field,
                value: aiData.value,
                allergyReaction: aiData.allergyReaction,
                medicationDose: aiData.medicationDose,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

          else if (msg.name == "add_transcript") {
            const event = new CustomEvent('doctor-assistant-transcript-requested', {
              detail: {
                text: aiData.text,
                speaker: aiData.speaker,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          }

        } catch (error) {
          console.error('Failed to parse AI arguments:', error);
          // Send error feedback to AI if we have a call_id
          if (msg.call_id) {
            sendFunctionCallOutput(msg.call_id, {
              success: false,
              error: "Failed to parse function arguments",
              message: error.message
            });
          }
        }
      }
      if (msg.type?.includes("delta") || msg.type?.includes("done")) {
        // console.log(
        //   "[Model delta]:", msg.delta,"type:",msg.type
        // );
      }
      if (msg.type === "response.audio_transcript.delta") {
        callbacks?.onTranscript?.(msg.delta);
      } else
        if (msg.type === "transcript.delta") {
          callbacks?.onTranscript?.(msg.delta);
        } else if (msg.type === "transcript.completed") {
          console.log("[User Said]:", msg.transcript);
          callbacks?.onTranscript?.(msg.transcript);
        } else if (msg.type === "response.output_text.delta") {
          callbacks?.onTranscript?.(msg.delta);
        }
        else if (msg.type === "response.audio_transcript.done") {
          console.log(
            "[Model Transcript done]:", msg.transcript
          );
          callbacks?.onTranscript?.(msg.transcript);
        }
    } catch (err) {
      console.error("Failed to parse message:", event.data);
    }
  };

  // Capture microphone audio for download/debug
  try {
    mediaRecorder = new MediaRecorder(ms, {
      mimeType: "audio/webm;codecs=opus",
    });
  } catch {
    mediaRecorder = new MediaRecorder(ms!);
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.start();

  // Send session.update when data channel opens to configure tools and instructions
  dc.onopen = () => {
    console.log("Data channel opened, sending session.update with tools:", tools.length);
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: instructions,
        voice: voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.8,
          prefix_padding_ms: 500,
          silence_duration_ms: 1000
        },
        tools: tools,
        tool_choice: "auto",
        temperature: 0.6
      }
    };
    dc!.send(JSON.stringify(sessionUpdate));
  };

  // WebRTC SDP setup
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpRes = await fetch(
    `https://api.openai.com/v1/realtime?model=${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionKey}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    },
  );
  const answer = { type: "answer" as RTCSdpType, sdp: await sdpRes.text() };
  await pc.setRemoteDescription(answer);

  return true;
}

export async function stopVoiceAgent() {
  if (audioTrack) {
    audioTrack.stop();
    isRecording = false;
  }

  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  } else {
    console.log("No audio element found!");
  }
}
export function startContinuousSpeechRecognition(
  onTranscript: (text: string) => void
) {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    throw new Error("SpeechRecognition not supported");
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = true;

  recognition.onresult = (event: any) => {
    const last = event.results.length - 1;
    const userText = event.results[last][0].transcript;
    onTranscript(userText); // callback on each result

  };

  recognition.onerror = (event: any) => {
    console.error("SpeechRecognition Error:", event.error);
  };

  recognition.start();
  return recognition; // return instance so you can stop it
}

// Mute/unmute microphone
export function muteVoiceAgent(): boolean {
  if (audioTrack) {
    audioTrack.enabled = false;
    isMuted = true;
    // Clear any buffered audio and cancel pending AI responses to prevent hallucination
    if (dc && dc.readyState === 'open') {
      sendEvent({ type: 'input_audio_buffer.clear' });
      sendEvent({ type: 'response.cancel' });
    }
    return true;
  }
  return false;
}

export function unmuteVoiceAgent(): boolean {
  if (audioTrack) {
    audioTrack.enabled = true;
    isMuted = false;
    return true;
  }
  return false;
}

export function isVoiceAgentMuted(): boolean {
  return isMuted;
}

// Mute/unmute the AI's audio output (speaker)
export function muteAudioOutput(): boolean {
  if (audioEl) {
    audioEl.muted = true;
    return true;
  }
  return false;
}

export function unmuteAudioOutput(): boolean {
  if (audioEl) {
    audioEl.muted = false;
    return true;
  }
  return false;
}

// Pause/Resume AI interaction (interruption + muting)
export function pauseAI() {
  console.log("Pausing AI voice agent...");
  isAiPaused = true;
  muteVoiceAgent();
  muteAudioOutput();

  // Immediately cancel any ongoing AI response
  sendEvent({ type: 'response.cancel' });
}

export function resumeAI() {
  console.log("Resuming AI voice agent...");
  isAiPaused = false;
  unmuteVoiceAgent();
  unmuteAudioOutput();
}

export function isAIPaused(): boolean {
  return isAiPaused;
}

// Make the AI speak a specific message
export function speakMessage(message: string): boolean {
  if (!dc || dc.readyState !== 'open') {
    console.warn('Data channel not open, cannot send message');
    return false;
  }

  // Create a user message item with the instruction to speak
  sendEvent({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{
        type: 'input_text',
        text: `[SYSTEM: Speak exactly this message to the user: "${message}"]`
      }]
    }
  });

  // Trigger AI response
  sendEvent({ type: 'response.create' });

  return true;
}

// ==========================================
// GEMINI REALTIME WEBSOCKET IMPLEMENTATION
// ==========================================

let geminiSocket: WebSocket | null = null;
let geminiAudioCtx: AudioContext | null = null;
let geminiStream: MediaStream | null = null;
let geminiProcessor: ScriptProcessorNode | null = null;
let geminiIsRecording = false;
let geminiIsSetupComplete = false;

// Convert Float32Array to 16kHz PCM Int16
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

// Convert Int16Array back to Float32Array for AudioBuffer playback
function int16ToFloat32(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const int = input[i];
    const float = (int >= 0) ? int / 32767.0 : int / 32768.0;
    output[i] = float;
  }
  return output;
}

// Buffer to store and play back 24kHz audio from Gemini
let audioPlayStartTime = 0;
function playGeminiAudioFrame(base64Data: string, sampleRate = 24000) {
  if (!geminiAudioCtx) return;

  const binaryString = window.atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const pcm16Data = new Int16Array(bytes.buffer);
  const float32Data = int16ToFloat32(pcm16Data);

  const audioBuffer = geminiAudioCtx.createBuffer(1, float32Data.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Data);

  const source = geminiAudioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(geminiAudioCtx.destination);

  const currentTime = geminiAudioCtx.currentTime;
  if (audioPlayStartTime < currentTime) {
    audioPlayStartTime = currentTime;
  }
  source.start(audioPlayStartTime);
  audioPlayStartTime += audioBuffer.duration;
}

export async function startGeminiVoiceAgent(
  ephemeralKey: string,
  systemInstructions: string,
  tools: any[],
  callbacks?: VoiceAgentCallbacks,
  listenOnly: boolean = false
): Promise<boolean> {
  if (geminiIsRecording) return false;
  geminiIsRecording = true;

  // Connect to Gemini WebSocket
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${ephemeralKey}`;
  geminiSocket = new WebSocket(wsUrl);

  geminiSocket.onopen = async () => {
    console.log("Gemini WebSocket connected.");    // Initial Setup Message
    const setupMessage = {
      setup: {
        model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
        systemInstruction: {
          parts: [{ text: systemInstructions }]
        },
        tools: tools,
        generationConfig: {
          responseModalities: ["AUDIO"],
          temperature: 0.1,
          topP: 0.8,
          topK: 40
        }
      }
    };

    geminiSocket?.send(JSON.stringify(setupMessage));

    // Wait slightly to let setup process
    setTimeout(async () => {
      // Setup Audio Capture
      geminiAudioCtx = new AudioContext({ sampleRate: 16000 });
      audioPlayStartTime = geminiAudioCtx.currentTime;
      geminiStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = geminiAudioCtx.createMediaStreamSource(geminiStream);
      // Reduce buffer size to 2048 to process shorter audio chunks and decrease transcription latency.
      geminiProcessor = geminiAudioCtx.createScriptProcessor(2048, 1, 1);

      // IMPORTANT: Do NOT connect the processor to destination yet. We must wait for setupComplete to avoid 1011 error.
      // We attach the stream processor logic here, but it only fires if `isSetupComplete` is true.

      geminiProcessor.onaudioprocess = (e) => {
        // Wait until `setupComplete` has been received in handleGeminiMessage
        // We track this with a global flag defined near geminiIsRecording
        if (!geminiIsRecording || !geminiIsSetupComplete || !geminiSocket || geminiSocket.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = floatTo16BitPCM(inputData);
        // Base64 encode
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        bytes.forEach((b) => binary += String.fromCharCode(b));
        const base64Audio = window.btoa(binary);

        const msg = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }]
          }
        };
        geminiSocket.send(JSON.stringify(msg));
        // console.log("➡️ [MIC] Sent 16kHz audio chunk to Gemini");
      };

      source.connect(geminiProcessor);
      geminiProcessor.connect(geminiAudioCtx.destination);
    }, 500);
  };

  geminiSocket.onmessage = (event) => {
    // Handling Blob from Gemini
    if (event.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const str = reader.result as string;
          const msg = JSON.parse(str);
          handleGeminiMessage(msg, callbacks, listenOnly);
        } catch (e) { }
      };
      reader.readAsText(event.data);
    } else {
      try {
        const msg = JSON.parse(event.data);
        handleGeminiMessage(msg, callbacks, listenOnly);
      } catch (e) { }
    }
  };

  geminiSocket.onerror = (err) => console.error("Gemini WebSocket Error:", err);
  geminiSocket.onclose = (event) => {
    console.log("Gemini WebSocket closed. Code:", event.code, "Reason:", event.reason);
    stopGeminiVoiceAgent();
  };

  return true;
}

function handleGeminiMessage(msg: any, callbacks?: VoiceAgentCallbacks, listenOnly: boolean = false) {
  // To avoid spam, we won't log raw audio bytes, but we'll log everything else
  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
    console.log("⬅️ [GEMINI RESPONSE PARTS]:", msg.serverContent.modelTurn.parts.map(p => Object.keys(p)));
  } else {
    // These are usually just turnComplete signals or token usage metadata, not actual errors.
    console.log("⬅️ [GEMINI SYSTEM MSG]:", msg);
  }

  if (msg.setupComplete) {
    console.log("✅ Gemini Setup Complete!", msg.setupComplete);
    geminiIsSetupComplete = true;
  }
  if (msg.error) {
    console.error("Gemini API Error:", msg.error);
    callbacks?.onTranscript?.(`Gemini Error: ${msg.error.message || JSON.stringify(msg.error)}`);
  }

  if (msg.serverContent) {
    const modelTurn = msg.serverContent.modelTurn;
    if (modelTurn && modelTurn.parts) {
      for (const part of modelTurn.parts) {
        // Audio output
        if (!listenOnly && part.inlineData && part.inlineData.mimeType?.startsWith("audio/pcm")) {
          playGeminiAudioFrame(part.inlineData.data, 24000);
        }
        // Text transcript output
        if (part.text) {
          callbacks?.onTranscript?.(part.text);
        }
      }
    }
  }

  // Handle Tool Calls (in Gemini Realtime, these come as msg.toolCall, not inside msg.serverContent)
  if (msg.toolCall && msg.toolCall.functionCalls) {
    for (const fn of msg.toolCall.functionCalls) {
      console.log("Gemini Function Call:", fn);
      const aiData = fn.args || {};
      let eventName = '';

      if (fn.name === "addMedicalNote") eventName = 'ai-note-requested';
      else if (fn.name === "addMedication") eventName = 'ai-medication-requested';
      else if (fn.name === "recordVitals") eventName = 'ai-vitals-requested';
      else if (fn.name === "addLabResult") eventName = 'ai-lab-requested';
      else if (fn.name === "updateMedicationStatus") eventName = 'ai-medication-update-requested';
      else if (fn.name === "addDischargeNote") eventName = 'ai-discharge-note-requested';
      else if (fn.name === "lookupMedicine") eventName = 'ai-medicine-lookup-requested';
      else if (fn.name === "getLowStockAlert") eventName = 'ai-low-stock-alert-requested';
      else if (fn.name === "update_clinical_data") eventName = 'doctor-assistant-update-requested';
      else if (fn.name === "add_transcript") eventName = 'doctor-assistant-transcript-requested';
      else if (fn.name === "updateVisitInformation") eventName = 'ai-visit-information-requested';

      if (eventName) {
        // Construct the expected payload exactly as the OpenAI implementation did
        const payload = { ...aiData };
        if (fn.id) {
          payload.callId = fn.id;
          pendingFunctionCalls.set(fn.name, fn.id);
        }

        const e = new CustomEvent(eventName, { detail: payload });
        document.dispatchEvent(e);

        // Immediately respond to Gemini so it doesnt hang
        if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
          geminiSocket.send(JSON.stringify({
            toolResponse: {
              functionResponses: [
                {
                  id: fn.id,
                  name: fn.name,
                  response: { result: "Success: Action dispatched to UI." }
                }
              ]
            }
          }));
        }
      }
    }
  }
}

export function stopGeminiVoiceAgent() {
  geminiIsRecording = false;
  geminiIsSetupComplete = false;
  if (geminiProcessor) {
    geminiProcessor.disconnect();
    geminiProcessor = null;
  }
  if (geminiStream) {
    geminiStream.getTracks().forEach(t => t.stop());
    geminiStream = null;
  }
  if (geminiAudioCtx) {
    geminiAudioCtx.close();
    geminiAudioCtx = null;
  }
  if (geminiSocket) {
    geminiSocket.close();
    geminiSocket = null;
  }
}
