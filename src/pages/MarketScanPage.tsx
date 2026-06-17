import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Sparkles, TrendingUp, TrendingDown,
  BarChart3, Globe, Building2, DollarSign, ShieldCheck,
  AlertTriangle, ExternalLink, Loader2, RefreshCw,
  ChevronRight, Newspaper, PieChart, Activity,
  Zap, CreditCard, Clock, Calendar, CheckCircle2, XCircle,
  AlertCircle, Target, Lightbulb, Crosshair
} from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useBranding } from "@/contexts/BrandingContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type SentimentType = "positive" | "neutral" | "negative";
type RiskLevelType = "Low" | "Medium" | "High" | "Critical";
type StatusType = "ok" | "warn" | "bad";

interface DebtEvent {
  year: string;
  event: string;
  amount: string;
  type: "issuance" | "repayment" | "default" | "restructure" | "upgrade" | "downgrade";
}

interface DebtFacility {
  name: string;
  amount: string;
  maturity: string;
  rate: string;
  status: "current" | "watch" | "breach";
}

interface RevenueDataPoint { year: string; revenue: number; ebitda: number; }
interface PeerCompany { name: string; ticker: string; score: number; debtEbitda: string; margin: string; }

interface FinancialTable {
  headers: string[];
  rows: { label: string; values: (string | number)[] }[];
}

