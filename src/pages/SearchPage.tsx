import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mic,
  MicOff,
  ArrowLeft,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertCircle,
  Table as TableIcon,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBranding } from '@/contexts/BrandingContext';
import io from "socket.io-client";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import { pauseAI, resumeAI } from '@/components/openaiVoiceAgent';
import { PharmacyVoiceRecorder } from '@/components/PharmacyVoiceRecorder';
import { PharmacyAIResultsOverlay } from '@/components/PharmacyAIResultsOverlay';
import { usePharmacyAIEventManager } from '@/hooks/usePharmacyAIEventManager';
import { patientMedicineSearchService } from '@/services/patientMedicineSearchService';
import type { PatientMedicine } from '@/services/patientMedicineDatabase';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { MedicineSelectionOverlay } from '@/components/MedicineSelectionOverlay';
import { PharmacyAIEventService } from '@/services/pharmacyAIEventService';
import { speechService } from '@/services/speechService';
import { MedicineDetailsPanel } from '@/components/MedicineDetailsPanel';
import { MedicineSyncIndicator } from '@/components/MedicineSyncIndicator';
import type {
  PharmacySearchEvent,
  DrugInteractionEvent,
  StockUpdateEvent,
  MedicineInfoEvent,
  AlternativeMedicationEvent,
  DosageCalculationEvent,
  LowStockAlertEvent
} from '@/types/pharmacyAIEvents';
import { PharmacyAnalyticsChips } from '@/components/PharmacyAnalyticsChips';
import { PharmacyAnalyticsOverlay } from '@/components/PharmacyAnalyticsOverlay';
import type { PharmacyChipType, PharmacyAnalyticsResponse } from '@/types/pharmacyAnalytics';
interface AISearchResponse {
  jobid: string;
  ai_response: string;
  dataframe: Array<Record<string, any>>;
  ai_suggested_actions: string[];
}

