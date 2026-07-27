import { useEffect, useCallback, useState } from 'react';
import { useSocket as useContextSocket } from '@/contexts/SocketContext';
import { PatientDataUpdatePayload } from '@/services/socketService';

export const useSocket = () => {
  const { connected, addListener, removeListener, emit: contextEmit } = useContextSocket();
  const [isConnected, setIsConnected] = useState(connected);

  useEffect(() => {
    setIsConnected(connected);
  }, [connected]);

  // Subscribe to an event
  const subscribe = useCallback((event: string, callback: (payload: any) => void) => {
    addListener(event, callback);
    
    return () => {
      removeListener(event, callback);
    };
  }, [addListener, removeListener]);

  // Emit an event
  const emit = useCallback((event: string, data: any) => {
    contextEmit(event, data);
  }, [contextEmit]);

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
