// Pharmacy Analytics Types

export type PharmacyChipType = 
  | 'DEMAND_SALES_OUTLOOK'
  | 'OVERSTOCK_RISK_INDEX'
  | 'DEAD_STOCK_ANALYSIS'
  | 'EMERGENCY_PURCHASE'
  | 'ANOMALIES_ALERTS'
  | 'VENDOR_OPTIMIZATION';

export interface AnalyticsSummary {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  confidence: number;
  headline: string;
}

export interface AnalyticsKPI {
  label: string;
  value: string | number;
  unit?: string;
}

export interface ChartSeriesDataPoint {
  date: string;
  value: number;
}

// Chart series can come in different formats from API
export interface ChartSeries {
  name?: string;
  label?: string;
  value?: number;
  total_sold?: number; // Alternative format from API
  data?: ChartSeriesDataPoint[];
}

// Chart data item (alternative format from API)
export interface ChartDataItem {
  name?: string;
  category?: string;  // Alternative field from LLM
  label?: string;     // Alternative field from LLM
  total_sold?: number;
  value?: number;
  count?: number;     // Alternative field from LLM
  [key: string]: string | number | undefined;
}

export interface AnalyticsChart {
  type: 'LINE' | 'BAR' | 'PIE' | 'DOUGHNUT' | 'bar' | 'line' | 'pie' | 'doughnut';
  title: string;
  series?: ChartSeries[];
  data?: ChartDataItem[]; // Alternative format from API
}

export interface AnalyticsTable {
  title: string;
  columns?: string[];
  headers?: string[]; // Alternative format from API
  rows: (string | number | null)[][];
}

export interface SuggestedAction {
  actionType?: string;
  category?: string;   // Alternative field from LLM
  action?: string;     // Alternative format from API
  label?: string;
  description?: string; // Alternative field from LLM
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | number; // Made optional
}

export interface AnalyticsInsight {
  type: string;
  message: string;
  priority?: string;
}

export interface PharmacyAnalyticsResponse {
  chipType: PharmacyChipType;
  scope: 'GLOBAL' | 'CATEGORY' | 'ITEM';
  title: string;
  summary: AnalyticsSummary;
  kpis: AnalyticsKPI[];
  charts: AnalyticsChart[];
  tables: AnalyticsTable[];
  insights: AnalyticsInsight[];
  suggestedActions: SuggestedAction[];
  lastUpdated: string;
}

// Chip configuration for UI
export interface ChipConfig {
  id: PharmacyChipType;
  label: string;
  iconName: string;
  prompt: string;
}
