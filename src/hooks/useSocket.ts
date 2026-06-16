import { useEffect, useCallback, useState } from 'react';
import { socketService, SocketEventCallback, PatientDataUpdatePayload } from '@/services/socketService';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socketService.getConnectionStatus());

  // Subscribe to an event
  const subscribe = useCallback((event: string, callback: SocketEventCallback) => {
    socketService.on(event, callback);
    
    return () => {
      socketService.off(event, callback);
    };
  }, []);

  // Emit an event
  const emit = useCallback((event: string, data: any) => {
    socketService.emit(event, data);
  }, []);

  // Update connection status periodically
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(socketService.getConnectionStatus());
    };

    const interval = setInterval(checkConnection, 2000);
    checkConnection(); // Initial check
    
    return () => clearInterval(interval);
  }, []);

  return { subscribe, emit, isConnected };
};

// Specialized hook for patient data updates
export const usePatientDataSocket = (
  onPatientUpdate: (payload: PatientDataUpdatePayload) => void,
  options?: { consultationId?: string }
) => {
  const { subscribe } = useSocket();

  useEffect(() => {
    const handleUpdate = (payload: PatientDataUpdatePayload) => {
      console.log('[usePatientDataSocket] Received patient_data_update:', payload);
      
      // If consultationId is provided, only process matching updates
      if (options?.consultationId) {
        if (payload.admissionid && payload.admissionid !== options.consultationId) {
          console.log('[usePatientDataSocket] Ignoring update for different consultation');
          return;
        }
      }
      
      onPatientUpdate(payload);
    };

    const unsubscribe = subscribe('patient_data_update', handleUpdate);

    return unsubscribe;
  }, [subscribe, onPatientUpdate, options?.consultationId]);
};

// Hook for patient list updates (patientAdded, patientUpdated, patientRemoved)
export const usePatientListSocket = (onRefresh: () => void) => {
  const { subscribe } = useSocket();

  useEffect(() => {
    const handleUpdate = (payload: PatientDataUpdatePayload) => {
      console.log('[usePatientListSocket] Received patient_data_update:', payload);
      
      // Refresh list for patient add/update/remove events
      if (
        payload._type === 'patientAdded' ||
        payload._type === 'patientUpdated' ||
        payload._type === 'patientRemoved'
      ) {
        console.log('[usePatientListSocket] Triggering refresh for:', payload._type);
        onRefresh();
      }
    };

    const unsubscribe = subscribe('patient_data_update', handleUpdate);

    return unsubscribe;
  }, [subscribe, onRefresh]);
};
