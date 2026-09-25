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
  // Bank app: query_table responses are handled directly via sendGeminiFunctionCallOutput
  // No additional completion listeners needed
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

        // Pause AI when a tool call is triggered
        if (msg.name) {
          pauseAI();
        }

        // Store call_id for completion feedback
        if (msg.call_id && msg.name) {
          pendingFunctionCalls.set(msg.name, msg.call_id);
        }

        try {
          const aiData = JSON.parse(msg.arguments);

          if (msg.name == "query_table") {
            const event = new CustomEvent('ai-query-table-requested', {
              detail: {
                sqlite_query: aiData.sqlite_query,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          } else if (msg.name == "web_search") {
            const event = new CustomEvent('ai-web-search-requested', {
              detail: {
                query: aiData.query,
                deal_id: aiData.deal_id,
                callId: msg.call_id
              }
            });
            document.dispatchEvent(event);
          } else if (msg.name == "update_facility_info") {
            const event = new CustomEvent('ai-update-facility-info-requested', {
              detail: {
                ACBS_Facility_Number: aiData.ACBS_Facility_Number,
                updates_json: aiData.updates_json,
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
let geminiProcessor: any = null;
let geminiIsRecording = false;
let geminiIsSetupComplete = false;

const VOICE_IDLE_MS = 5 * 60 * 1000;
let lastVoiceActivityAt = Date.now();
let voiceIdleCheckInterval: ReturnType<typeof setInterval> | null = null;
let voiceIdlePaused = false;

export function touchVoiceAgentActivity() {
  lastVoiceActivityAt = Date.now();
}

export function setVoiceIdlePaused(paused: boolean) {
  voiceIdlePaused = paused;
  if (paused) touchVoiceAgentActivity();
}

let modalOutcomeHandler: ((e: Event) => void) | null = null;

export function sendGeminiSilentContextUpdate(text: string) {
  if (!geminiSocket || geminiSocket.readyState !== WebSocket.OPEN || !geminiIsRecording) return;

  touchVoiceAgentActivity();
  geminiSocket.send(
    JSON.stringify({
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text: `[MODAL_OUTCOME] ${text}` }],
          },
        ],
        turnComplete: true,
      },
    })
  );
}

function attachModalOutcomeListener() {
  if (modalOutcomeHandler) return;
  modalOutcomeHandler = (e: Event) => {
    const message = (e as CustomEvent).detail?.message;
    if (message) sendGeminiSilentContextUpdate(message);
  };
  document.addEventListener('ai-deal-modal-outcome', modalOutcomeHandler);
}

function detachModalOutcomeListener() {
  if (!modalOutcomeHandler) return;
  document.removeEventListener('ai-deal-modal-outcome', modalOutcomeHandler);
  modalOutcomeHandler = null;
}

function startVoiceIdleMonitor() {
  stopVoiceIdleMonitor();
  touchVoiceAgentActivity();
  voiceIdleCheckInterval = setInterval(() => {
    if (!geminiIsRecording || voiceIdlePaused) return;
    if (Date.now() - lastVoiceActivityAt < VOICE_IDLE_MS) return;

    console.log('Voice agent idle timeout reached — stopping session.');
    stopGeminiVoiceAgent();
    document.dispatchEvent(new CustomEvent('voice-agent-idle-timeout'));
  }, 30_000);
}

function stopVoiceIdleMonitor() {
  if (voiceIdleCheckInterval) {
    clearInterval(voiceIdleCheckInterval);
    voiceIdleCheckInterval = null;
  }
}

function recordVoiceInteraction(msg: any) {
  if (msg.toolCall) {
    touchVoiceAgentActivity();
    return;
  }

  const serverContent = msg.serverContent;
  if (!serverContent) return;

  if (serverContent.inputTranscription?.text) {
    touchVoiceAgentActivity();
  }
  if (serverContent.userTurn) {
    touchVoiceAgentActivity();
  }

  const parts = serverContent.modelTurn?.parts;
  if (parts?.some((part: { text?: string }) => part.text)) {
    touchVoiceAgentActivity();
  }
}

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
let activeAudioSources: AudioBufferSourceNode[] = [];

export function clearGeminiAudioQueue() {
  if (geminiAudioCtx) {
    audioPlayStartTime = geminiAudioCtx.currentTime;
  }
  activeAudioSources.forEach(s => {
    try { s.stop(); } catch(e) {}
  });
  activeAudioSources = [];
}
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

  source.onended = () => {
    activeAudioSources = activeAudioSources.filter(s => s !== source);
  };
  activeAudioSources.push(source);

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
  modelName: string = "models/gemini-2.5-flash-native-audio-preview-12-2025",
  callbacks?: VoiceAgentCallbacks,
  listenOnly: boolean = false
): Promise<boolean> {
  if (geminiIsRecording) return false;
  geminiIsRecording = true;
  currentTurnText = "";
  if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
  startVoiceIdleMonitor();
  attachModalOutcomeListener();

  // Connect to Gemini WebSocket
  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?access_token=${ephemeralKey}`;
  geminiSocket = new WebSocket(wsUrl);

  geminiSocket.onopen = async () => {
    console.log("Gemini WebSocket connected.");    // Initial Setup Message
    const setupMessage = {
      setup: {
        model: modelName,
        systemInstruction: {
          parts: [{ text: systemInstructions }]
        },
        tools: tools,
        generationConfig: {
          responseModalities: ["AUDIO"],
          // Pin the voice; without this we inherit whatever default the current
          // model ships with, which changes when the backend swaps models.
          // Feminine: Aoede, Kore, Leda, Zephyr. Masculine: Puck, Charon, Fenrir, Orus.
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          },
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
      
      // Construct absolute worklet URL based on window.location.pathname to avoid relative resolution from /assets/ JS bundle path
      const workletUrl = `https://innov-dev.beta.injomo.com/bank-agents/dist/audio-processor.js`;
      await geminiAudioCtx.audioWorklet.addModule(workletUrl);

      // Instantiate the custom worklet node
      geminiProcessor = new AudioWorkletNode(geminiAudioCtx, 'gemini-audio-processor');

      geminiProcessor.port.onmessage = (event: MessageEvent) => {
        // Wait until `setupComplete` has been received in handleGeminiMessage
        // We track this with a global flag defined near geminiIsRecording
        if (!geminiIsRecording || !geminiIsSetupComplete || !geminiSocket || geminiSocket.readyState !== WebSocket.OPEN) return;
        const inputData = event.data;
        const pcm16 = floatTo16BitPCM(inputData);
        // Base64 encode
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        bytes.forEach((b) => binary += String.fromCharCode(b));
        const base64Audio = window.btoa(binary);

        const mediaMessage = {
          realtimeInput: {
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }
          }
        };
        geminiSocket?.send(JSON.stringify(mediaMessage));
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

let currentTurnText = "";
let turnCompleteTimeout: any = null;

function handleGeminiMessage(msg: any, callbacks?: VoiceAgentCallbacks, listenOnly: boolean = false) {
  recordVoiceInteraction(msg);
  // To avoid spam, we won't log raw audio bytes, but we'll log everything else
  if (msg.serverContent && msg.serverContent.modelTurn && msg.serverContent.modelTurn.parts) {
    console.log("⬅️ [GEMINI RESPONSE PARTS]:", msg.serverContent.modelTurn.parts.map((p: any) => Object.keys(p)));
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
    if (msg.serverContent.interrupted) {
      console.log("🛑 User interrupted Gemini. Clearing audio queue...");
      clearGeminiAudioQueue();
    }

    const modelTurn = msg.serverContent.modelTurn;
    if (modelTurn && modelTurn.parts) {
      for (const part of modelTurn.parts) {
        // Audio output
        if (!listenOnly && part.inlineData && part.inlineData.mimeType?.startsWith("audio/pcm")) {
          playGeminiAudioFrame(part.inlineData.data, 24000);
        }
        // Text transcript output / Audio fallback transcript
        if (part.text) {
          currentTurnText += part.text;
        } else if (part.inlineData && !currentTurnText) {
          currentTurnText = "Voice response received (Audio)";
        }
        
        if (currentTurnText) {
          callbacks?.onTranscript?.(currentTurnText);

          if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
          turnCompleteTimeout = setTimeout(() => {
            if (currentTurnText) {
              console.log("✅ Gemini Turn Complete (timeout fallback). Full text:", currentTurnText);
              callbacks?.onAIOutput?.(currentTurnText);
              currentTurnText = "";
            }
          }, 1500);
        }
      }
    }

    if (msg.serverContent.turnComplete || msg.turnComplete) {
      if (turnCompleteTimeout) clearTimeout(turnCompleteTimeout);
      if (currentTurnText) {
        console.log("✅ Gemini Turn Complete (signal). Full text:", currentTurnText);
        callbacks?.onAIOutput?.(currentTurnText);
        currentTurnText = "";
      }
    }
  }

  // Handle Tool Calls (in Gemini Realtime, these come as msg.toolCall, not inside msg.serverContent)
  if (msg.toolCall && msg.toolCall.functionCalls) {
    for (const fn of msg.toolCall.functionCalls) {
      console.log("Gemini Function Call:", fn);
      const aiData = fn.args || {};
      let eventName = '';

      if (fn.name === "query_table") eventName = 'ai-query-table-requested';
      if (fn.name === "web_search") eventName = 'ai-web-search-requested';
      if (fn.name === "create_deal_note") eventName = 'ai-create-deal-note-requested';
      if (fn.name === "manage_deal_modals") eventName = 'ai-manage-deal-modals';
      if (fn.name === "update_facility_info") eventName = 'ai-update-facility-info-requested';

      if (eventName) {
        // Construct the expected payload exactly as the OpenAI implementation did
        const payload = { ...aiData };
        if (fn.id) {
          payload.callId = fn.id;
          pendingFunctionCalls.set(fn.name, fn.id);
        }

        const e = new CustomEvent(eventName, { detail: payload });
        document.dispatchEvent(e);

        if (fn.name === "manage_deal_modals" && fn.id && geminiSocket?.readyState === WebSocket.OPEN) {
          geminiSocket.send(JSON.stringify({
            toolResponse: {
              functionResponses: [
                {
                  id: fn.id,
                  name: fn.name,
                  response: { result: JSON.stringify({ success: true, action: aiData.action }) },
                  scheduling: 'SILENT',
                }
              ]
            }
          }));
          continue;
        }

        // Immediately respond to Gemini so it doesnt hang (except for async queries)
        if (
          fn.name !== "query_table" &&
          fn.name !== "web_search" &&
          fn.name !== "create_deal_note" &&
          fn.name !== "manage_deal_modals" &&
          geminiSocket &&
          geminiSocket.readyState === WebSocket.OPEN
        ) {
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

export function sendGeminiFunctionCallOutput(
  callId: string,
  name: string,
  output: any,
  options?: { scheduling?: 'INTERRUPT' | 'WHEN_IDLE' | 'SILENT' }
) {
  if (!geminiSocket || geminiSocket.readyState !== WebSocket.OPEN) return;

  const functionResponse: Record<string, unknown> = {
    id: callId,
    name: name,
    response: output,
  };

  if (options?.scheduling) {
    functionResponse.scheduling = options.scheduling;
  }

  const responseMsg = {
    toolResponse: {
      functionResponses: [functionResponse],
    },
  };
  console.log("Sending Gemini function call output:", responseMsg);
  touchVoiceAgentActivity();
  geminiSocket.send(JSON.stringify(responseMsg));
}

export function stopGeminiVoiceAgent() {
  geminiIsRecording = false;
  geminiIsSetupComplete = false;
  stopVoiceIdleMonitor();
  detachModalOutcomeListener();
  if (geminiProcessor) {
    geminiProcessor.disconnect();
    geminiProcessor = null;
  }
  if (geminiStream) {
    geminiStream.getTracks().forEach(t => t.stop());
    geminiStream = null;
  }
  clearGeminiAudioQueue();
  if (geminiAudioCtx) {
    geminiAudioCtx.close();
    geminiAudioCtx = null;
  }
  if (geminiSocket) {
    geminiSocket.close();
    geminiSocket = null;
  }
}
