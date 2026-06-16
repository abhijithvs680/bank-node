import { toast } from "@/hooks/use-toast";
import type { 
  AIEventData, 
  AINoteEvent, 
  AIMedicationEvent, 
  AIVitalsEvent, 
  AILabEvent,
  AIMedicationUpdateEvent,
  AIDischargeEvent,
  AIClinicalConsultEvent,
  AINoteData,
  AIMedicationData,
  AIVitalsData,
  AILabData
} from "@/types/aiEvents";

// Utility functions for AI event processing
export class AIEventService {
  // Map severity to priority levels
  static mapSeverityToPriority(findingType: string): 'low' | 'normal' | 'high' | 'urgent' {
    switch (findingType.toLowerCase()) {
      case 'improving': return 'low';
      case 'critical': return 'urgent';
      case 'high': return 'high';
      case 'normal': return 'normal';
      default: return 'normal';
    }
  }

  // Validate AI event data
  static validateEventData(eventName: string, data: any): boolean {
    try {
      switch (eventName) {
        case 'ai-note-requested':
          return typeof data?.note === 'string' && typeof data?.findingType === 'string';
        case 'ai-medication-requested':
          return typeof data?.medicationName === 'string';
        case 'ai-vitals-requested':
          return typeof data === 'object' && data !== null;
        case 'ai-lab-requested':
          return typeof data?.testName === 'string';
        case 'ai-medication-update-requested':
          return typeof data?.medicationName === 'string' && typeof data?.newStatus === 'string';
        case 'ai-discharge-note-requested':
          return typeof data?.dischargeStatus === 'string';
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error validating AI event data:', error);
      return false;
    }
  }

  // Process AI note event
  static processNoteEvent(event: AINoteEvent): AINoteData {
    return {
      notes: event.note,
      findingType: event.findingType
    };
  }

  // Process AI medication event
  static processMedicationEvent(event: AIMedicationEvent): AIMedicationData {
    return {
      medicationName: event.medicationName,
      dosage: event.dosage,
      frequency: event.frequency,
      route: event.route,
      prescribedBy: event.prescribedBy,
      instructions: event.instructions,
      numberOfDays: event.numberOfDays,
    foodTiming: event.foodTiming
    };
  }

  // Process AI vitals event
  static processVitalsEvent(event: AIVitalsEvent): AIVitalsData {
    return {
      heartRate: event.heartRate,
      bloodPressureSystolic: event.bloodPressureSystolic,
      bloodPressureDiastolic: event.bloodPressureDiastolic,
      temperature: event.temperature,
      oxygenSaturation: event.oxygenSaturation,
      respiratoryRate: event.respiratoryRate,
      painLevel: event.painLevel,
       bloodGlucose: event.bloodGlucose,           
    glasgowComaScale: event.glasgowComaScale    
    };
  }

  // Process AI lab event
  static processLabEvent(event: AILabEvent): AILabData {
    return {
      testName: event.testName,
      value: event.value,
      unit: event.unit,
      normalRange: event.normalRange,
      status: event.status,
      orderedBy: event.orderedBy
    };
  }

  // Process AI discharge event
  static processDischargeEvent(event: AIDischargeEvent): AINoteData {
    const dischargeNote = `Discharge Status: ${event.dischargeStatus}\n\nInstructions: ${event.instructions}\n\nFollow-up Plan: ${event.followUpPlan}\n\nMedications: ${event.medications}`;
    
    return {
      notes: dischargeNote,
      findingType: 'Discharge Planning'
    };
  }

  // Log AI events for analytics
  static logAIEvent(eventName: string, data: AIEventData, success: boolean) {
    console.log(`[AI Event] ${eventName}:`, {
      timestamp: new Date().toISOString(),
      eventName,
      data,
      success
    });
  }

  // Show success toast for AI actions
  static showSuccessToast(actionType: string) {
    toast({
      title: "AI Action Completed",
      description: `${actionType} data has been prepared for review.`,
    });
  }

  // Show error toast for AI actions
  static showErrorToast(actionType: string, error?: string) {
    toast({
      title: "AI Action Failed",
      description: error || `Failed to process ${actionType} request.`,
      variant: "destructive",
    });
  }

  // Dispatch completion event to notify AI
  static dispatchCompletionEvent(eventType: string, data: any, callId?: string) {
    const completionEventMap = {
      'ai-note-requested': 'ai-note-completed',
      'ai-medication-requested': 'ai-medication-completed', 
      'ai-vitals-requested': 'ai-vitals-completed',
      'ai-lab-requested': 'ai-lab-completed',
      'ai-medication-update-requested': 'ai-medication-update-completed',
      'ai-discharge-note-requested': 'ai-discharge-completed',
      'ai-clinical-consult': 'ai-clinical-consult-completed'
    };

    const completionEvent = completionEventMap[eventType as keyof typeof completionEventMap];
    
    if (completionEvent) {
      setTimeout(() => {
        const event = new CustomEvent(completionEvent, {
          detail: { ...data, callId, success: true }
        });
        document.dispatchEvent(event);
      }, 100); // Small delay to ensure original processing is complete
    }
  }
}