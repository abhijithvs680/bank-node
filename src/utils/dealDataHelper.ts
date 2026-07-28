export const riskFactorsData = [
  {
    riskFactor: "Borrower failed to submit Q4 financial statements within the agreed timeline.",
    clause: "Financial Reporting Covenant 5.2",
    instruction: "Allow Rectification",
    status: "Resolved",
    resolvedMatter: "Financial statements submitted after 14-day extension."
  },
  {
    riskFactor: "Debt Service Coverage Ratio (DSCR) fell below the minimum threshold of 1.25.",
    clause: "Financial Covenant 7.1",
    instruction: "Reservation of Right to be Issued",
    status: "Resolved",
    resolvedMatter: "Borrower provided revised cash flow projections and additional security."
  },
  {
    riskFactor: "Notification of delayed Interest payment due to temporary liquidity issues.",
    clause: "Payment Covenant 3.4",
    instruction: "Request Technical/Legal Advice",
    status: "Resolved",
    resolvedMatter: "Legal review completed and short-term waiver approved."
  },
  {
    riskFactor: "Interest payment overdue by 15 days.",
    clause: "Payment Default Clause 8.1",
    instruction: "Waive the Breach",
    status: "Resolved",
    resolvedMatter: "Payment received with penalty interest."
  },
  {
    riskFactor: "Borrower exceeded permitted leverage ratio for the second consecutive quarter.",
    clause: "Financial Covenant 7.3",
    instruction: "Reservation of Right to be Issued",
    status: "Open",
    resolvedMatter: "Awaiting borrower's remediation plan."
  },
  {
    riskFactor: "Insurance certificate for pledged assets expired and was not renewed.",
    clause: "Insurance Covenant 6.4",
    instruction: "Allow Rectification",
    status: "Resolved",
    resolvedMatter: "Updated insurance documents received."
  },
  {
    riskFactor: "Repeated breach of leverage ratio and DSCR requirements.",
    clause: "Financial Covenant 7.1 & 7.3",
    instruction: "Request Technical/Legal Advice",
    status: "Under Review",
    resolvedMatter: "External advisor assessing enforcement options."
  },
  {
    riskFactor: "Borrower failed to provide management accounts for the third time within six months.",
    clause: "Reporting Covenant 5.4",
    instruction: "Reservation of Right to be Issued",
    status: "Open",
    resolvedMatter: "Pending borrower response."
  },
  {
    riskFactor: "Principal repayment missed by 30 days.",
    clause: "Event of Default Clause 9.1",
    instruction: "Accelerate Loan",
    status: "In Progress",
    resolvedMatter: "Formal default notice issued to borrower."
  },
  {
    riskFactor: "Borrower requested waiver following acceleration notice and proposed restructuring.",
    clause: "Event of Default Clause 9.1",
    instruction: "Waive the Breach",
    status: "Under Review",
    resolvedMatter: "Restructuring proposal under lender consideration."
  }
];

export const getLoanHealthData = (consultationId: string) => {
  switch (consultationId) {
    case "6008": // Apollo Syndication
      return {
        score: 78,
        label: "Healthy",
        trend: "Stable",
        comment: "Strong liquidity and covenant compliance offset moderate leverage concerns.",
        topRiskDrivers: [
          { text: "High initial CapEx leverage", impact: "High Impact" },
          { text: "Changes in feed-in tariffs", impact: "Medium Impact" }
        ]
      };
    case "6009": // Project Horizon
      return {
        score: 85,
        label: "Excellent",
        trend: "Improving",
        comment: "Robust cash reserve account and government guarantees support high debt service coverage.",
        topRiskDrivers: [
          { text: "Construction delay risk", impact: "Medium Impact" },
          { text: "Supply chain disruptions", impact: "Medium Impact" }
        ]
      };
    case "6007": // Apex Leverage
      return {
        score: 64,
        label: "Moderate",
        trend: "Declining",
        comment: "Elevated LBO leverage and lease obligations are offset by solid e-commerce cash flows.",
        topRiskDrivers: [
          { text: "Consumer spending downturn", impact: "High Impact" },
          { text: "Elevated LBO leverage", impact: "High Impact" }
        ]
      };
    case "1001": // Orion Manufacturing
    default:
      return {
        score: 72,
        label: "Healthy",
        trend: "Stable",
        comment: "Underlying financials remain stable but 2 open covenant breaches (BR-1005, BR-1008) and overdue Q1/Q2 reporting increase near-term risk. Active monitoring required.",
        topRiskDrivers: [
          { text: "Repeated DSCR covenant breach", impact: "High Impact" },
          { text: "Principal repayment overdue", impact: "High Impact" },
          { text: "Leverage ratio above threshold", impact: "Medium Impact" },
          { text: "Delayed interest payments", impact: "Medium Impact" },
          { text: "Missing financial reporting", impact: "Medium Impact" },
          { text: "Expired insurance on pledged assets", impact: "Low Impact" },
          { text: "Repeated reporting non-compliance", impact: "Low Impact" },
          { text: "Pending borrower remediation plan", impact: "Low Impact" }
        ]
      };
  }
};