const SearchPage = () => {
  // Ref to store SpeechRecognition instance
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();
  const { appName, logoUrl } = useBranding();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState<AISearchResponse | null>(null);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [medicinesData, setMedicinesData] = useState<any[]>([]);

  // Overlay state
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  // Medicine search state
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineResults, setMedicineResults] = useState<PatientMedicine[]>([]);
  const [isSearchingMedicine, setIsSearchingMedicine] = useState(false);

  // Medicine selection overlay state (for voice assistant)
  const [medicineOverlayOpen, setMedicineOverlayOpen] = useState(false);
  const [overlayMedicines, setOverlayMedicines] = useState<PatientMedicine[]>([]);
  const [overlayQuery, setOverlayQuery] = useState('');
  const [pendingCallId, setPendingCallId] = useState<string | null>(null);
  const [pendingEventType, setPendingEventType] = useState<'search' | 'info' | undefined>();

  // Medicine details panel state
  const [selectedMedicine, setSelectedMedicine] = useState<PatientMedicine | null>(null);
  const [medicineApiDetails, setMedicineApiDetails] = useState<{ stock?: number; mrp?: number } | null>(null);

  // Medicine sync progress state
  const [isSyncingMedicines, setIsSyncingMedicines] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  // Pharmacy analytics state
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<PharmacyAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState<PharmacyChipType | null>(null);

  // Effect to automatically pause/resume AI voice agent based on active overlays
  // Note: overlayOpen (Pharmacy Results) is excluded - voice should remain active
  useEffect(() => {
    if (medicineOverlayOpen || analyticsOpen) {
      pauseAI();
    } else {
      resumeAI();
    }
  }, [medicineOverlayOpen, analyticsOpen]);

  // Pharmacy AI event callbacks
  const pharmacyCallbacks = {
    onSearchResults: (data: PharmacySearchEvent) => {
      console.log('Pharmacy search results:', data);
      setOverlayOpen(true);
      setActiveTab("search");
    },
    onDrugInteraction: (data: DrugInteractionEvent) => {
      console.log('Drug interaction check:', data);
      setOverlayOpen(true);
      setActiveTab("interactions");
    },
    onStockUpdate: (data: StockUpdateEvent) => {
      console.log('Stock update:', data);
      setOverlayOpen(true);
      setActiveTab("stock-update");
    },
    onMedicineInfo: (data: MedicineInfoEvent) => {
      console.log('Medicine info:', data);
      setOverlayOpen(true);
      setActiveTab("medicine-info");
    },
    onAlternatives: (data: AlternativeMedicationEvent) => {
      console.log('Alternative medications:', data);
      setOverlayOpen(true);
      setActiveTab("alternatives");
    },
    onDosageCalculation: (data: DosageCalculationEvent) => {
      console.log('Dosage calculation:', data);
      setOverlayOpen(true);
      setActiveTab("dosage");
    },
    onLowStockAlert: (data: LowStockAlertEvent) => {
      console.log('Low stock alert:', data);
      setOverlayOpen(true);
      setActiveTab("low-stock");
    }
  };

  // Initialize pharmacy AI event manager
  const { pharmacyAIState, setPharmacyAIData } = usePharmacyAIEventManager(pharmacyCallbacks);

  const handleClearAll = () => {
    toast.success("All results cleared");
  };

  // Analytics chip click handler
  const handleAnalyticsChipClick = async (chipType: PharmacyChipType) => {
    setActiveChip(chipType);
    setAnalyticsLoading(true);
    setAnalyticsOpen(true);
    setAnalyticsData(null);

    const prompts: Record<PharmacyChipType, string> = {
      DEMAND_SALES_OUTLOOK: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Analyze demand and sales trends across inventory.

CALCULATIONS:
- Sales growth rates by category and medicine
- Fast-moving SKU identification
- 30-day demand forecast

OUTPUT REQUIREMENTS:
- KPIs: Total medicines analyzed, demand growth rate (%), fast moving SKUs count, 30-day forecast value
- Charts: Sales trend (LINE with actual vs forecast), top categories by growth (BAR)
- Table: Top medicines by demand increase

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Medicine identifier, demand/sales metric, growth indicator
- RECOMMENDED: Medicine Name, Category, Current Demand, Previous Demand, Growth %, Recommended Stock
- ALTERNATIVES: "Sales Qty" for "Current Demand", "Last Period Sales" for "Previous Demand", "Change %" or "Trend" for "Growth %"

ACTIONS: Suggest replenishment priorities

Response format: { "chipType": "DEMAND_SALES_OUTLOOK", "scope": "GLOBAL", "title": "Demand & Sales Outlook", "summary": { "severity": "INFO", "confidence": 0.95, "headline": "summary text" }, "kpis": [{ "label": "Total Medicines Analyzed", "value": 1000 }, { "label": "Demand Growth Rate", "value": "12.5%", "unit": "%" }, { "label": "Fast Moving SKUs", "value": 156 }, { "label": "30-Day Forecast Value", "value": "₹850,000" }], "charts": [{ "type": "LINE", "title": "Sales Trend (Actual vs Forecast)", "data": [{ "name": "Week 1", "actual": 50000, "forecast": 52000 }] }, { "type": "BAR", "title": "Top Categories by Growth", "data": [{ "name": "Antibiotics", "value": 15.2 }] }], "tables": [{ "title": "Top Medicines by Demand Increase", "columns": ["Medicine Name", "Category", "Current Demand", "Previous Demand", "Growth %", "Recommended Stock"], "rows": [["Paracetamol 500mg", "Analgesics", 450, 380, 18.4, 600]] }], "suggestedActions": [{ "category": "Replenishment", "action": "Increase stock for high-growth items", "priority": "HIGH" }], "lastUpdated": "ISO8601" }`,

      OVERSTOCK_RISK_INDEX: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Detect overstocked medicines across inventory.

CALCULATIONS:
- DOH (Days on Hand) = Current Stock / Avg Daily Sales
- Compare DOH against optimal range (30-60 days)
- Blocked Capital = Excess Stock × Unit Cost

OUTPUT REQUIREMENTS:
- KPIs: Total analyzed, overstocked count (DOH > 60), blocked capital, max DOH
- Chart: Risk distribution (PIE with High/Medium/Low/Optimal)
- Table: Top overstocked medicines

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Medicine identifier, current stock quantity, risk indicator
- RECOMMENDED: Medicine Name, Current Stock, Recommended Stock, Excess Quantity, Avg Daily Sales, DOH, Blocked Capital (₹), Risk Level
- ALTERNATIVES: "Stock Qty" for "Current Stock", "Target Stock" or "Optimal Stock" for "Recommended Stock", "Overage" or "Surplus" for "Excess Quantity", "Risk" or "Status" for "Risk Level"
- If recommended stock unavailable, use DOH as risk indicator

ACTIONS: Suggest PO reduction, discounts, redistribution

Response format: { "chipType": "OVERSTOCK_RISK_INDEX", "scope": "GLOBAL", "title": "Overstock Risk Index", "summary": { "severity": "WARNING", "confidence": 0.93, "headline": "summary text" }, "kpis": [{ "label": "Total Medicines Analyzed", "value": 1000 }, { "label": "Overstocked Items (DOH > 60)", "value": 192 }, { "label": "Total Blocked Capital", "value": "₹267,000" }, { "label": "Highest DOH Recorded", "value": 14000, "unit": "days" }], "charts": [{ "type": "PIE", "title": "Overstock Risk Distribution", "data": [{ "name": "High Risk (DOH > 120)", "value": 87 }, { "name": "Medium Risk (DOH 60-120)", "value": 58 }, { "name": "Low Risk (DOH 30-60)", "value": 47 }, { "name": "Optimal (DOH < 30)", "value": 808 }] }], "tables": [{ "title": "Top Overstocked Medicines", "columns": ["Medicine Name", "Current Stock", "Recommended Stock", "Excess Quantity", "Avg Daily Sales", "DOH", "Blocked Capital (₹)", "Risk Level"], "rows": [["Becosules CAPS", 534, 87, 447, 1.44, 370, 1201.5, "High"]] }], "suggestedActions": [{ "category": "PO Reduction", "action": "Halt purchases for DOH > 90 items", "priority": "HIGH" }], "lastUpdated": "ISO8601" }`,

      DEAD_STOCK_ANALYSIS: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Identify dead stock medicines with zero sales in 90+ days.

CALCULATIONS:
- Days since last sale
- Stock value at risk
- Expiry proximity

OUTPUT REQUIREMENTS:
- KPIs: Dead stock SKUs, total value, avg days since sale, expiring within 90 days
- Chart: Distribution by days since last sale (BAR)
- Table: Dead stock medicines list

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Medicine identifier, stock quantity, inactivity period
- RECOMMENDED: Medicine Name, Current Stock, Last Sale Date, Days Since Sale, Stock Value (₹), Expiry Date, Status
- ALTERNATIVES: "Last Transaction" for "Last Sale Date", "Inactive Days" for "Days Since Sale", "Value" or "Amount" for "Stock Value"

ACTIONS: Suggest liquidation, return, or discount strategies

Response format: { "chipType": "DEAD_STOCK_ANALYSIS", "scope": "GLOBAL", "title": "Dead Stock Analysis", "summary": { "severity": "CRITICAL", "confidence": 0.94, "headline": "summary text" }, "kpis": [{ "label": "Dead Stock SKUs", "value": 85 }, { "label": "Total Dead Stock Value", "value": "₹125,000" }, { "label": "Avg Days Since Last Sale", "value": 145, "unit": "days" }, { "label": "Expiring Within 90 Days", "value": 23 }], "charts": [{ "type": "BAR", "title": "Dead Stock by Days Since Last Sale", "data": [{ "name": "90-120 days", "value": 25 }, { "name": "120-180 days", "value": 35 }, { "name": "180+ days", "value": 25 }] }], "tables": [{ "title": "Dead Stock Medicines", "columns": ["Medicine Name", "Current Stock", "Last Sale Date", "Days Since Sale", "Stock Value (₹)", "Expiry Date", "Status"], "rows": [["Old Medicine X", 50, "2024-08-15", 155, 2500, "2025-06-30", "Near Expiry"]] }], "suggestedActions": [{ "category": "Liquidation", "action": "Apply 30% discount on items with 180+ days no sale", "priority": "CRITICAL" }], "lastUpdated": "ISO8601" }`,

      EMERGENCY_PURCHASE: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Identify medicines requiring emergency purchase due to critical stock levels.

CALCULATIONS:
- Current stock vs minimum required
- Days to stockout = Current Stock / Avg Daily Demand
- Lead time analysis

OUTPUT REQUIREMENTS:
- KPIs: Critical items count, estimated stockout value, out of stock count, avg days to stockout
- Chart: Criticality distribution (BAR)
- Table: Emergency purchase list

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Medicine identifier, current stock, urgency indicator
- RECOMMENDED: Medicine Name, Current Stock, Minimum Required, Shortfall, Avg Daily Demand, Days to Stockout, Estimated Lead Time, Priority
- ALTERNATIVES: "Reorder Point" for "Minimum Required", "Deficit" or "Gap" for "Shortfall", "Urgency" or "Criticality" for "Priority"

ACTIONS: Priority purchase recommendations

Response format: { "chipType": "EMERGENCY_PURCHASE", "scope": "GLOBAL", "title": "Emergency Purchase", "summary": { "severity": "CRITICAL", "confidence": 0.92, "headline": "summary text" }, "kpis": [{ "label": "Critical Items", "value": 28 }, { "label": "Estimated Stockout Value", "value": "₹45,000" }, { "label": "Items Out of Stock", "value": 12 }, { "label": "Avg Days to Stockout", "value": 3, "unit": "days" }], "charts": [{ "type": "BAR", "title": "Criticality Distribution", "data": [{ "name": "Out of Stock", "value": 12 }, { "name": "1-3 Days Left", "value": 16 }, { "name": "3-7 Days Left", "value": 24 }] }], "tables": [{ "title": "Emergency Purchase List", "columns": ["Medicine Name", "Current Stock", "Minimum Required", "Shortfall", "Avg Daily Demand", "Days to Stockout", "Estimated Lead Time", "Priority"], "rows": [["Critical Drug A", 5, 50, 45, 8, 0.6, "2 days", "CRITICAL"]] }], "suggestedActions": [{ "category": "Urgent Order", "action": "Place emergency order for out-of-stock items", "priority": "CRITICAL" }], "lastUpdated": "ISO8601" }`,

      ANOMALIES_ALERTS: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Detect anomalies and alerts in pharmacy operations.

CALCULATIONS:
- Unusual sales patterns (spikes/drops)
- Expiry date proximity
- Price discrepancies vs market

OUTPUT REQUIREMENTS:
- KPIs: Total alerts, critical alerts, expiry alerts, price discrepancies
- Chart: Alerts by category (PIE)
- Table: Active alerts list

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Alert type, affected item, severity
- RECOMMENDED: Alert Type, Medicine Name, Description, Detected Value, Expected Value, Severity, Detection Date
- ALTERNATIVES: "Item" or "Product" for "Medicine Name", "Actual" for "Detected Value", "Normal" or "Baseline" for "Expected Value"

ACTIONS: Investigation and resolution recommendations

Response format: { "chipType": "ANOMALIES_ALERTS", "scope": "GLOBAL", "title": "Anomalies & Alerts", "summary": { "severity": "WARNING", "confidence": 0.89, "headline": "summary text" }, "kpis": [{ "label": "Total Alerts", "value": 47 }, { "label": "Critical Alerts", "value": 8 }, { "label": "Expiry Alerts", "value": 15 }, { "label": "Price Discrepancies", "value": 12 }], "charts": [{ "type": "PIE", "title": "Alerts by Category", "data": [{ "name": "Expiry Alerts", "value": 15 }, { "name": "Price Anomalies", "value": 12 }, { "name": "Sales Spikes", "value": 10 }, { "name": "Stock Discrepancies", "value": 10 }] }], "tables": [{ "title": "Active Alerts", "columns": ["Alert Type", "Medicine Name", "Description", "Detected Value", "Expected Value", "Severity", "Detection Date"], "rows": [["Price Anomaly", "Drug X", "Price 30% above market", 150, 115, "HIGH", "2025-01-15"]] }], "suggestedActions": [{ "category": "Investigation", "action": "Review price discrepancies with procurement team", "priority": "HIGH" }], "lastUpdated": "ISO8601" }`,

      VENDOR_OPTIMIZATION: `IMPORTANT: Output strictly JSON only, no explanations.

OBJECTIVE: Optimize vendor relationships and procurement.

CALCULATIONS:
- Vendor performance scores (delivery, quality, pricing)
- Cost comparison across vendors
- Consolidation opportunities

OUTPUT REQUIREMENTS:
- KPIs: Active vendors, avg performance score, potential savings, on-time delivery rate
- Chart: Top vendors by performance (BAR)
- Table: Vendor performance analysis

TABLE COLUMN GUIDANCE:
- REQUIRED (must include): Vendor identifier, performance metric, recommendation
- RECOMMENDED: Vendor Name, Total Orders, On-Time %, Return Rate %, Avg Discount %, Performance Score, Recommendation
- ALTERNATIVES: "Supplier" for "Vendor Name", "Delivery Rate" for "On-Time %", "Score" or "Rating" for "Performance Score"

ACTIONS: Vendor consolidation and negotiation strategies

Response format: { "chipType": "VENDOR_OPTIMIZATION", "scope": "GLOBAL", "title": "Vendor Optimization", "summary": { "severity": "INFO", "confidence": 0.91, "headline": "summary text" }, "kpis": [{ "label": "Active Vendors", "value": 24 }, { "label": "Avg Vendor Score", "value": 7.2, "unit": "/10" }, { "label": "Potential Savings", "value": "₹85,000" }, { "label": "On-Time Delivery Rate", "value": "78%", "unit": "%" }], "charts": [{ "type": "BAR", "title": "Top Vendors by Performance Score", "data": [{ "name": "Vendor A", "value": 9.2 }, { "name": "Vendor B", "value": 8.7 }, { "name": "Vendor C", "value": 8.1 }] }], "tables": [{ "title": "Vendor Performance Analysis", "columns": ["Vendor Name", "Total Orders", "On-Time %", "Return Rate %", "Avg Discount %", "Performance Score", "Recommendation"], "rows": [["Pharma Corp A", 156, 95, 2.1, 12, 9.2, "Preferred"]] }], "suggestedActions": [{ "category": "Consolidation", "action": "Shift 30% orders from low-performers to top 3 vendors", "priority": "MEDIUM" }], "lastUpdated": "ISO8601" }`
    };

    try {
      const response = await fetch('https://ageless-server-demo.vizru-ras.com/query', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: prompts[chipType],
          conversation_id: 'pharmacy-analytics'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();

      // Parse the response - it might be a string or object
      let parsedData: PharmacyAnalyticsResponse;
      if (typeof result === 'string') {
        parsedData = JSON.parse(result);
      } else if (result.response && typeof result.response === 'string') {
        parsedData = JSON.parse(result.response);
      } else if (result.response) {
        parsedData = result.response;
      } else {
        parsedData = result;
      }

      setAnalyticsData(parsedData);
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handler for medicine selection from overlay
  const handleOverlayConfirm = async (selectedMedicine: PatientMedicine) => {
    setMedicineOverlayOpen(false);

    // Store callId before clearing it
    const currentCallId = pendingCallId;

    try {
      // FIRST: Call the API to get medicine info
      const apiResult = await PharmacyAIEventService.getMedicineInfo(selectedMedicine.Name);

      // THEN: Dispatch medicine-selection-complete with FULL API data
      // This ensures the AI voice response uses the actual API data
      if (currentCallId) {
        const selectionEvent = new CustomEvent('medicine-selection-complete', {
          detail: {
            callId: currentCallId,
            success: true,
            medicine: selectedMedicine.Name,
            originalQuery: overlayQuery,
            // Include full API response data for AI voice response
            apiData: {
              stock: apiResult.stock,
              mrp: apiResult.mrp,
              composition: apiResult.composition,
              inStock: apiResult.inStock,
              alternatives: apiResult.alternatives
            }
          }
        });
        document.dispatchEvent(selectionEvent);
      }

      // Update pharmacy AI state to show in overlay
      setPharmacyAIData('medicineInfo', apiResult);

      // Show results overlay
      setOverlayOpen(true);
      setActiveTab('medicine-info');

    } catch (error) {
      console.error('Error fetching medicine details:', error);
      toast.error('Failed to fetch medicine details');

      // Still send completion event on error so AI can respond
      if (currentCallId) {
        const errorEvent = new CustomEvent('medicine-selection-complete', {
          detail: {
            callId: currentCallId,
            success: false,
            medicine: selectedMedicine.Name,
            originalQuery: overlayQuery,
            error: 'Failed to fetch medicine details'
          }
        });
        document.dispatchEvent(errorEvent);
      }
    } finally {
      setPendingCallId(null);
      setPendingEventType(undefined);
    }
  };

  // Handler for medicine selection from search results
  const handleMedicineSelect = async (medicine: PatientMedicine) => {
    console.log('Selected medicine:', medicine);

    // Set selected medicine for details panel
    setSelectedMedicine(medicine);

    // Fetch API details for the medicine
    try {
      const apiResult = await PharmacyAIEventService.getMedicineInfo(medicine.Name);
      setMedicineApiDetails({
        stock: apiResult.stock,
        mrp: apiResult.mrp,
      });

      // Update pharmacy AI state to show in overlay
      setPharmacyAIData('medicineInfo', apiResult);
      // Open the overlay and switch to Medicine Info tab
      setOverlayOpen(true);
      setActiveTab('medicine-info');
    } catch (error) {
      console.error('Error fetching medicine API details:', error);
      setMedicineApiDetails(null);
      toast.error('Failed to fetch medicine details');
    }
  };

  // Handle medicine search
  const handleMedicineSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMedicineResults([]);
      return;
    }

    setIsSearchingMedicine(true);
    try {
      const results = await patientMedicineSearchService.search(searchQuery, 20);
      setMedicineResults(results);
      console.log(`Found ${results.length} medicine results for: ${searchQuery}`);
    } catch (error) {
      console.error('Medicine search error:', error);
      setMedicineResults([]);
      toast.error('Failed to search medicines');
    } finally {
      setIsSearchingMedicine(false);
    }
  };

  // Intercept unified medicine lookup events to show medicine selection overlay first
  useEffect(() => {
    const handleMedicineLookup = async (event: Event) => {
      const customEvent = event as CustomEvent;
      event.stopImmediatePropagation(); // Prevent other listeners

      const { medicineName, callId } = customEvent.detail;
      console.log('Intercepted medicine lookup:', { medicineName, callId });

      try {
        // Search IndexedDB using Fuse.js
        const results = await patientMedicineSearchService.search(medicineName, 20);

        // Show overlay with results
        setOverlayMedicines(results);
        setOverlayQuery(medicineName);
        setPendingCallId(callId);
        setPendingEventType('info');
        setMedicineOverlayOpen(true);
      } catch (error) {
        console.error('Error searching medicines:', error);
        toast.error('Failed to search medicines');
      }
    };

    // Use capture: true to handle events before other listeners
    document.addEventListener('ai-medicine-lookup-requested', handleMedicineLookup, { capture: true });

    return () => {
      document.removeEventListener('ai-medicine-lookup-requested', handleMedicineLookup, { capture: true });
    };
  }, []);

  // Initialize medicine search service on mount
  useEffect(() => {
    const initializeMedicineData = async () => {
      try {
        setIsSyncingMedicines(true);
        console.log('Initializing patient medicine search service...');

        await patientMedicineSearchService.initializeData();

        // Load medicines for voice assistant context
        const medicines = await patientMedicineSearchService.getAllMedicines();
        setMedicinesData(medicines);

        // Load initial 30 records for display
        const initial30 = medicines.slice(0, 30);
        setMedicineResults(initial30);

        console.log(`Loaded ${medicines.length} medicines, displaying first 30`);
      } catch (error) {
        console.error('Failed to initialize medicine data:', error);
        toast.error('Failed to load medicine database');
      }
    };

    const handleSyncComplete = async () => {
      setIsSyncingMedicines(false);

      try {
        // Reload all medicines from IndexedDB after sync is complete
        const medicines = await patientMedicineSearchService.getAllMedicines();
        setMedicinesData(medicines);

        // Update displayed results with first 30 medicines
        const initial30 = medicines.slice(0, 30);
        setMedicineResults(initial30);

        console.log(`Sync complete! Loaded ${medicines.length} medicines, displaying first 30`);
        toast.success(`Loaded ${medicines.length} medicines`);
      } catch (error) {
        console.error('Failed to reload medicines after sync:', error);
      }
    };

    document.addEventListener('patient-medicine-sync-complete', handleSyncComplete);

    initializeMedicineData();

    return () => {
      document.removeEventListener('patient-medicine-sync-complete', handleSyncComplete);
    };
  }, []);


  // Socket.io connection
  useEffect(() => {
    const userData = authService.getCurrentUser();
    const socketConnection = io("wss://wss.vizru.studio", {
      query: {
        token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkb21haW4iOiJ2aXpydSIsIm5hbWUiOiJHdWVzdCIsImFnZW50IjoiV29ya2Zsb3cifQ.bDuKpCe3ql1OjELAwZJG6GW89Y84mfYZedqc9CI8P1U",
      },
      transports: ["websocket"],
      secure: true,
    });

    socketConnection.on("connect", () => {
      socketConnection.emit("vizru_user", {
        username: userData.firstName,
        email: userData.email,
        id: userData.id,
        auth_token:
          "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmbmFtZSI6IlJhaHVsICIsInVpZCI6IjEzOTIiLCJlbWFpbCI6InJhaHVsQHZpenJ1LmNvbSIsImV4cCI6MTc1NjI3MTc4NSwiZG9tYWluIjoiaW5ub3YtZGV2LmJldGEuaW5qb21vLmNvbSIsInBlcnNpc3RhbnQiOiIxIn0.SS9vtdvkSrFopd-O6mt8wU5LKpMvHnnVL7yIX5a22So",
        tid: 204,
      });
    });

    socketConnection.on("ai_search_res", (data: AISearchResponse) => {
      setResponse(data);
      setIsSearching(false);
    });

    setSocket(socketConnection);
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const [socket, setSocket] = useState<any>(null);

  // Voice input using Web Speech API
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Sorry, your browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = () => {
      toast.error("Speech recognition error");
    };

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const stopRecording = () => {
    // Stop Web Speech API recording
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    // If you use MediaRecorder for audio, keep this as well:
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      handleVoiceInput();
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setResponse(null);
    //setShowDataframe(false);

    try {
      const formData = new FormData();
      formData.append(
        "short_code",
        "inventorytableaigenerated68c93e22729b5"
      );
      formData.append("tid", "204");
      formData.append("question", query);
      formData.append("prompt", "answer in a pharmacy management system context");
      formData.append(
        "payload",
        `{"identifier": "userid","identifier_value": "1392","tags": "ai_search_res","dataset": { "jobid": "edc4b541-1aab-4129-b7d7-49ba76b00837", "job":"testJOB" }}`
      );
      formData.append(
        "callback_url",
        "https://chat.beta.injomo.com:2053/push_message"
      );

      await fetch("https://spreadsheet-fastapi.injomo.com/spreadsheet-query", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
    }
  };


  const handleActionClick = (action: string) => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one row to perform this action");
      return;
    }

    const selectedData = Array.from(selectedRows).map(index => response?.dataframe[index]);
    console.log("Action data:", { action, selectedData });
  };

  const handleRowSelection = (index: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(index);
    } else {
      newSelectedRows.delete(index);
    }
    setSelectedRows(newSelectedRows);
    setSelectAll(newSelectedRows.size === response?.dataframe.length);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && response?.dataframe) {
      setSelectedRows(new Set(response.dataframe.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
    setSelectAll(checked);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 animate-pulse">
          <XCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    } else if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <AlertCircle className="w-3 h-3" />
          Low: {stock}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3" />
          {stock}
        </span>
      );
    }
  };

  const renderActionButtons = () => {
    if (!response?.ai_suggested_actions || response.ai_suggested_actions.length === 0) {
      return null;
    }

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 flex flex-col md:flex-row   ">

        <h3 className="flex items-center gap-2 text-lg mr-6 ml-1"> <TableIcon className="w-5 h-5 text-blue-500" /> Data  </h3>

        <div className="flex flex-wrap gap-2">
          {response.ai_suggested_actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleActionClick(action)}
              className="capitalize"
            >
              {action.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
        <div className="mb-1 mt-1 mr-0 ml-auto ">
          <div className="flex items-center gap-2">

            {selectedRows.size > 0 && (
              <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDataframeTable = () => {
    if (!response?.dataframe || response.dataframe.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-8">No data available</p>
      );
    }

    const columns = Object.keys(response.dataframe[0])
      .filter((key) => key !== "row_id");

    return (
      <div className="max-h-[500px] overflow-auto border rounded-lg bg-background mx-5">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 z-20 bg-background border-b shadow-sm">
            <TableRow>
              <TableHead className="w-12 bg-background px-4 py-3 border-b">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  aria-label="Select all rows"
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column}
                  style={
                    column.toLowerCase() === "description"
                      ? { minWidth: "720px" }
                      : column.toLowerCase() === "stock"
                        ? { minWidth: "135px" }
                        : undefined
                  }
                  className="capitalize font-medium bg-background px-4 py-3 text-foreground border-b"
                >
                  {column.replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {response.dataframe.map((row, index) => (
              <TableRow
                key={row.row_id || index}
                className={`hover:bg-muted/50 transition-colors duration-200 ${selectedRows.has(index) ? 'bg-blue-50' : ''
                  }`}
              >
                <TableCell className="px-4 py-3">
                  <Checkbox
                    checked={selectedRows.has(index)}
                    onCheckedChange={(checked) => handleRowSelection(index, !!checked)}
                    aria-label={`Select row ${index + 1}`}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column} className="py-3 px-4">
                    {column === "Stock"
                      ? getStockBadge(row[column])
                      : column === "Price"
                        ? `$${row[column]}`
                        : row[column] || "N/A"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Medicine Sync Indicator */}
      <MedicineSyncIndicator />

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <div className="relative border-b bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/corporate-deals")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <div>
                <img
                  src={logoUrl}
                  style={{ width: "140px" }}
                  alt={`${appName} Logo`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Section with Voice Assistant */}
        <div className="text-center space-y-6 py-12">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pharmacy AI Assistant
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Use voice commands to search medicines, check stock levels, and get instant information
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <PharmacyVoiceRecorder
              medicinesData={medicinesData}
              onMedicineSearch={(query) => setQuery(query)}
            />
          </div>

          {/* Analytics Chips */}
          <div className="flex justify-center pt-4">
            <PharmacyAnalyticsChips
              onChipClick={handleAnalyticsChipClick}
              activeChip={activeChip}
              isLoading={analyticsLoading}
            />
          </div>
        </div>

        {/* Medicine Search Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          <h2 className="flex items-center gap-3 text-md font-semibold mb-4">
            <Brain className="w-5 h-5 text-blue-600" />
            Medicine Database Search
            {isSyncingMedicines && syncProgress.total > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                Syncing: {syncProgress.current}/{syncProgress.total}
              </span>
            )}
          </h2>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by name, category, composition, manufacturer..."
              value={medicineQuery}
              onChange={(e) => setMedicineQuery(e.target.value)}
              onKeyDown={(e) => {
                handleMedicineSearch(e.currentTarget.value);
              }}
              className="flex-1"
              disabled={isSyncingMedicines}
            />
          </div>

          {/* Two-column layout: Search Results (left) + Details Panel (right) */}
          <div className="grid grid-cols-1  gap-4">
            {/* Left: Medicine Search Results */}
            <div>
              {isSyncingMedicines ? (
                <div className="flex flex-col items-center justify-center h-32 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-muted-foreground">
                    {syncProgress.total > 0
                      ? `Syncing medicines... ${syncProgress.current}/${syncProgress.total}`
                      : 'Initializing medicine database...'
                    }
                  </p>
                </div>
              ) : isSearchingMedicine ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : medicineResults.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {medicineResults.map((medicine, index) => (
                    <button
                      key={index}
                      onClick={() => handleMedicineSelect(medicine)}
                      className={`w-full text-left p-4 border rounded-lg transition-colors duration-200 ${selectedMedicine?.Name === medicine.Name
                        ? 'bg-blue-50 border-blue-500'
                        : 'border-border hover:bg-muted/50'
                        }`}
                    >
                      <div className="font-semibold text-foreground">{medicine.Name}</div>
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {medicine.Description}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {medicine.Category && <Badge variant="secondary">{medicine.Category}</Badge>}
                        {medicine.MedicineType && <Badge variant="outline">{medicine.MedicineType}</Badge>}
                        {medicine.Manufacturer && <Badge variant="outline">{medicine.Manufacturer}</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              ) : medicineQuery ? (
                <div className="text-center text-muted-foreground py-8">
                  No medicines found for "{medicineQuery}"
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Showing first 30 medicines. Enter a search term to find specific medicines.
                </div>
              )}
            </div>

            {/* Right: Medicine Details Panel */}
          </div>
        </div>

        {/* Search Results */}
        {response && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border-0 overflow-hidden">

              <div className="p-6 space-y-6">
                {/* AI Summary */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <Brain className="w-5 h-5 text-blue-500" /> AI Summary
                    </h3>
                    <button
                      onClick={() => setExpandedSummary(!expandedSummary)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      {expandedSummary ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                      {expandedSummary ? "Collapse" : "Expand"}
                    </button>
                  </div>
                  <div
                    className={`prose prose-sm max-w-none bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 transition-all duration-300 ${expandedSummary
                      ? "max-h-none"
                      : "max-h-32 overflow-hidden"
                      }`}
                    dangerouslySetInnerHTML={{ __html: response.ai_response }}
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-1  pb-7 px-2">
                <div>     {renderActionButtons()}  </div>
                {renderDataframeTable()}
              </div>

            </div>
          </div>
        )}
      </div>

      <PharmacyAIResultsOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pharmacyAIState={pharmacyAIState}
        onClearAll={handleClearAll}
      />

      {/* Medicine Selection Overlay */}
      <MedicineSelectionOverlay
        open={medicineOverlayOpen}
        onOpenChange={setMedicineOverlayOpen}
        medicines={overlayMedicines}
        onConfirm={handleOverlayConfirm}
        searchQuery={overlayQuery}
      />

      {/* Pharmacy Analytics Overlay */}
      <PharmacyAnalyticsOverlay
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        data={analyticsData}
        isLoading={analyticsLoading}
      />

    </div>
  );
};

export default SearchPage;
