import { useState, useEffect, useCallback } from 'react';
import { AIEventService } from '@/services/aiEventService';
import type { 
  AIState, 
  AIEventName, 
  AINoteEvent, 
  AIMedicationEvent, 
  AIVitalsEvent, 
  AILabEvent,
  AIMedicationUpdateEvent,
  AIDischargeEvent} from '@/types/aiEvents';

interface AIEventCallbacks {
  onNoteReady: (data: any) => void;
  onMedicationReady: (data: any) => void;
  onVitalsReady: (data: any) => void;
  onLabReady: (data: any) => void;
  onMedicationUpdate: (medicationName: string, newStatus: string, reason: string, medications: any[]) => void;
  onDischargeReady: (data: any) => void;
 }

export const useAIEventManager = (callbacks: AIEventCallbacks, medications: any[] = []) => {
  const [aiState, setAiState] = useState<AIState>({
    noteData: null,
    medicationData: null,
    vitalsData: null,
    labData: null,
    dischargeData: null,
  });

  // Handle AI note requests
  const handleAiNoteRequest = useCallback((event: CustomEvent<AINoteEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-note-requested', event.detail)) {
        AIEventService.showErrorToast('Note', 'Invalid note data received');
        return;
      }

      const processedData = AIEventService.processNoteEvent(event.detail);
      setAiState(prev => ({ ...prev, noteData: processedData }));
      callbacks.onNoteReady(processedData);
      AIEventService.logAIEvent('ai-note-requested', event.detail, true);
      AIEventService.showSuccessToast('Note');
      
      // Dispatch completion event for AI feedback
      AIEventService.dispatchCompletionEvent('ai-note-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error processing AI note request:', error);
      AIEventService.showErrorToast('Note');
      AIEventService.logAIEvent('ai-note-requested', event.detail, false);
    }
  }, [callbacks]);

  // Handle AI medication requests
  // Note: Completion event is NOT dispatched here - it will be dispatched from PatientDetailsPage
  // after the user selects a medicine from the MedicineSelectionOverlay
  const handleAiMedicationRequest = useCallback((event: CustomEvent<AIMedicationEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-medication-requested', event.detail)) {
        AIEventService.showErrorToast('Medication', 'Invalid medication data received');
        return;
      }

      const processedData = AIEventService.processMedicationEvent(event.detail);
      // Include callId in processed data for later completion after medicine selection
      processedData.callId = event.detail.callId;
      
      setAiState(prev => ({ ...prev, medicationData: processedData }));
      callbacks.onMedicationReady(processedData);
      AIEventService.logAIEvent('ai-medication-requested', event.detail, true);
      
      // DON'T dispatch completion event here - wait for medicine selection
      // Completion will be dispatched from PatientDetailsPage after user selects medicine
    } catch (error) {
      console.error('Error processing AI medication request:', error);
      AIEventService.showErrorToast('Medication');
      AIEventService.logAIEvent('ai-medication-requested', event.detail, false);
    }
  }, [callbacks]);

  // Handle AI vitals requests
  const handleAiVitalsRequest = useCallback((event: CustomEvent<AIVitalsEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-vitals-requested', event.detail)) {
        AIEventService.showErrorToast('Vitals', 'Invalid vitals data received');
        return;
      }

      const processedData = AIEventService.processVitalsEvent(event.detail);
     setAiState(prev => ({ 
  ...prev, 
  vitalsData: {
    ...prev.vitalsData,  // Keep existing values
    ...Object.fromEntries(
      Object.entries(processedData).filter(([_, value]) => value !== undefined && value !== null)
    )  // Only add new non-null values
  }
}));
      callbacks.onVitalsReady(processedData);
      AIEventService.logAIEvent('ai-vitals-requested', event.detail, true);
      AIEventService.showSuccessToast('Vitals');
      
      // Dispatch completion event for AI feedback
      AIEventService.dispatchCompletionEvent('ai-vitals-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error processing AI vitals request:', error);
      AIEventService.showErrorToast('Vitals');
      AIEventService.logAIEvent('ai-vitals-requested', event.detail, false);
    }
  }, [callbacks]);

  // Handle AI lab requests
  const handleAiLabRequest = useCallback((event: CustomEvent<AILabEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-lab-requested', event.detail)) {
        AIEventService.showErrorToast('Lab Result', 'Invalid lab data received');
        return;
      }

      const processedData = AIEventService.processLabEvent(event.detail);
      setAiState(prev => ({ ...prev, labData: processedData }));
      callbacks.onLabReady(processedData);
      AIEventService.logAIEvent('ai-lab-requested', event.detail, true);
      AIEventService.showSuccessToast('Lab Result');
      
      // Dispatch completion event for AI feedback
      AIEventService.dispatchCompletionEvent('ai-lab-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error processing AI lab request:', error);
      AIEventService.showErrorToast('Lab Result');
      AIEventService.logAIEvent('ai-lab-requested', event.detail, false);
    }
  }, [callbacks]);

  // Handle AI medication update requests
  const handleAiMedicationUpdateRequest = useCallback((event: CustomEvent<AIMedicationUpdateEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-medication-update-requested', event.detail)) {
        AIEventService.showErrorToast('Medication Update', 'Invalid medication update data received');
        return;
      }

      const { medicationName, newStatus, reason } = event.detail;
      callbacks.onMedicationUpdate(medicationName, newStatus, reason, medications);
      AIEventService.logAIEvent('ai-medication-update-requested', event.detail, true);
      AIEventService.showSuccessToast('Medication Update');
      
      // Dispatch completion event for AI feedback
      AIEventService.dispatchCompletionEvent('ai-medication-update-requested', { medicationName, newStatus, reason }, event.detail.callId);
    } catch (error) {
      console.error('Error processing AI medication update request:', error);
      AIEventService.showErrorToast('Medication Update');
      AIEventService.logAIEvent('ai-medication-update-requested', event.detail, false);
    }
  }, [callbacks, medications]);

  // Handle AI discharge requests
  const handleAiDischargeRequest = useCallback((event: CustomEvent<AIDischargeEvent>) => {
    try {
      if (!AIEventService.validateEventData('ai-discharge-note-requested', event.detail)) {
        AIEventService.showErrorToast('Discharge Note', 'Invalid discharge data received');
        return;
      }

      const processedData = AIEventService.processDischargeEvent(event.detail);
      setAiState(prev => ({ ...prev, dischargeData: processedData }));
      callbacks.onDischargeReady(processedData);
      AIEventService.logAIEvent('ai-discharge-note-requested', event.detail, true);
      AIEventService.showSuccessToast('Discharge Note');
      
      // Dispatch completion event for AI feedback
      AIEventService.dispatchCompletionEvent('ai-discharge-note-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error processing AI discharge request:', error);
      AIEventService.showErrorToast('Discharge Note');
      AIEventService.logAIEvent('ai-discharge-note-requested', event.detail, false);
    }
  }, [callbacks]);

 
 

  // Set up event listeners
  useEffect(() => {
    const eventHandlers: [AIEventName, (event: CustomEvent) => void][] = [
      ['ai-note-requested', handleAiNoteRequest],
      ['ai-medication-requested', handleAiMedicationRequest],
      ['ai-vitals-requested', handleAiVitalsRequest],
      ['ai-lab-requested', handleAiLabRequest],
      ['ai-medication-update-requested', handleAiMedicationUpdateRequest],
      ['ai-discharge-note-requested', handleAiDischargeRequest],
     ];

    // Add event listeners
    eventHandlers.forEach(([eventName, handler]) => {
      document.addEventListener(eventName, handler as EventListener);
    });

    // Cleanup function
    return () => {
      eventHandlers.forEach(([eventName, handler]) => {
        document.removeEventListener(eventName, handler as EventListener);
      });
    };
  }, [
    handleAiNoteRequest,
    handleAiMedicationRequest,
    handleAiVitalsRequest,
    handleAiLabRequest,
    handleAiMedicationUpdateRequest,
    handleAiDischargeRequest,
   ]);

  // Clear medication data specifically - useful when user selects from overlay
  const clearMedicationData = useCallback(() => {
    setAiState(prev => ({ ...prev, medicationData: null }));
  }, []);

  return {
    aiState,
    clearAIData: (dataType: keyof AIState) => {
      setAiState(prev => ({ ...prev, [dataType]: null }));
    },
    clearMedicationData,
  };
};