// ─── Types ───

export interface AmbientAuthPayload {
  session_id: string;
  prompt: string;
  expected_output_json: Record<string, any>;
  need_transcription?: boolean;
  external_api_url?: string;
  user_token?: string;
  api_key?: string;
  subscription_api_key?: string;
}

export interface AmbientConnectedResponse {
  message: string;
  session_id: string;
  has_previous_transcription: boolean;
}

export interface AmbientOutputJsonResponse {
  session_id: string;
  output_json: Record<string, any>;
  timestamp: string;
}

export interface AmbientConnectionClosedResponse {
  session_id: string;
  s3_url: string;
  final_output_json: Record<string, any>;
  timestamp: string;
}

export interface AmbientErrorResponse {
  message: string;
}

export interface AmbientSocketCallbacks {
  onConnected?: (data: AmbientConnectedResponse) => void;
  onDisconnected?: (reason: string) => void;
  onOutputJson?: (data: AmbientOutputJsonResponse) => void;
  onConnectionClosed?: (data: AmbientConnectionClosedResponse) => void;
  onError?: (data: AmbientErrorResponse) => void;
}

const mockMedicalExtraction = {
  transcript: {
    entries: [
      { speaker: "patient", text: "I've been feeling a lot of chest tightness and shortness of breath lately, especially when I walk up stairs." },
      { speaker: "doctor", text: "I see. Any coughing or fever?" },
      { speaker: "patient", text: "No, no fever, but sometimes a dry cough at night." },
      { speaker: "doctor", text: "Okay. We should check your blood pressure and get a chest X-Ray and an ECG. Also, I'll prescribe Pantoprazole 40mg before breakfast and Amoxicillin 250mg twice daily for 5 days." }
    ]
  },
  clinical_data: {
    chiefComplaint: { value: "Chest tightness and shortness of breath" },
    purposeOfVisit: { value: "Evaluation of cardiac/respiratory symptoms" },
    symptoms: { value: "Chest tightness, shortness of breath on exertion, dry night cough" },
    allergy: {
      items: [
        { allergen: "Penicillin", reaction: "Hives and mild swelling" }
      ]
    },
    medicalHistory: { value: "Mild seasonal asthma" },
    urgentConcerns: { value: "Exertional dyspnea" },
    comorbidity: { value: "Hypertension" },
    social_history: {
      socialSmoke: { value: "Non-smoker" },
      socialAlcohol: { value: "Occasional/Social drinker" },
      socialOccupation: { value: "Office Administrator" }
    },
    medication: { value: "Amlodipine 5mg daily" },
    assessment: { value: "Atypical chest pain, rule out cardiac ischemia vs asthma exacerbation" },
    plan: { value: "1. Schedule outpatient ECG\n2. Obtain PA view chest X-Ray\n3. Start trial medications and review in 1 week" },
    prescriptions: {
      items: [
        { name: "Pantoprazole 40mg", dosage: "40mg", frequency: "Once daily before breakfast", duration: "14 days" },
        { name: "Amoxicillin 250mg", dosage: "250mg", frequency: "Twice daily", duration: "5 days" }
      ]
    },
    labOrders: {
      items: [
        { testName: "Electrocardiogram (ECG)", description: "Check for ischemic changes or rhythm issues" },
        { testName: "X-Ray Chest PA View", description: "Rule out pulmonary congestion or infiltration" }
      ]
    }
  }
};

class AmbientSocketService {
  private static instance: AmbientSocketService;
  private connected: boolean = false;
  private callbacks: AmbientSocketCallbacks = {};
  private currentSessionId: string | null = null;

  private constructor() { }

  static getInstance(): AmbientSocketService {
    if (!AmbientSocketService.instance) {
      AmbientSocketService.instance = new AmbientSocketService();
    }
    return AmbientSocketService.instance;
  }

  connect(auth: AmbientAuthPayload, callbacks: AmbientSocketCallbacks): void {
    this.callbacks = callbacks;
    this.currentSessionId = auth.session_id;
    this.connected = true;

    console.log('[AmbientSocket] Connecting to mock ambient stream service...');

    // Simulate connection success event
    setTimeout(() => {
      if (this.connected && this.callbacks.onConnected) {
        this.callbacks.onConnected({
          message: "Mock ambient session initialized",
          session_id: auth.session_id,
          has_previous_transcription: false
        });
      }
    }, 200);
  }

  sendAudioChunk(sessionId: string, audioFile: string | ArrayBuffer, closeConnection: boolean = false): void {
    if (!this.connected) {
      console.error('[AmbientSocket] Cannot emit audio: Mock socket not connected');
      return;
    }

    console.log('[AmbientSocket] Mock received audio chunk',
      closeConnection ? '(FINAL chunk — closing session)' : ''
    );

    if (closeConnection) {
      // Simulate backend AI processing time (e.g. 1.5 seconds)
      setTimeout(() => {
        if (this.connected && this.callbacks.onConnectionClosed) {
          this.callbacks.onConnectionClosed({
            session_id: sessionId,
            s3_url: "https://example.com/mock-audio-recording.webm",
            final_output_json: mockMedicalExtraction,
            timestamp: new Date().toISOString()
          });
        }
        this.disconnect();
      }, 1500);
    }
  }

  disconnect(): void {
    if (this.connected) {
      console.log('[AmbientSocket] Mock stream disconnected');
      this.connected = false;
      if (this.callbacks.onDisconnected) {
        this.callbacks.onDisconnected('io client disconnect');
      }
      this.currentSessionId = null;
    }
  }

  isConnectedStatus(): boolean {
    return this.connected;
  }

  getSessionId(): string | null {
    return this.currentSessionId;
  }
}

export const ambientSocketService = AmbientSocketService.getInstance();