export const getBorrowerDetailsData = (consultationId: string) => {
  switch (consultationId) {
    case '6008': // Apollo Syndication
      return {
        companyName: 'Apollo Energy Group Holdings',
        dealName: 'Apollo Syndication',
        dealId: '#AG261072',
        currency: 'USD',
        contact: {
          name: 'Ranjith K R',
          email: 'ranjith@abc.com',
          position: 'Group Finance Director',
          type: 'Primary Contact',
        },
      };
    case '6009': // Project Horizon
      return {
        companyName: 'Horizon Infrastructure Corp',
        dealName: 'Project Horizon',
        dealId: '#AG261073',
        currency: 'ZAR',
        contact: {
          name: 'Shilpa S',
          email: 'shilpa@abc.com',
          position: 'Chief Treasury Officer',
          type: 'Primary Contact',
        },
      };
    case '6007': // Apex Leverage
      return {
        companyName: 'Apex Retail Group Ltd',
        dealName: 'Apex Leverage',
        dealId: '#AG261071',
        currency: 'GBP',
        contact: {
          name: 'Priyanka R',
          email: 'priyanka@abc.com',
          position: 'Head of Group Funding',
          type: 'Primary Contact',
        },
      };
    case '1001': // Orion Manufacturing
    default:
      return {
        companyName: 'ORION MANUFACTURING HOLDINGS LIMITED',
        dealName: 'ORION MANUFACTURING HOLDINGS LIMITED',
        dealId: '#AG261070',
        currency: 'ZAR',
        contact: {
          name: 'Hariraj',
          email: 'hariraj@orionman.co.za',
          position: 'Head of Treasury',
          type: 'Primary Contact',
        },
      };
  }
};

export const getSwotAnalysisData = (consultationId: string) => {
  switch (consultationId) {
    case '6008': // Apollo Syndication
      return {
        strengths: ["Strong contracted cash flows backed by long-term Power Purchase Agreements (PPAs).", "Established track record of successful utility-scale solar and wind project executions.", "Strong relationship with Tier-1 equipment manufacturers ensuring supply priority."],
        weaknesses: ["High upfront capital expenditure (CapEx) requirements leading to high initial leverage.", "Sensitivity to changes in renewable energy feed-in tariffs and local subsidy schemes.", "Seasonal variability in generation profiles affecting short-term revenue consistency."],
        opportunities: ["Integration of Battery Energy Storage Systems (BESS) to capture peak-tariff pricing.", "Expansion into emerging green hydrogen production initiatives.", "Favorable national policies pushing for rapid transition to net-zero emissions."],
        threats: ["Grid congestion and curtailment risks due to slow national transmission upgrades.", "Global interest rate hikes increasing cost of capital for future project pipelines.", "Supply chain disruptions causing delays in panel and turbine deliveries."]
      };
    case '6009': // Project Horizon
      return {
        strengths: ["Strategic sovereign guarantees backing the primary off-take agreements.", "Diversified infrastructure project portfolio minimizing asset-specific operational risks.", "Secured long-term operational and maintenance (O&M) contracts with reputable global firms."],
        weaknesses: ["Exposure to cross-border currency fluctuations affecting unhedged revenue streams.", "Heavy reliance on specialized expatriate engineering talent for core project phases.", "Complex multi-jurisdictional regulatory approvals causing timeline delays."],
        opportunities: ["Expansion into adjacent markets with similar infrastructural deficits.", "Potential for refinancing at lower rates once construction risk is mitigated.", "Strategic partnerships with global multilateral development banks."],
        threats: ["Political instability in key operational jurisdictions affecting project continuity.", "Unforeseen geological or environmental challenges leading to cost overruns.", "Changes in international trade tariffs affecting the cost of imported raw materials."]
      };
    case '6007': // Apex Leverage
      return {
        strengths: ["Leading market share in high-margin specialized retail segments.", "Strong brand equity and loyal customer base established over 40 years.", "Robust omnichannel distribution network with integrated logistics."],
        weaknesses: ["High operating leverage making cash flows sensitive to revenue dips.", "Significant exposure to short-term fashion and seasonal inventory risks.", "Historical underinvestment in digital storefronts relative to pure-play competitors."],
        opportunities: ["Strategic acquisition of distressed competitors to consolidate market share.", "Expansion of private-label product lines to enhance gross margins.", "Leveraging customer data analytics for targeted loyalty programs."],
        threats: ["Aggressive pricing strategies from global e-commerce giants entering the market.", "Macroeconomic downturns negatively impacting discretionary consumer spending.", "Supply chain bottlenecks affecting seasonal inventory availability."]
      };
    case '1001': // Orion Manufacturing
    default:
      return {
        strengths: ["Dominant supplier of specialized alloys to the regional automotive sector.", "Long-term fixed-price contracts securing baseline revenues.", "Proprietary forging technology providing a competitive edge over generic manufacturers."],
        weaknesses: ["Exposed to interest rate risk on project-level floating debt.", "High energy consumption making operations sensitive to power tariff hikes.", "Aging capital equipment in primary facilities requiring imminent upgrades."],
        opportunities: ["Diversification into aerospace and defense component manufacturing.", "Adoption of green manufacturing practices to access ESG-linked financing.", "Strategic joint ventures with international technology partners."],
        threats: ["Volatility in raw material (scrap steel, rare earth metals) pricing.", "Intensifying competition from lower-cost manufacturing hubs in Asia.", "Stricter environmental regulations increasing compliance and operational costs."]
      };
  }
};

