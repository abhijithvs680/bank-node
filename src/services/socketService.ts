export interface PatientDataUpdatePayload {
  _type: 'patientAdded' | 'patientUpdated' | 'patientRemoved' | string;
  Email: string;
  consultationId?: string;
  identifier?: string;
  identifier_value?: string;
  tags?: string;
  admissionid?: string;
}

export type SocketEventCallback = (payload: any) => void;

class SocketService {
  private static instance: SocketService;
  private isConnected: boolean = false;
  private eventListeners: Map<string, Set<SocketEventCallback>> = new Map();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(): void {
    if (this.isConnected) {
      console.log('[SocketService] Mock already connected');
      return;
    }

    console.log('[SocketService] Establishing mock socket connection...');
    this.isConnected = true;

    // Simulate async connection success event
    setTimeout(() => {
      const callbacks = this.eventListeners.get('connect');
      if (callbacks) {
        callbacks.forEach(cb => cb({}));
      }
    }, 100);
  }

  disconnect(): void {
    if (this.isConnected) {
      console.log('[SocketService] Mock socket disconnected');
      this.isConnected = false;
      
      const callbacks = this.eventListeners.get('disconnect');
      if (callbacks) {
        callbacks.forEach(cb => cb('io client disconnect'));
      }
    }
  }

  on(event: string, callback: SocketEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: SocketEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any): void {
    console.log('[SocketService] Mock emit:', event, data);
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getSocket(): any {
    return {
      connected: this.isConnected,
      emit: (event: string, data: any) => this.emit(event, data),
      on: (event: string, callback: any) => this.on(event, callback),
      off: (event: string, callback: any) => this.off(event, callback),
    };
  }
}

export const socketService = SocketService.getInstance();
