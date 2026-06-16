import { useState, useEffect, useCallback } from 'react';
import { PharmacyAIEventService } from '@/services/pharmacyAIEventService';
import type { 
  PharmacyAIState,
  PharmacyAIEventName,
  PharmacySearchEvent,
  DrugInteractionEvent,
  StockUpdateEvent,
  MedicineInfoEvent,
  AlternativeMedicationEvent,
  DosageCalculationEvent,
  LowStockAlertEvent
} from '@/types/pharmacyAIEvents';

interface PharmacyAICallbacks {
  onSearchResults: (data: PharmacySearchEvent) => void;
  onDrugInteraction: (data: DrugInteractionEvent) => void;
  onStockUpdate: (data: StockUpdateEvent) => void;
  onMedicineInfo: (data: MedicineInfoEvent) => void;
  onAlternatives: (data: AlternativeMedicationEvent) => void;
  onDosageCalculation: (data: DosageCalculationEvent) => void;
  onLowStockAlert: (data: LowStockAlertEvent) => void;
}

export const usePharmacyAIEventManager = (callbacks: PharmacyAICallbacks) => {
  const [pharmacyAIState, setPharmacyAIState] = useState<PharmacyAIState>({
    searchResults: null,
    drugInteractions: null,
    stockUpdate: null,
    medicineInfo: null,
    alternatives: null,
    dosageCalculation: null,
    lowStockAlert: null,
  });

  // Handle pharmacy search requests
  const handlePharmacySearchRequest = useCallback(async (event: CustomEvent<PharmacySearchEvent>) => {
    try {
      if (!PharmacyAIEventService.validatePharmacyEvent('ai-pharmacy-search-requested', event.detail)) {
        return;
      }
      const processedData = await PharmacyAIEventService.fetchSearchResults(event.detail.searchQuery);
      console.log({processedData})
      setPharmacyAIState(prev => ({ ...prev, searchResults: processedData }));
      callbacks.onSearchResults(processedData);
      PharmacyAIEventService.logPharmacyEvent('ai-pharmacy-search-requested', event.detail, true);
      PharmacyAIEventService.dispatchCompletionEvent('ai-pharmacy-search-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error processing pharmacy search:', error);
      PharmacyAIEventService.logPharmacyEvent('ai-pharmacy-search-requested', event.detail, false);
    }
  }, [callbacks]);


  // Handle medicine info requests
  const handleMedicineInfoRequest = useCallback(async (event: CustomEvent<MedicineInfoEvent>) => {
    try {
      if (!PharmacyAIEventService.validatePharmacyEvent('ai-medicine-info-requested', event.detail)) {
        return;
      }

      const processedData = await PharmacyAIEventService.getMedicineInfo(event.detail.medicineName);
      setPharmacyAIState(prev => ({ ...prev, medicineInfo: processedData }));
      callbacks.onMedicineInfo(processedData);
      PharmacyAIEventService.logPharmacyEvent('ai-medicine-info-requested', event.detail, true);
      PharmacyAIEventService.dispatchCompletionEvent('ai-medicine-info-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error retrieving medicine info:', error);
      PharmacyAIEventService.logPharmacyEvent('ai-medicine-info-requested', event.detail, false);
    }
  }, [callbacks]);

  // Handle low stock alert requests
  const handleLowStockAlertRequest = useCallback(async (event: CustomEvent<LowStockAlertEvent>) => {
    try {
      const processedData = await PharmacyAIEventService.getLowStockAlert(event.detail.category);
      setPharmacyAIState(prev => ({ ...prev, lowStockAlert: processedData }));
      callbacks.onLowStockAlert(processedData);
      PharmacyAIEventService.logPharmacyEvent('ai-low-stock-alert-requested', event.detail, true);
      PharmacyAIEventService.dispatchCompletionEvent('ai-low-stock-alert-requested', processedData, event.detail.callId);
    } catch (error) {
      console.error('Error generating low stock alert:', error);
      PharmacyAIEventService.logPharmacyEvent('ai-low-stock-alert-requested', event.detail, false);
    }
  }, [callbacks]);


  // Set up event listeners
  useEffect(() => {
    const eventHandlers: [PharmacyAIEventName, (event: CustomEvent) => void][] = [
      ['ai-pharmacy-search-requested', handlePharmacySearchRequest],
      ['ai-medicine-info-requested', handleMedicineInfoRequest],
      ['ai-low-stock-alert-requested', handleLowStockAlertRequest],
    ];

    // Add event listeners
    eventHandlers.forEach(([eventName, handler]) => {
      document.addEventListener(eventName, handler as EventListener);
    });

    // Cleanup
    return () => {
      eventHandlers.forEach(([eventName, handler]) => {
        document.removeEventListener(eventName, handler as EventListener);
      });
    };
  }, [
    handlePharmacySearchRequest,
    handleMedicineInfoRequest,
    handleLowStockAlertRequest,
  ]);

  return {
    pharmacyAIState,
    clearPharmacyAIData: (dataType: keyof PharmacyAIState) => {
      setPharmacyAIState(prev => ({ ...prev, [dataType]: null }));
    },
    setPharmacyAIData: <K extends keyof PharmacyAIState>(
      dataType: K,
      data: PharmacyAIState[K]
    ) => {
      setPharmacyAIState(prev => ({ ...prev, [dataType]: data }));
    },
  };
};