interface AnalysisData {
  company: string;
  ticker: string;
  sector: string;
  country: string;
  marketCap: string;
  employees: string;
  founded: string;
  rating: string;
  ratingColor: string;
  overallSentiment: SentimentType;
  aiSummary: string;
  financials: { label: string; value: string; trend: "up" | "down" | "flat" }[];
  strengths: string[];
  risks: string[];
  recentNews: { headline: string; source: string; date: string; sentiment: SentimentType }[];
  creditIndicators: { label: string; value: string; status: StatusType }[];
  lenderRiskLevel: RiskLevelType;
  lenderRiskComment: string;
  // New fields
  debtProfile: {
    totalDebt: string;
    netDebt: string;
    cashPosition: string;
    weightedAvgCost: string;
    fixedVsFloating: string;
    nearestMaturity: string;
    covenantHeadroom: string;
    covenantStatus: StatusType;
    facilities: DebtFacility[];
    creditHistory: DebtEvent[];
  };
  revenueHistory: RevenueDataPoint[];
  capitalStructure: { label: string; pct: number; color: string }[];
  peers: PeerCompany[];
  aiInsights: { title: string; body: string; type: "action" | "watch" | "opportunity" }[];
  // Screener tables
  pros?: string[];
  cons?: string[];
  quarterlyResults?: FinancialTable;
  profitAndLoss?: FinancialTable;
  balanceSheet?: FinancialTable;
  cashFlows?: FinancialTable;
  shareholdingPattern?: FinancialTable;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DB: Record<string, AnalysisData> = {
  nvidia: {
    company: "NVIDIA Corporation",
    ticker: "NVDA",
    sector: "Semiconductors",
    country: "USA",
    marketCap: "$2.97T",
    employees: "29,600",
    founded: "1993",
    rating: "Investment Grade (AAA)",
    ratingColor: "#10b981",
    overallSentiment: "positive",
    aiSummary:
      "NVIDIA dominates the AI accelerator market with an estimated 80–90% share of data-center GPU supply. Explosive revenue growth driven by H100/H200 demand, strong forward guidance from hyperscalers, and a robust CUDA software moat make this a highly resilient counterparty. Debt levels are negligible relative to cash generation. Near-term risks include geopolitical export controls on advanced chips to China and competitive pressure from AMD and custom silicon (Google TPU, AWS Trainium).",
    financials: [
      { label: "Revenue (TTM)", value: "$79.8B", trend: "up" },
      { label: "Net Income (TTM)", value: "$29.7B", trend: "up" },
      { label: "EBITDA Margin", value: "62.4%", trend: "up" },
      { label: "Debt / EBITDA", value: "0.2×", trend: "flat" },
      { label: "Free Cash Flow", value: "$26.9B", trend: "up" },
      { label: "Current Ratio", value: "4.2×", trend: "up" },
    ],
    strengths: [
      "~85% market share in AI/ML training chips",
      "CUDA ecosystem creates an extremely high switching cost",
      "Hyperscaler capex ($350B+ combined in 2024) is primarily GPU spend",
      "Gross margins above 76% — best-in-class for semiconductors",
      "Net cash position — effectively zero leverage risk",
    ],
    risks: [
      "US export restrictions on A100/H100 to China (~20% of revenue at risk)",
      "Concentration risk — top 5 customers represent ~45% of revenue",
      "Customer in-house silicon development (Google, Amazon, Microsoft)",
      "Cyclical semiconductor demand may soften post AI capex build-out",
    ],
    recentNews: [
      { headline: "NVIDIA reports record Q1 FY2026 revenue of $26B, beats estimates by 8%", source: "Reuters", date: "Jun 10, 2026", sentiment: "positive" },
      { headline: "US tightens export controls on AI chips; NVIDIA confirms China revenue impact", source: "FT", date: "Jun 5, 2026", sentiment: "negative" },
      { headline: "Blackwell GPU demand 'insane' — CEO Jensen Huang at Computex 2026", source: "Bloomberg", date: "Jun 2, 2026", sentiment: "positive" },
      { headline: "NVIDIA and TSMC sign long-term capacity agreement through 2028", source: "WSJ", date: "May 28, 2026", sentiment: "positive" },
    ],
    creditIndicators: [
      { label: "Interest Coverage Ratio", value: "280×", status: "ok" },
      { label: "Net Debt / EBITDA", value: "-0.4× (net cash)", status: "ok" },
      { label: "Quick Ratio", value: "3.8×", status: "ok" },
      { label: "Altman Z-Score", value: "14.2 (Safe zone)", status: "ok" },
    ],
    lenderRiskLevel: "Low",
    lenderRiskComment:
      "Exceptional creditworthiness. Negligible leverage, industry-leading margins, and near-monopoly market position make NVIDIA a premier lending counterparty. Recommend minimal covenant requirements and competitive pricing.",
    debtProfile: {
      totalDebt: "$8.5B",
      netDebt: "-$12.3B (Net Cash)",
      cashPosition: "$20.8B",
      weightedAvgCost: "3.20%",
      fixedVsFloating: "100% Fixed",
      nearestMaturity: "Jun 2026 — $1.25B Senior Notes",
      covenantHeadroom: ">500bps",
      covenantStatus: "ok",
      facilities: [
        { name: "3.50% Senior Notes", amount: "$1.25B", maturity: "Jun 2026", rate: "3.50%", status: "current" },
        { name: "2.85% Senior Notes", amount: "$1.50B", maturity: "Apr 2030", rate: "2.85%", status: "current" },
        { name: "3.50% Senior Notes", amount: "$1.00B", maturity: "Apr 2040", rate: "3.50%", status: "current" },
        { name: "3.70% Senior Notes", amount: "$4.75B", maturity: "Apr 2060", rate: "3.70%", status: "current" },
      ],
      creditHistory: [
        { year: "2023", event: "S&P upgrades to A+", amount: "—", type: "upgrade" },
        { year: "2022", event: "Issued $5B Senior Notes", amount: "$5.0B", type: "issuance" },
        { year: "2021", event: "Moody's upgrades to A1", amount: "—", type: "upgrade" },
        { year: "2020", event: "Revolving Credit Facility renewal", amount: "$575M", type: "issuance" },
        { year: "2016", event: "First external debt issuance", amount: "$2.0B", type: "issuance" },
      ],
    },
    revenueHistory: [
      { year: "2020", revenue: 10.9, ebitda: 3.2 },
      { year: "2021", revenue: 16.7, ebitda: 5.8 },
      { year: "2022", revenue: 26.9, ebitda: 7.1 },
      { year: "2023", revenue: 44.9, ebitda: 22.0 },
      { year: "2024", revenue: 79.8, ebitda: 49.8 },
    ],
    capitalStructure: [
      { label: "Equity", pct: 68, color: "#3d5af1" },
      { label: "Long-term Debt", pct: 24, color: "#6366f1" },
      { label: "Cash & Equiv.", pct: 8, color: "#10b981" },
    ],
    peers: [
      { name: "AMD", ticker: "AMD", score: 74, debtEbitda: "1.8×", margin: "24%" },
      { name: "Intel", ticker: "INTC", score: 52, debtEbitda: "4.2×", margin: "9%" },
      { name: "Broadcom", ticker: "AVGO", score: 81, debtEbitda: "2.1×", margin: "58%" },
    ],
    aiInsights: [
      { type: "opportunity", title: "Prime candidate for bilateral term loan", body: "With net cash of $12.3B and ICR of 280×, NVIDIA can comfortably absorb a $3–5B bilateral facility at sub-100bps spread over SOFR. Recommend initiating relationship conversation with Treasury team." },
      { type: "action", title: "Monitor China export headwinds", body: "H20 chip restrictions (~$4B revenue exposure) represent the primary downside scenario. Structure any long-tenor facility with a material adverse change clause tied to US export control thresholds." },
      { type: "watch", title: "Maturity wall: Jun 2026 — $1.25B refinancing", body: "NVIDIA's nearest debt maturity ($1.25B Senior Notes due Jun 2026) presents a refinancing opportunity. Engage ahead of Q4 to position for the mandated deal." },
    ],
  },
  apple: {
    company: "Apple Inc.",
    ticker: "AAPL",
    sector: "Consumer Technology",
    country: "USA",
    marketCap: "$3.11T",
    employees: "164,000",
    founded: "1976",
    rating: "Investment Grade (AA+)",
    ratingColor: "#10b981",
    overallSentiment: "positive",
    aiSummary:
      "Apple sustains unparalleled brand equity and an extraordinarily loyal installed base of 2.2B+ active devices. Services revenue (App Store, iCloud, Apple Pay) now exceeds $100B annually and carries 73%+ gross margins. Capital allocation excellence — the company has returned over $800B to shareholders since 2012. Primary near-term risk is iPhone unit volume stagnation in China, where Huawei regained high-end market share.",
    financials: [
      { label: "Revenue (TTM)", value: "$391B", trend: "up" },
      { label: "Net Income (TTM)", value: "$97.3B", trend: "up" },
      { label: "EBITDA Margin", value: "34.7%", trend: "up" },
      { label: "Debt / EBITDA", value: "1.1×", trend: "down" },
      { label: "Free Cash Flow", value: "$107.5B", trend: "up" },
      { label: "Current Ratio", value: "1.04×", trend: "flat" },
    ],
    strengths: [
      "2.2B+ active devices — largest premium consumer ecosystem globally",
      "Services segment growing 15% YoY with 73%+ gross margins",
      "$162B cash & equivalents on balance sheet",
      "iPhone 16 AI features driving the largest upgrade cycle in 5 years",
      "India manufacturing ramp reduces China geopolitical risk",
    ],
    risks: [
      "China revenue (~18% of total) faces Huawei competition + regulatory scrutiny",
      "EU Digital Markets Act threatens App Store revenue (~€15B at risk)",
      "iPhone market share plateauing in key emerging markets",
      "AI product differentiation still unproven vs. Google and Samsung",
    ],
    recentNews: [
      { headline: "Apple Intelligence drives record iPhone upgrades in North America", source: "Bloomberg", date: "Jun 12, 2026", sentiment: "positive" },
      { headline: "EU regulators open fresh antitrust probe into App Store pricing", source: "FT", date: "Jun 7, 2026", sentiment: "negative" },
      { headline: "Apple announces $110B share buyback program", source: "Reuters", date: "May 30, 2026", sentiment: "positive" },
    ],
    creditIndicators: [
      { label: "Interest Coverage Ratio", value: "38×", status: "ok" },
      { label: "Net Debt / EBITDA", value: "0.3× (quasi net cash)", status: "ok" },
      { label: "Quick Ratio", value: "0.9×", status: "warn" },
      { label: "Altman Z-Score", value: "8.7 (Safe zone)", status: "ok" },
    ],
    lenderRiskLevel: "Low",
    lenderRiskComment:
      "Apple's free cash flow generation ($107B+ TTM) provides extraordinary debt service coverage. Conservative leverage and commitment to investment-grade ratings ensure reliable counterparty quality.",
    debtProfile: {
      totalDebt: "$101.3B",
      netDebt: "-$60.7B (Net Cash)",
      cashPosition: "$162.0B",
      weightedAvgCost: "2.95%",
      fixedVsFloating: "97% Fixed / 3% Floating",
      nearestMaturity: "May 2026 — $2.5B Senior Notes",
      covenantHeadroom: ">400bps",
      covenantStatus: "ok",
      facilities: [
        { name: "2.375% Senior Notes", amount: "$2.5B", maturity: "May 2026", rate: "2.375%", status: "current" },
        { name: "3.85% Senior Notes", amount: "$4.0B", maturity: "Aug 2028", rate: "3.85%", status: "current" },
        { name: "Commercial Paper", amount: "$6.0B", maturity: "Rolling 90d", rate: "5.28%", status: "current" },
        { name: "4.10% Senior Notes", amount: "$3.5B", maturity: "Nov 2034", rate: "4.10%", status: "current" },
      ],
      creditHistory: [
        { year: "2024", event: "Issued $10.5B multi-tranche notes", amount: "$10.5B", type: "issuance" },
        { year: "2022", event: "Moody's affirms Aaa / stable outlook", amount: "—", type: "upgrade" },
        { year: "2020", event: "COVID-era $8.5B issuance at record low rates", amount: "$8.5B", type: "issuance" },
        { year: "2013", event: "Apple's debut bond issuance", amount: "$17.0B", type: "issuance" },
        { year: "2012", event: "First external credit facility opened", amount: "$3.0B", type: "issuance" },
      ],
    },
    revenueHistory: [
      { year: "2020", revenue: 274.5, ebitda: 81.0 },
      { year: "2021", revenue: 365.8, ebitda: 120.2 },
      { year: "2022", revenue: 394.3, ebitda: 130.5 },
      { year: "2023", revenue: 383.3, ebitda: 123.0 },
      { year: "2024", revenue: 391.0, ebitda: 135.6 },
    ],
    capitalStructure: [
      { label: "Equity", pct: 12, color: "#3d5af1" },
      { label: "Long-term Debt", pct: 62, color: "#6366f1" },
      { label: "Cash & Equiv.", pct: 26, color: "#10b981" },
    ],
    peers: [
      { name: "Microsoft", ticker: "MSFT", score: 91, debtEbitda: "0.8×", margin: "52%" },
      { name: "Samsung", ticker: "005930", score: 77, debtEbitda: "0.2×", margin: "18%" },
      { name: "Alphabet", ticker: "GOOGL", score: 88, debtEbitda: "-0.5×", margin: "31%" },
    ],
    aiInsights: [
      { type: "opportunity", title: "Leverage Apple's debt appetite for large-ticket deals", body: "Apple issues $10–15B annually via multi-tranche public bonds. Relationship banks consistently win ancillary FX, derivatives and cash management mandates worth ~$50M+ in fee revenue." },
      { type: "watch", title: "EU App Store ruling could impact $15B revenue", body: "The DMA compliance deadline creates binary risk. Track EU Digital Markets Act enforcement timeline; consider fee step-up covenant for EU regulatory exposure above 10% of total revenue." },
      { type: "action", title: "Position for Nov 2026 refinancing window", body: "Apple's $3.5B 4.10% notes maturing Nov 2034 may be tendered early. Pre-positioning for a potential buyback/exchange tender could generate advisory fees and new issuance mandates." },
    ],
  },
  tesla: {
    company: "Tesla, Inc.",
    ticker: "TSLA",
    sector: "Electric Vehicles / Clean Energy",
    country: "USA",
    marketCap: "$820B",
    employees: "127,855",
    founded: "2003",
    rating: "Sub-Investment Grade (BB+)",
    ratingColor: "#f59e0b",
    overallSentiment: "neutral",
    aiSummary:
      "Tesla leads global EV production but faces mounting margin pressure from aggressive price cuts (-25% average ASP decline since 2022) and intensifying competition from BYD and legacy OEMs. FSD (Full Self-Driving) and energy storage represent significant long-term optionality, but near-term earnings quality has deteriorated. CEO Elon Musk's political and business diversification raises governance concerns for institutional lenders.",
    financials: [
      { label: "Revenue (TTM)", value: "$97.7B", trend: "up" },
      { label: "Net Income (TTM)", value: "$6.9B", trend: "down" },
      { label: "EBITDA Margin", value: "11.2%", trend: "down" },
      { label: "Debt / EBITDA", value: "3.8×", trend: "up" },
      { label: "Free Cash Flow", value: "$2.3B", trend: "down" },
      { label: "Current Ratio", value: "1.8×", trend: "flat" },
    ],
    strengths: [
      "Global EV market share leader with vertically integrated supply chain",
      "Supercharger network — now an industry-standard licensing target",
      "Energy storage (Megapack) growing 130% YoY with superior margins",
      "FSD technology has significant optionality value if robotaxi approved",
    ],
    risks: [
      "Automotive gross margins compressed to ~13% (from 27% in 2022)",
      "CEO distraction risk — Musk's political activities affecting brand",
      "BYD surpassed Tesla in unit volume for the first time in 2023",
      "Regulatory uncertainty around FSD and robotaxi deployment",
    ],
    recentNews: [
      { headline: "Tesla Q1 deliveries miss estimates by 8%; margins at 3-year low", source: "Reuters", date: "Jun 8, 2026", sentiment: "negative" },
      { headline: "Cybercab robotaxi unveil draws 'mixed' analyst response", source: "WSJ", date: "Jun 3, 2026", sentiment: "neutral" },
      { headline: "Tesla Energy revenue up 150% YoY — bright spot in disappointing quarter", source: "Bloomberg", date: "May 25, 2026", sentiment: "positive" },
    ],
    creditIndicators: [
      { label: "Interest Coverage Ratio", value: "6.2×", status: "warn" },
      { label: "Net Debt / EBITDA", value: "2.9×", status: "warn" },
      { label: "Quick Ratio", value: "1.3×", status: "ok" },
      { label: "Altman Z-Score", value: "3.1 (Grey zone)", status: "warn" },
    ],
    lenderRiskLevel: "Medium",
    lenderRiskComment:
      "Moderate credit risk. Compressed margins and declining FCF warrant tighter covenants on leverage ratios and DSCR minimums. Consider requiring quarterly financial reporting with step-up pricing provisions.",
    debtProfile: {
      totalDebt: "$9.6B",
      netDebt: "$1.9B",
      cashPosition: "$7.7B",
      weightedAvgCost: "4.85%",
      fixedVsFloating: "60% Fixed / 40% Floating",
      nearestMaturity: "Mar 2026 — $1.5B Term Loan",
      covenantHeadroom: "120bps",
      covenantStatus: "warn",
      facilities: [
        { name: "Term Loan B", amount: "$1.5B", maturity: "Mar 2026", rate: "SOFR + 225bps", status: "watch" },
        { name: "5.30% Senior Notes", amount: "$1.8B", maturity: "Aug 2025", rate: "5.30%", status: "current" },
        { name: "Revolving Credit Facility", amount: "$5.0B", maturity: "Jun 2028", rate: "SOFR + 175bps", status: "current" },
        { name: "Equipment Finance", amount: "$1.3B", maturity: "Dec 2030", rate: "4.65%", status: "current" },
      ],
      creditHistory: [
        { year: "2023", event: "S&P upgrades from BB to BB+", amount: "—", type: "upgrade" },
        { year: "2022", event: "Issued $1.8B Senior Notes", amount: "$1.8B", type: "issuance" },
        { year: "2021", event: "Fitch upgrades outlook to positive", amount: "—", type: "upgrade" },
        { year: "2020", event: "SolarCity debt restructure completed", amount: "$2.0B", type: "restructure" },
        { year: "2018", event: "Convertible notes near-default; avoided with equity raise", amount: "$920M", type: "default" },
        { year: "2017", event: "Issued convertible senior notes", amount: "$1.8B", type: "issuance" },
      ],
    },
    revenueHistory: [
      { year: "2020", revenue: 31.5, ebitda: 4.2 },
      { year: "2021", revenue: 53.8, ebitda: 9.5 },
      { year: "2022", revenue: 81.5, ebitda: 17.6 },
      { year: "2023", revenue: 96.8, ebitda: 12.8 },
      { year: "2024", revenue: 97.7, ebitda: 10.9 },
    ],
    capitalStructure: [
      { label: "Equity", pct: 54, color: "#3d5af1" },
      { label: "Long-term Debt", pct: 38, color: "#f59e0b" },
      { label: "Cash & Equiv.", pct: 8, color: "#10b981" },
    ],
    peers: [
      { name: "BYD", ticker: "BYDDF", score: 68, debtEbitda: "2.1×", margin: "8%" },
      { name: "Rivian", ticker: "RIVN", score: 31, debtEbitda: "N/M", margin: "-48%" },
      { name: "Ford", ticker: "F", score: 58, debtEbitda: "3.4×", margin: "6%" },
    ],
    aiInsights: [
      { type: "watch", title: "Covenant headroom critically thin — 120bps", body: "Tesla's leverage covenant sits at 4.0× Net Debt/EBITDA; current ratio is 3.8×. A further 10% EBITDA decline would trigger a technical breach. Recommend real-time covenant monitoring with monthly management accounts." },
      { type: "action", title: "Require step-up margin on any new facility", body: "Given sub-investment grade rating and declining margins, price any new exposure at SOFR + 275–350bps with step-up provisions if Net Debt/EBITDA exceeds 3.5×. Include a cross-default clause referencing the Term Loan B." },
      { type: "opportunity", title: "Energy Storage segment — consider ring-fenced financing", body: "Megapack revenues are growing 130% YoY with 28%+ EBITDA margins. A project-finance or asset-backed structure against the energy storage division would significantly de-risk a credit facility from EV margin volatility." },
    ],
  },
  coastcorp: {
    company: "Coastal Corporation Ltd",
    ticker: "COASTCORP",
    sector: "Fast Moving Consumer Goods / Seafood",
    country: "India",
    marketCap: "₹339 Cr",
    employees: "1,240",
    founded: "1981",
    rating: "Sub-Investment Grade (BB)",
    ratingColor: "#f59e0b",
    overallSentiment: "neutral",
    aiSummary:
      "Coastal Corporation Ltd (CCL) is an Indian aquaculture exporter engaged in processing and exporting high-quality shrimp products. CCL operates BRC, HACCP, and BAP-certified processing facilities. The company primarily targets export markets (USA, Europe, and Asia). Rising raw material costs, high working capital requirements, and geographic concentration in the US represent key risks. The company is diversifying into ethanol production with a 300 KLPD plant in Odisha.",
    financials: [
      { label: "Market Cap", value: "₹339 Cr", trend: "up" },
      { label: "Stock P/E", value: "12.7", trend: "flat" },
      { label: "Book Value", value: "₹42.4", trend: "up" },
      { label: "Dividend Yield", value: "0.43%", trend: "down" },
      { label: "ROCE", value: "9.63%", trend: "down" },
      { label: "ROE", value: "9.76%", trend: "down" },
    ],
    strengths: [
      "BRC, HACCP, and BAP-certified shrimp exporter with strong global client base",
      "Expanding capacity with a new 300 KLPD ethanol plant in Odisha to diversify revenue",
      "Robust export pipeline with long-standing retail relationships in USA",
      "Consistently paid dividends with a payout ratio of ~25.2%",
    ],
    risks: [
      "Highly concentrated in USA sales (~70% of export revenues)",
      "High leverage with Borrowings increasing from ₹173 Cr to ₹481 Cr over 4 years",
      "Vulnerable to raw shrimp price volatility and export shipping costs",
      "Low return on equity (ROE) of 4.53% over the last three years",
    ],
    recentNews: [
      { headline: "Coastal Corp Board approves final dividend of 14% (₹0.28 per share) for FY26", source: "BSE Filing", date: "May 30, 2026", sentiment: "positive" },
      { headline: "Coastal Corp announces ₹350 crore investment in 300 KLPD ethanol plant in Odisha", source: "Economic Times", date: "May 30, 2026", sentiment: "positive" },
      { headline: "Aquaculture margins compressed due to higher feed and logistics costs in Q4", source: "Mint", date: "May 15, 2026", sentiment: "negative" },
    ],
    creditIndicators: [
      { label: "Interest Coverage Ratio", value: "1.8×", status: "warn" },
      { label: "Debt / Equity Ratio", value: "1.7×", status: "warn" },
      { label: "Quick Ratio", value: "0.95×", status: "warn" },
      { label: "Altman Z-Score", value: "2.1 (Caution)", status: "warn" },
    ],
    lenderRiskLevel: "Medium",
    lenderRiskComment:
      "Medium risk profile. CCL's debt levels have scaled rapidly (Borrowings at ₹481 Cr in Mar 2026) due to capital expenditure on the Odisha ethanol plant. Interest coverage is thin at 1.8×. Recommend close monitoring of ethanol project commissioning and export margin stabilization.",
    debtProfile: {
      totalDebt: "₹481.0 Cr",
      netDebt: "₹456.0 Cr",
      cashPosition: "₹25.0 Cr",
      weightedAvgCost: "8.75%",
      fixedVsFloating: "30% Fixed / 70% Floating",
      nearestMaturity: "Sep 2026 — ₹45 Cr Working Capital facility",
      covenantHeadroom: "80bps",
      covenantStatus: "warn",
      facilities: [
        { name: "Working Capital Consortium", amount: "₹220.0 Cr", maturity: "Sep 2026", rate: "MCLR + 150bps", status: "current" },
        { name: "Odisha Term Loan (Ethanol project)", amount: "₹180.0 Cr", maturity: "Dec 2031", rate: "9.20% Fixed", status: "current" },
        { name: "ECB (External Commercial Borrowing)", amount: "₹81.0 Cr", maturity: "Jun 2029", rate: "SOFR + 250bps", status: "watch" },
      ],
      creditHistory: [
        { year: "2026", event: "Odisha project term loan disbursement", amount: "₹180.0 Cr", type: "issuance" },
        { year: "2025", event: "CRISIL rating reaffirmed at BBB- / Negative", amount: "—", type: "downgrade" },
        { year: "2024", event: "Working Capital Consortium expansion", amount: "₹50.0 Cr", type: "issuance" },
        { year: "2023", event: "Repayment of older Capex term loan", amount: "₹24.0 Cr", type: "repayment" },
      ],
    },
    revenueHistory: [
      { year: "2022", revenue: 491, ebitda: 16 },
      { year: "2023", revenue: 353, ebitda: 20 },
      { year: "2024", revenue: 436, ebitda: 28 },
      { year: "2025", revenue: 628, ebitda: 31 },
      { year: "2026", revenue: 971, ebitda: 60 },
    ],
    capitalStructure: [
      { label: "Equity", pct: 37, color: "#3d5af1" },
      { label: "Borrowings", pct: 57, color: "#f59e0b" },
      { label: "Cash & Equiv.", pct: 6, color: "#10b981" },
    ],
    peers: [
      { name: "Apex Frozen Foods", ticker: "APEX", score: 65, debtEbitda: "2.1×", margin: "5.8%" },
      { name: "Avanti Feeds", ticker: "AVANTIFEED", score: 85, debtEbitda: "0.2×", margin: "11.2%" },
      { name: "Waterbase Ltd", ticker: "WATERBASE", score: 58, debtEbitda: "3.4×", margin: "4.1%" },
    ],
    aiInsights: [
      { type: "watch", title: "Refinancing risk: ₹45 Cr Working Capital facility due Sep 2026", body: "CCL's short-term borrowings are high. Ensure consortium lenders extend the facility well ahead of the maturity window." },
      { type: "opportunity", title: "Odisha Ethanol Project: ESCROW structure opportunity", body: "Lenders can structure a ring-fenced Escrow Account for the new 300 KLPD ethanol plant, routing direct off-take payments from oil marketing companies (OMCs) like IOCL/BPCL." },
      { type: "action", title: "Covenant compliance review on debt-service cover", body: "With interest coverage near 1.8×, closely track the DSCR covenant. Pricing step-up clauses should be triggered if coverage falls below 1.5×." },
    ],
    pros: [
      "Company is expected to give a good quarter",
      "Company has been maintaining a healthy dividend payout of 25.2%",
      "Significant expansion in high-margin ethanol sector provides growth visibility",
    ],
    cons: [
      "Company has a low return on equity of 4.53% over the last 3 years",
      "Company might be capitalizing interest costs on the new ethanol plant",
      "Earnings include high raw material costs and exchange rate volatility",
    ],
    quarterlyResults: {
      headers: ["Mar 24", "Jun 24", "Sep 24", "Dec 24", "Mar 25", "Jun 25", "Sep 25", "Dec 25", "Mar 26"],
      rows: [
        { label: "Sales", values: [116.62, 132.81, 154.77, 183.55, 157.08, 183.66, 159.68, 302.65, 324.67] },
        { label: "Expenses", values: [118.01, 123.29, 147.23, 174.56, 152.60, 167.57, 148.54, 285.53, 308.52] },
        { label: "Operating Profit", values: [-1.39, 9.52, 7.54, 8.99, 4.48, 16.09, 11.14, 17.12, 16.15] },
        { label: "OPM %", values: ["-1.19%", "7.17%", "4.87%", "4.90%", "2.85%", "8.76%", "6.98%", "5.66%", "4.97%"] },
        { label: "Other Income", values: [2.05, 1.93, 2.22, 1.48, 3.12, 1.15, 2.08, 3.65, 4.12] },
        { label: "Interest", values: [3.20, 3.50, 4.10, 4.80, 5.20, 6.10, 6.80, 8.50, 9.20] },
        { label: "Depreciation", values: [2.10, 2.20, 2.50, 2.80, 3.10, 3.40, 3.80, 4.20, 4.60] },
        { label: "Profit before tax", values: [-4.64, 5.75, 3.16, 2.87, -0.70, 7.74, 2.56, 8.07, 6.47] },
        { label: "Tax %", values: ["25%", "33%", "30%", "28%", "25%", "35%", "32%", "30%", "25%"] },
        { label: "Net Profit", values: [-6.19, 3.05, 0.51, 1.95, -1.03, 5.76, 3.67, 7.09, 9.90] },
        { label: "EPS in Rs", values: [-0.92, 0.46, 0.08, 0.29, -0.15, 0.86, 0.55, 1.06, 1.48] },
      ],
    },
    annualPL: {
      headers: ["Mar 22", "Mar 23", "Mar 24", "Mar 25", "Mar 26"],
      rows: [
        { label: "Sales", values: [491, 353, 436, 628, 971] },
        { label: "Expenses", values: [475, 333, 407, 598, 910] },
        { label: "Operating Profit", values: [16, 20, 28, 31, 60] },
        { label: "OPM %", values: ["3%", "6%", "6%", "5%", "6%"] },
        { label: "Other Income", values: [13, 12, 7, 11, 25] },
        { label: "Interest", values: [6, 11, 15, 22, 34] },
        { label: "Depreciation", values: [4, 9, 12, 12, 16] },
        { label: "Profit before tax", values: [19, 11, 8, 8, 35] },
        { label: "Tax %", values: ["30%", "38%", "43%", "40%", "24%"] },
        { label: "Net Profit", values: [14, 7, 5, 4, 27] },
        { label: "EPS in Rs", values: ["2.00", "0.99", "0.67", "0.67", "3.98"] },
      ],
    },
    balanceSheet: {
      headers: ["Mar 22", "Mar 23", "Mar 24", "Mar 25", "Mar 26"],
      rows: [
        { label: "Equity Capital", values: [12, 13, 13, 13, 13] },
        { label: "Reserves", values: [193, 232, 246, 249, 270] },
        { label: "Borrowings", values: [173, 176, 333, 411, 481] },
        { label: "Other Liabilities", values: [20, 23, 38, 77, 76] },
        { label: "Total Liabilities", values: [398, 443, 630, 750, 841] },
        { label: "Fixed Assets", values: [69, 181, 178, 179, 315] },
        { label: "CWIP", values: [92, 17, 87, 140, 6] },
        { label: "Investments", values: [1, 1, 2, 2, 2] },
        { label: "Other Assets", values: [236, 244, 363, 429, 518] },
        { label: "Total Assets", values: [398, 443, 630, 750, 841] },
      ],
    },
    cashFlows: {
      headers: ["Mar 22", "Mar 23", "Mar 24", "Mar 25", "Mar 26"],
      rows: [
        { label: "Cash from Operating Activity", values: [1, 27, -62, 5, -20] },
        { label: "Cash from Investing Activity", values: [-56, -41, -81, -54, 2] },
        { label: "Cash from Financing Activity", values: [35, 21, 152, 58, 37] },
        { label: "Net Cash Flow", values: [-20, 7, 9, 8, 19] },
      ],
    },
    shareholdingPattern: {
      headers: ["Jun 25", "Sep 25", "Dec 25", "Mar 26"],
      rows: [
        { label: "Promoters", values: ["42.22%", "42.23%", "42.23%", "42.30%"] },
        { label: "FIIs", values: ["0.98%", "1.01%", "1.03%", "1.04%"] },
        { label: "DIIs", values: ["0.00%", "0.00%", "1.03%", "1.03%"] },
        { label: "Public", values: ["56.80%", "56.76%", "55.73%", "55.64%"] },
      ],
    },
  },
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const findCompany = (query: string): AnalysisData | null => {
  const q = normalize(query);
  for (const [key, data] of Object.entries(MOCK_DB)) {
    if (normalize(key).includes(q) || normalize(data.company).includes(q) || normalize(data.ticker) === q) {
      return data;
    }
  }
  return null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SentimentBadge = ({ value }: { value: SentimentType }) => {
  const map: Record<SentimentType, string> = {
    positive: "bg-emerald-100 text-emerald-700 border-emerald-200",
    neutral: "bg-amber-100 text-amber-700 border-amber-200",
    negative: "bg-red-100 text-red-700 border-red-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${map[value]}`}>{value}</span>;
};

const StatusDot = ({ status }: { status: StatusType }) => {
  const map: Record<StatusType, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-red-500" };
  return <span className={`w-2 h-2 rounded-full shrink-0 ${map[status]}`} />;
};

const TrendIcon = ({ trend }: { trend: "up" | "down" | "flat" }) =>
  trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> :
    trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-red-500" /> :
      <Activity className="w-3.5 h-3.5 text-slate-400" />;

const RiskBadge = ({ level }: { level: RiskLevelType }) => {
  const map: Record<RiskLevelType, string> = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Critical: "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`px-3 py-1 rounded-lg text-[12px] font-extrabold uppercase tracking-wider border ${map[level]}`}>{level} Risk</span>;
};

// Revenue trend SVG bar chart
const RevenueChart = ({ data }: { data: RevenueDataPoint[] }) => {
  const maxRev = Math.max(...data.map(d => d.revenue));
  const H = 100;
  const W = 300;
  const barW = 34;
  const gap = (W - data.length * barW) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full h-[160px]">
      {data.map((d, i) => {
        const x = gap + i * (barW + gap);
        const revH = (d.revenue / maxRev) * H;
        const ebitH = (d.ebitda / maxRev) * H;
        return (
          <g key={i}>
            {/* Revenue bar */}
            <rect x={x} y={H - revH} width={barW} height={revH} rx="4" fill="#3d5af1" opacity="0.85" />
            {/* EBITDA bar overlay */}
            <rect x={x + 4} y={H - ebitH} width={barW - 8} height={ebitH} rx="3" fill="#10b981" opacity="0.85" />
            {/* Year label */}
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">{d.year}</text>
            {/* Value label */}
            <text x={x + barW / 2} y={H - revH - 4} textAnchor="middle" fontSize="8" fill="#3d5af1" fontWeight="700">
              {d.revenue >= 100 ? `${Math.round(d.revenue)}` : d.revenue.toFixed(1)}B
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// Capital structure horizontal bar
const CapitalBar = ({ data }: { data: { label: string; pct: number; color: string }[] }) => (
  <div className="space-y-3">
    <div className="flex h-7 rounded-xl overflow-hidden gap-0.5">
      {data.map((d, i) => (
        <div key={i} style={{ width: `${d.pct}%`, backgroundColor: d.color }}
          className="flex items-center justify-center text-[10px] font-bold text-white transition-all"
          title={`${d.label}: ${d.pct}%`}>
          {d.pct >= 15 ? `${d.pct}%` : ""}
        </div>
      ))}
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
          <span className="text-[12px] font-semibold text-slate-600">{d.label} — {d.pct}%</span>
        </div>
      ))}
    </div>
  </div>
);

// Credit event icon
const EventIcon = ({ type }: { type: DebtEvent["type"] }) => {
  if (type === "upgrade") return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (type === "downgrade") return <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />;
  if (type === "default") return <XCircle className="w-4 h-4 text-red-600 shrink-0" />;
  if (type === "restructure") return <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />;
  if (type === "repayment") return <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />;
  return <DollarSign className="w-4 h-4 text-indigo-400 shrink-0" />; // issuance
};

// Typing animation hook
const useTypingAnimation = (text: string, active: boolean, speed = 10) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += speed;
      if (i >= text.length) { setDisplayed(text); setDone(true); clearInterval(interval); }
      else setDisplayed(text.slice(0, i));
    }, 30);
    return () => clearInterval(interval);
  }, [text, active]);
  return { displayed, done };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FinancialTableCard = ({
  id,
  title,
  subtitle,
  tableData
}: {
  id: string;
  title: string;
  subtitle: string;
  tableData?: FinancialTable;
}) => {
  if (!tableData) return null;

  return (
    <div id={id} className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6 scroll-mt-40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-extrabold text-[#1a2256] uppercase tracking-wider">{title}</h3>
          <p className="text-[12px] text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[#1a2256]">
              <th className="py-3 px-4 font-bold text-[11px] uppercase tracking-wider text-slate-400 w-[220px]">Metric</th>
              {tableData.headers.map((h, i) => (
                <th key={i} className="py-3 px-3 font-bold text-[11px] uppercase tracking-wider text-slate-500 text-right">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tableData.rows.map((row, i) => {
              const isStrong = [
                "operating profit",
                "net profit",
                "total liabilities",
                "total assets",
                "net cash flow",
                "cash conversion cycle"
              ].includes(row.label.toLowerCase());

              return (
                <tr
                  key={i}
                  className={`hover:bg-slate-50/80 transition-colors ${isStrong ? "bg-slate-50/50 font-bold" : ""
                    }`}
                >
                  <td className={`py-3 px-4 text-slate-700 font-medium ${isStrong ? "text-[#1a2256]" : ""}`}>
                    {row.label}
                  </td>
                  {row.values.map((v, valIdx) => (
                    <td
                      key={valIdx}
                      className={`py-3 px-3 text-right text-slate-600 font-semibold ${isStrong ? "text-[#1a2256]" : ""
                        }`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MarketScanPage = () => {
  const navigate = useNavigate();
  const { logoUrl, appName } = useBranding();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [analysisActive, setAnalysisActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { displayed: aiTyped, done: aiDone } = useTypingAnimation(result?.aiSummary || "", analysisActive);

  const suggestions = ["COASTCORP", "NVIDIA", "Apple", "Tesla"];

  const handleSearch = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setQuery(term);
    setIsLoading(true);
    setResult(null);
    setNotFound(false);
    setAnalysisActive(false);
    await new Promise(r => setTimeout(r, 1800));
    const found = findCompany(term);
    setIsLoading(false);
    if (found) {
      setResult(found);
      setTimeout(() => {
        setAnalysisActive(true);
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } else {
      setNotFound(true);
    }
  };

  const insightIcon = (type: "action" | "watch" | "opportunity") => {
    if (type === "action") return <Target className="w-4 h-4 text-red-500 shrink-0" />;
    if (type === "watch") return <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />;
    return <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0" />;
  };
  const insightBg = (type: "action" | "watch" | "opportunity") =>
    type === "action" ? "bg-red-50 border-red-200" :
      type === "watch" ? "bg-amber-50 border-amber-200" :
        "bg-indigo-50 border-indigo-200";

  return (
    <div className="min-h-screen bg-[#f0f4ff] font-['Inter',sans-serif]">

      {/* ── Header ── */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20 sticky top-0 z-50">
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative h-full px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={() => navigate("/corporate-deals")}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                <Crosshair className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">Corporate X-Ray</h1>
                <p className="text-[12px] text-white/50 font-medium">AI-powered market intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-[53px] border-l border-white/30" />
            <UserProfile variant="header" />
          </div>
        </div>
      </header>

      <main className="max-w-[1020px] mx-auto px-4 py-10">

        {/* ── Hero Search ── */}
        <div className={`transition-all duration-500 ${result ? "mb-8" : "mb-14"}`}>
          {!result && (
            <div className="text-center mb-10">

              <h2 className="text-[2.6rem] font-extrabold text-[#1a2256] leading-tight mb-4 tracking-tight">
                Corporate Risk Intelligence<br />
              </h2>
              <p className="text-[15px] text-slate-500 font-medium max-w-lg mx-auto">
                Enter a company name to view its financial health, creditworthiness, and risk profile.
              </p>
            </div>
          )}

          {/* Search Box */}
          <div className="relative group max-w-[700px] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 blur-xl rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center bg-white rounded-2xl border border-[#1a2256]/10 shadow-xl shadow-[#1a2256]/5 overflow-hidden">
              <Search className="w-5 h-5 text-slate-400 ml-5 shrink-0" />
              <input
                ref={inputRef} type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Enter a company name, e.g. NVIDIA, Apple, Tesla…"
                className="flex-1 px-4 py-4 text-[16px] font-medium text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                autoFocus
              />
              <button onClick={() => handleSearch()} disabled={isLoading || !query.trim()}
                className="m-2 h-10 px-5 animated-scan-btn text-white rounded-xl text-[13px] font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
                {isLoading ? "Scanning…" : "X-Ray"}
              </button>
            </div>
          </div>

          {!result && !isLoading && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <span className="text-[12px] text-slate-400 font-semibold uppercase tracking-wider">Try:</span>
              {suggestions.map(s => (
                <button key={s} onClick={() => handleSearch(s)}
                  className="px-3.5 py-1.5 bg-white border border-[#1a2256]/10 rounded-full text-[12.5px] font-semibold text-[#1a2256] hover:bg-[#1a2256] hover:text-white transition-all shadow-sm">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#1a2256]/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#1a2256] animate-spin" />
              <Crosshair className="absolute inset-0 m-auto w-6 h-6 text-[#1a2256]" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-bold text-[#1a2256] mb-1">Running Corporate X-Ray…</p>
              <p className="text-[13px] text-slate-500">Querying financial databases, credit registries and news signals</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Fetching financials", "Analysing debt structure", "Credit history scan", "Scoring risk", "Generating insights"].map((step, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-[#1a2256]/10 rounded-full text-[11px] font-semibold text-slate-500 animate-pulse" style={{ animationDelay: `${i * 280}ms` }}>{step}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Not Found ── */}
        {notFound && (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-[18px] font-bold text-slate-600 mb-2">No data found for "{query}"</p>
            <p className="text-slate-400 text-[14px]">Try searching for a publicly listed company like NVIDIA, Apple, or Tesla.</p>
            <button onClick={() => { setQuery(""); setNotFound(false); inputRef.current?.focus(); }}
              className="mt-5 flex items-center gap-2 mx-auto text-[13px] font-semibold text-[#1a2256] hover:underline">
              <RefreshCw className="w-4 h-4" /> Try another company
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* ── Results ──────────────────────────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {result && !isLoading && (
          <div ref={resultsRef} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* ① Company Header */}
            <div id="summary" className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6 scroll-mt-40">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a2256] to-[#3d5af1] flex items-center justify-center text-white text-[22px] font-extrabold shadow-lg shrink-0">
                    {result.company.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <h2 className="text-[22px] font-extrabold text-[#1a2256]">{result.company}</h2>
                      <span className="px-2 py-0.5 bg-[#1a2256]/5 border border-[#1a2256]/10 rounded text-[12px] font-bold text-[#1a2256]">{result.ticker}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium"><Building2 className="w-3.5 h-3.5" />{result.sector}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium"><Globe className="w-3.5 h-3.5" />{result.country}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium"><DollarSign className="w-3.5 h-3.5" />Mkt Cap: {result.marketCap}</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1.5 text-[13px] text-slate-500 font-medium"><Calendar className="w-3.5 h-3.5" />Est. {result.founded}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <RiskBadge level={result.lenderRiskLevel} />
                  <SentimentBadge value={result.overallSentiment} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: result.ratingColor }} />
                <span className="text-[13px] font-bold text-slate-700">Credit Rating: {result.rating}</span>
              </div>
            </div>

            {/* Sub-navigation Menu */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-2 sticky top-[80px] z-40 overflow-x-auto flex gap-1 items-center no-scrollbar">
              {[
                { label: "Summary", target: "summary" },
                { label: "Analysis (Pros/Cons)", target: "analysis" },
                { label: "Peers", target: "peers" },
                { label: "Quarters", target: "quarters" },
                { label: "Profit & Loss", target: "profit-loss" },
                { label: "Balance Sheet", target: "balance-sheet" },
                { label: "Cash Flow", target: "cash-flow" },
                { label: "Investors", target: "shareholding" },
              ].map(item => (
                <button
                  key={item.target}
                  onClick={() => {
                    const el = document.getElementById(item.target);
                    if (el) {
                      const offset = 170; // header height + sub-nav height
                      const bodyRect = document.body.getBoundingClientRect().top;
                      const elementRect = el.getBoundingClientRect().top;
                      const elementPosition = elementRect - bodyRect;
                      const offsetPosition = elementPosition - offset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                  className="px-4 py-2 hover:bg-slate-50 text-[13px] font-bold text-slate-600 hover:text-[#1a2256] rounded-xl transition-all whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ② AI Executive Summary */}
            <div className="bg-gradient-to-br from-[#1a2256] to-[#2d3a8c] rounded-2xl border border-[#1a2256]/20 shadow-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-[13px] font-extrabold uppercase tracking-widest text-white/80">AI Executive Summary</span>
              </div>
              <p className="text-[15px] leading-relaxed font-medium text-white/90">
                {aiTyped}
                {!aiDone && <span className="inline-block w-0.5 h-4 bg-white/70 animate-pulse ml-0.5 align-middle" />}
              </p>
            </div>

            {/* ③ Key Financials */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Key Financials</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.financials.map((f, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</span>
                      <TrendIcon trend={f.trend} />
                    </div>
                    <span className="text-[18px] font-extrabold text-[#1a2256]">{f.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ④ Revenue & EBITDA Trend */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1a2256]" />
                  <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Revenue & EBITDA Trend (5Y)</h3>
                </div>
                <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#3d5af1] inline-block opacity-85" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block opacity-85" />EBITDA</span>
                </div>
              </div>
              <RevenueChart data={result.revenueHistory} />
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">Values in USD billions</p>
            </div>

            {/* ⑤ Debt Profile & Credit History — NEW KEY CARD */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-slate-900 to-[#1a2256] border-b border-[#1a2256]/20">
                <CreditCard className="w-4 h-4 text-indigo-300" />
                <h3 className="text-[13px] font-extrabold text-white uppercase tracking-wider">Debt Profile & Credit History</h3>
                <div className="ml-auto">
                  {result.debtProfile.covenantStatus === "ok"
                    ? <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold">Covenants OK</span>
                    : result.debtProfile.covenantStatus === "warn"
                      ? <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-bold">Covenant Watch</span>
                      : <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-[11px] font-bold">Covenant Breach</span>}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Debt summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Debt", value: result.debtProfile.totalDebt, icon: <DollarSign className="w-4 h-4 text-slate-400" /> },
                    { label: "Net Debt", value: result.debtProfile.netDebt, icon: <BarChart3 className="w-4 h-4 text-slate-400" /> },
                    { label: "Cash Position", value: result.debtProfile.cashPosition, icon: <ShieldCheck className="w-4 h-4 text-emerald-500" /> },
                    { label: "Wtd. Avg. Cost", value: result.debtProfile.weightedAvgCost, icon: <Activity className="w-4 h-4 text-slate-400" /> },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span></div>
                      <span className="text-[15px] font-extrabold text-[#1a2256]">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Additional debt details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <PieChart className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fixed vs Floating</p><p className="text-[13px] font-bold text-slate-700">{result.debtProfile.fixedVsFloating}</p></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nearest Maturity</p><p className="text-[13px] font-bold text-slate-700">{result.debtProfile.nearestMaturity}</p></div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <Zap className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Covenant Headroom</p><p className="text-[13px] font-bold text-slate-700">{result.debtProfile.covenantHeadroom}</p></div>
                  </div>
                </div>

                {/* Active Facilities */}
                <div>
                  <h4 className="text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Active Debt Facilities</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12.5px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Instrument", "Amount", "Maturity", "Rate", "Status"].map(h => (
                            <th key={h} className="pb-2.5 font-bold text-slate-400 uppercase tracking-wider text-[10.5px] pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {result.debtProfile.facilities.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 pr-4 font-semibold text-slate-700">{f.name}</td>
                            <td className="py-2.5 pr-4 font-bold text-[#1a2256]">{f.amount}</td>
                            <td className="py-2.5 pr-4 text-slate-600">{f.maturity}</td>
                            <td className="py-2.5 pr-4 text-slate-600">{f.rate}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${f.status === "current" ? "bg-emerald-50 text-emerald-700" : f.status === "watch" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Credit History Timeline */}
                <div>
                  <h4 className="text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider mb-3">Credit History Timeline</h4>
                  <div className="relative pl-6 space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-[9px] top-3 bottom-3 w-0.5 bg-slate-200 rounded" />
                    {result.debtProfile.creditHistory.map((ev, i) => (
                      <div key={i} className="flex items-start gap-3 py-3 relative">
                        <div className="absolute left-[-15px] top-4 bg-white">
                          <EventIcon type={ev.type} />
                        </div>
                        <div className="flex-1 min-w-0 pl-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold text-slate-700">{ev.event}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              {ev.amount !== "—" && (
                                <span className="text-[12px] font-bold text-[#1a2256] bg-[#1a2256]/5 px-2 py-0.5 rounded">{ev.amount}</span>
                              )}
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{ev.year}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ⑥ Capital Structure */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <PieChart className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Capital Structure</h3>
              </div>
              <CapitalBar data={result.capitalStructure} />
            </div>

            {/* ⑦ Strengths & Risks / Pros & Cons */}
            {result.pros && result.cons ? (
              <div id="analysis" className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6 scroll-mt-40">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-[#1a2256]" />
                  <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Analysis (Pros & Cons)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="pros">
                    <p className="text-[14px] font-bold text-emerald-600 mb-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pros
                    </p>
                    <ul className="space-y-2.5">
                      {result.pros.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-700 font-medium">
                          <span className="text-emerald-500 font-bold mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="cons">
                    <p className="text-[14px] font-bold text-amber-600 mb-3 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Cons
                    </p>
                    <ul className="space-y-2.5">
                      {result.cons.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-700 font-medium">
                          <span className="text-amber-500 font-bold mt-0.5">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-5 pt-3 border-t border-slate-100 font-medium flex items-center gap-1">
                  <span>* The pros and cons are machine generated. Please exercise caution.</span>
                </p>
              </div>
            ) : (
              <div id="analysis" className="grid grid-cols-1 md:grid-cols-2 gap-5 scroll-mt-40">
                <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Strengths</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-700 font-medium">
                        <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Key Risks</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {result.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-slate-700 font-medium">
                        <ChevronRight className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ⑧ Credit Indicators */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <ShieldCheck className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Credit Indicators</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {result.creditIndicators.map((ind, i) => (
                  <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={ind.status} />
                      <span className="text-[13.5px] font-semibold text-slate-700">{ind.label}</span>
                    </div>
                    <span className={`text-[13px] font-extrabold ${ind.status === "ok" ? "text-emerald-600" : ind.status === "warn" ? "text-amber-600" : "text-red-600"}`}>
                      {ind.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ⑨ Peer Benchmarking */}
            <div id="peers" className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6 scroll-mt-40">
              <div className="flex items-center gap-2 mb-5">
                <Crosshair className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Peer Benchmarking</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Company", "Ticker", "Credit Score", "Debt/EBITDA", "EBITDA Margin"].map(h => (
                        <th key={h} className="pb-3 font-bold text-slate-400 uppercase tracking-wider text-[10.5px] pr-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {/* Subject company row */}
                    <tr className="bg-indigo-50/60">
                      <td className="py-3 pr-5 font-bold text-[#1a2256]">{result.company}</td>
                      <td className="py-3 pr-5 font-bold text-indigo-600">{result.ticker}</td>
                      <td className="py-3 pr-5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[80px] h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.financials[0] ? 82 : 70}%` }} />
                          </div>
                          <span className="font-bold text-indigo-600">82</span>
                        </div>
                      </td>
                      <td className="py-3 pr-5 font-semibold text-slate-700">{result.financials.find(f => f.label === "Debt / EBITDA")?.value || "—"}</td>
                      <td className="py-3 font-semibold text-slate-700">{result.financials.find(f => f.label === "EBITDA Margin")?.value || "—"}</td>
                    </tr>
                    {result.peers.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 pr-5 font-semibold text-slate-700">{p.name}</td>
                        <td className="py-3 pr-5 text-slate-500 font-medium">{p.ticker}</td>
                        <td className="py-3 pr-5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px] h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-400 rounded-full" style={{ width: `${p.score}%` }} />
                            </div>
                            <span className="font-semibold text-slate-600">{p.score}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-5 text-slate-600">{p.debtEbitda}</td>
                        <td className="py-3 text-slate-600">{p.margin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Screener Financial Tables */}
            {result.quarterlyResults && (
              <FinancialTableCard
                id="quarters"
                title="Quarterly Results"
                subtitle="Figures in Rs. Crores / Consolidated"
                tableData={result.quarterlyResults}
              />
            )}

            {result.annualPL && (
              <FinancialTableCard
                id="profit-loss"
                title="Profit & Loss"
                subtitle="Annual Figures in Rs. Crores / Consolidated"
                tableData={result.annualPL}
              />
            )}

            {result.balanceSheet && (
              <FinancialTableCard
                id="balance-sheet"
                title="Balance Sheet"
                subtitle="Consolidated Figures in Rs. Crores"
                tableData={result.balanceSheet}
              />
            )}

            {result.cashFlows && (
              <FinancialTableCard
                id="cash-flow"
                title="Cash Flows"
                subtitle="Consolidated Figures in Rs. Crores"
                tableData={result.cashFlows}
              />
            )}

            {result.shareholdingPattern && (
              <FinancialTableCard
                id="shareholding"
                title="Shareholding Pattern"
                subtitle="Numbers in percentages"
                tableData={result.shareholdingPattern}
              />
            )}

            {/* ⑩ AI Actionable Insights */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lightbulb className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">AI Actionable Insights for Lenders</h3>
              </div>
              <div className="space-y-3">
                {result.aiInsights.map((ins, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${insightBg(ins.type)}`}>
                    <div className="flex items-start gap-2.5">
                      {insightIcon(ins.type)}
                      <div>
                        <p className="text-[13.5px] font-bold text-slate-800 mb-1">{ins.title}</p>
                        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{ins.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ⑪ Recent News */}
            <div className="bg-white rounded-2xl border border-[#e0e3f5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Newspaper className="w-4 h-4 text-[#1a2256]" />
                <h3 className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Recent News & Market Signals</h3>
              </div>
              <div className="space-y-3">
                {result.recentNews.map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <SentimentBadge value={n.sentiment} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-semibold text-slate-800 leading-snug">{n.headline}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11.5px] font-bold text-slate-400">{n.source}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11.5px] text-slate-400">{n.date}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* ⑫ Lender Assessment Banner */}
            <div className={`rounded-2xl border shadow-sm p-6 ${result.lenderRiskLevel === "Low" ? "bg-emerald-50 border-emerald-200" : result.lenderRiskLevel === "Medium" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-start gap-3">
                <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${result.lenderRiskLevel === "Low" ? "text-emerald-600" : result.lenderRiskLevel === "Medium" ? "text-amber-600" : "text-red-600"}`} />
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="text-[13px] font-extrabold text-[#1a2256] uppercase tracking-wider">Lender Assessment</span>
                    <RiskBadge level={result.lenderRiskLevel} />
                  </div>
                  <p className="text-[14px] font-medium text-slate-700 leading-relaxed">{result.lenderRiskComment}</p>
                </div>
              </div>
            </div>

            {/* Source attribution */}
            <p className="text-center text-[11.5px] text-slate-400 pb-6">
              Analysis generated by AI using publicly available data. Not investment advice. Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketScanPage;