export const getBorrowerFinancialsData = (consultationId: string) => {
  switch (consultationId) {
    case '1001':
    default:
      return {
        ticker: "ORN",
        website: "https://orionman.co.za",
        currencySymbol: "R",
        about: "ORION MANUFACTURING HOLDINGS LIMITED operates heavy-industrial manufacturing facilities producing specialized metal alloy forgings, structural steel elements, and precision assemblies for the mining, automotive, and heavy machinery sectors.",
        ratios: [
          { name: "Market Cap", value: "4,850", prefix: "", suffix: " M" },
          { name: "Current Price", value: "88.50", prefix: "R ", suffix: "" },
          { name: "High / Low", value: "98.00 / 62.00", prefix: "R ", suffix: "" },
          { name: "Stock P/E", value: "14.2", prefix: "", suffix: "" },
          { name: "Book Value", value: "42.60", prefix: "R ", suffix: "" },
          { name: "Dividend Yield", value: "3.50", prefix: "", suffix: "%" },
          { name: "ROCE", value: "21.6", prefix: "", suffix: "%" },
          { name: "ROE", value: "19.8", prefix: "", suffix: "%" },
          { name: "Debt to Equity", value: "0.65", prefix: "", suffix: "" }
        ]
      };
  }
};

import {
  formatParticipantsForPrompt,
  getDealParticipants,
  type DealParticipant,
} from './dealParticipants';

/** Injomo appends these on every workflow response row; re-posting them breaks triggers. */
const INJOMO_RESPONSE_META_KEYS = new Set(['jsCodes', 'workflow_log_id', '']);

/**
 * Clean facility update body for bankagentsdataupdatereciever.
 * Strips injomo response metadata and nested objects; keeps scalar business fields + dealId.
 */
export function buildFacilityUpdatePayload(
  dealId: string,
  facility: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(facility)) {
    if (!key || INJOMO_RESPONSE_META_KEYS.has(key)) continue;
    if (value !== null && typeof value === 'object') continue;
    cleaned[key] = value;
  }
  cleaned.dealId = dealId;
  return cleaned;
}

export const getAllStaticContextForDeal = (dealId: string, basePatientData: any, facilitiesData: any[] = [], dealFiles: any[] = []) => {
  const participants = getDealParticipants(dealId);
  return {
    DealDetails: basePatientData,
    BorrowerDetails: getBorrowerDetailsData(dealId),
    DealParticipants: participants,
    DealParticipantsFormatted: formatParticipantsForPrompt(participants),
    HealthScoreAndTopRisks: getLoanHealthData(dealId),
    SwotAnalysis: getSwotAnalysisData(dealId),
    FinancialsAndKeyRatios: getBorrowerFinancialsData(dealId),
    RiskFactorsList: riskFactorsData,
    Facilities: facilitiesData,
    DealFiles: dealFiles,
  };
};

export type { DealParticipant };
