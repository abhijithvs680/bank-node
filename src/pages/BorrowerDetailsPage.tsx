import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, User2, Mail, Briefcase, Phone, MapPin, Landmark, 
  DollarSign, FileText, Check, ShieldCheck, ShieldAlert, Sparkles, AlertTriangle,
  TrendingUp, BarChart3, Building2, ExternalLink, Globe, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserProfile from '@/components/UserProfile';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function BorrowerDetailsPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();
  const [activeMetric, setActiveMetric] = useState<'Price' | 'Sales' | 'PE'>('Price');
  const [riskStatusFilter, setRiskStatusFilter] = useState<'All' | 'Open' | 'In Progress' | 'Under Review' | 'Resolved'>('All');

  const riskFactorsData = [
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

  const filteredRiskData = riskFactorsData.filter(row => 
    riskStatusFilter === 'All' ? true : row.status === riskStatusFilter
  );

  // Mock mapping of deal ID to borrower metadata
  const getBorrowerDetails = () => {
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
            phone: '+1 212 555 0192',
            address: '500 Fifth Avenue, New York, NY 10110, USA',
            type: 'Primary Contact'
          },
          bank: {
            beneficiaryBank: 'Citibank N.A.',
            currency: 'USD',
            iban: 'US89CITI00001233234234',
            accountName: '1233',
            accountNumber: '234234',
            correspondingBankName: 'Citibank N.A.',
            correspondingBank: 'CITIUS33XXX',
            instructionCode: 'A01',
            paymentMethod: 'C',
            referenceNumber: 'REF-APOLLO-002',
            address: '388 Greenwich St, New York, NY 10013',
            swiftAddress: 'CITIUS33',
            reference: 'Apollo Funding Drawdown'
          }
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
            phone: '+27 11 888 1234',
            address: '100 Grayston Drive, Sandton, Johannesburg, 2196',
            type: 'Primary Contact'
          },
          bank: {
            beneficiaryBank: 'Nedbank Limited',
            currency: 'ZAR',
            iban: 'N/A',
            accountName: '1233',
            accountNumber: '234234',
            correspondingBankName: 'Nedbank',
            correspondingBank: 'NEDSZAJJ',
            instructionCode: 'A01',
            paymentMethod: 'C',
            referenceNumber: 'REF-HORIZON-003',
            address: '135 Rivonia Road, Sandton, Johannesburg',
            swiftAddress: 'NEDSZAJJ',
            reference: 'Horizon Project Disbursment'
          }
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
            phone: '+44 20 7946 0958',
            address: '30 St Mary Axe, London EC3A 8BF, United Kingdom',
            type: 'Primary Contact'
          },
          bank: {
            beneficiaryBank: 'Barclays Bank PLC',
            currency: 'GBP',
            iban: 'GB29BARC20001233234234',
            accountName: '1233',
            accountNumber: '234234',
            correspondingBankName: 'Barclays',
            correspondingBank: 'BARCGB22XXX',
            instructionCode: 'A01',
            paymentMethod: 'C',
            referenceNumber: 'REF-APEX-004',
            address: '1 Churchill Place, London E14 5HP',
            swiftAddress: 'BARCGB22',
            reference: 'Apex Acquisition Settlement'
          }
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
            email: 'Hariraj@abc.com',
            position: 'Head of Treasury',
            phone: '+27 11 345 6789',
            address: '15 Alice Lane, Sandton, Johannesburg, 2196',
            type: 'Primary Contact'
          },
          bank: {
            beneficiaryBank: 'ABSA',
            currency: 'ZAR',
            iban: 'N/A',
            accountName: '1233',
            accountNumber: '234234',
            correspondingBankName: 'ABSA',
            correspondingBank: 'ABSA Bank Limited',
            instructionCode: 'A01',
            paymentMethod: 'C',
            referenceNumber: 'REF-ORION-001',
            address: '170 Main Street, Johannesburg',
            swiftAddress: 'ABSZZAJJ',
            reference: 'Orion Manufacturing Deal Drawdown'
          }
        };
    }
  };

  const getSwotAnalysis = () => {
    switch (consultationId) {
      case '6008': // Apollo Syndication
        return {
          strengths: [
            "Strong contracted cash flows backed by long-term Power Purchase Agreements (PPAs).",
            "Established track record of successful utility-scale solar and wind project executions.",
            "Strong relationship with Tier-1 equipment manufacturers ensuring supply priority."
          ],
          weaknesses: [
            "High upfront capital expenditure (CapEx) requirements leading to high initial leverage.",
            "Sensitivity to changes in renewable energy feed-in tariffs and local subsidy schemes.",
            "Seasonal variability in generation profiles affecting short-term revenue consistency."
          ],
          opportunities: [
            "Integration of Battery Energy Storage Systems (BESS) to capture peak-tariff pricing.",
            "Expansion into emerging green hydrogen production initiatives.",
            "Favorable national policies pushing for rapid transition to net-zero emissions."
          ],
          threats: [
            "Grid congestion and curtailment risks due to slow national transmission upgrades.",
            "Global interest rate hikes increasing cost of capital for future project pipelines.",
            "Supply chain disruptions causing delays in panel and turbine deliveries."
          ]
        };
      case '6009': // Project Horizon
        return {
          strengths: [
            "Backed by strategic Public-Private Partnerships (PPP) with sovereign guarantees.",
            "Diversified infrastructure project portfolio minimizing asset-specific operational risks.",
            "Experienced project management team with deep local regulatory expertise."
          ],
          weaknesses: [
            "Exposure to South African Rand (ZAR) volatility affecting foreign-currency debt service.",
            "Historically long construction timelines with vulnerability to labor strikes.",
            "High dependency on municipal compliance and administrative efficiency."
          ],
          opportunities: [
            "Rapid urbanization driving critical demand for road, water, and transport networks.",
            "Eligibility for sustainable green/ESG bond issuance at lower financing costs.",
            "Potential for regional expansion into neighboring SADC countries."
          ],
          threats: [
            "Macroeconomic volatility and sovereign credit rating downgrades.",
            "Inflationary pressure on core construction materials (steel, cement, copper).",
            "Complex land acquisition disputes delaying project timelines."
          ]
        };
      case '6007': // Apex Leverage
        return {
          strengths: [
            "Dominant market position in the UK retail sector with high brand equity.",
            "Omnichannel sales model with 40%+ revenue driven by high-margin e-commerce.",
            "Efficient private-label supply network yielding superior gross margins."
          ],
          weaknesses: [
            "Elevated debt-to-equity ratio following the recent leveraged buyout (LBO).",
            "High fixed-lease obligations for prime high-street store locations.",
            "Exposure to shifts in discretionary consumer spending power."
          ],
          opportunities: [
            "Expansion of digital marketplace model to host third-party vendors.",
            "Portfolio rationalization by closing underperforming brick-and-mortar stores.",
            "Deployment of AI-driven demand forecasting to minimize inventory holding costs."
          ],
          threats: [
            "Aggressive price competition from pure-play online retailers.",
            "Wage inflation and rising labor costs affecting warehouse and retail operations.",
            "Stricter ESG disclosure requirements for supply chain environmental footprints."
          ]
        };
      case '1001': // Orion Manufacturing
      default:
        return {
          strengths: [
            "Proprietary tooling and precision manufacturing processes creating high barriers to entry.",
            "Multi-year supply contracts with diversified tier-1 automotive and industrial clients.",
            "ISO-certified facilities with high automation rates and low defect levels."
          ],
          weaknesses: [
            "Concentration of revenue (50%+) among top three corporate clients.",
            "High electricity consumption exposing operations to utility tariff increases.",
            "Capital-intensive modernization required for aging legacy manufacturing lines."
          ],
          opportunities: [
            "Adoption of Industry 4.0 IoT technologies for predictive machine maintenance.",
            "Growing demand for lightweight component manufacturing for Electric Vehicles (EVs).",
            "Strategic acquisition of local component suppliers to vertically integrate."
          ],
          threats: [
            "Volatility in base metal prices (aluminum, steel, copper) squeezing margins.",
            "Skilled labor shortages in engineering and advanced machining roles.",
            "Changes in environmental regulations demanding zero-carbon manufacturing footprints."
          ]
        };
    }
  };

  const getBorrowerFinancials = () => {
    switch (consultationId) {
      case '6008': // Apollo Syndication
        return {
          currencySymbol: '$',
          ticker: 'NYSE: APEL',
          website: 'https://apolloenergy.com',
          about: "Apollo Energy Group Holdings is a leading developer and operator of utility-scale solar, wind, and battery storage projects. The company operates across North America and Europe, delivering clean energy under long-term Power Purchase Agreements (PPAs) to corporate and municipal offtakers.",
          ratios: [
            { name: "Market Cap", value: "18,450", suffix: " M" },
            { name: "Current Price", value: "54.20", prefix: "$" },
            { name: "High / Low", value: "62.80 / 38.50", prefix: "$" },
            { name: "Stock P/E", value: "24.5" },
            { name: "Book Value", value: "18.60", prefix: "$" },
            { name: "Dividend Yield", value: "1.85", suffix: "%" },
            { name: "ROCE", value: "14.8", suffix: "%" },
            { name: "ROE", value: "16.2", suffix: "%" },
            { name: "Debt to Equity", value: "1.45" }
          ],
          pros: [
            "Strong revenue visibility from long-term PPAs (average duration 15 years).",
            "Reduced leverage over the past two fiscal years, improving solvency.",
            "Healthy growth pipeline in BESS (Battery Energy Storage Systems) capacity."
          ],
          cons: [
            "High capital intensity requiring constant external debt financing.",
            "Vulnerable to grid transmission bottlenecks in key operational hubs.",
            "Exposed to interest rate risk on project-level floating debt."
          ],
          chartData: [
            { name: 'Jul 25', Price: 42, Sales: 450, PE: 21 },
            { name: 'Aug 25', Price: 44, Sales: 460, PE: 21.5 },
            { name: 'Sep 25', Price: 45, Sales: 480, PE: 22 },
            { name: 'Oct 25', Price: 47, Sales: 490, PE: 22.5 },
            { name: 'Nov 25', Price: 48, Sales: 510, PE: 23 },
            { name: 'Dec 25', Price: 49, Sales: 520, PE: 23.2 },
            { name: 'Jan 26', Price: 51, Sales: 535, PE: 23.8 },
            { name: 'Feb 26', Price: 53, Sales: 550, PE: 24.1 },
            { name: 'Mar 26', Price: 54.20, Sales: 590, PE: 24.5 }
          ],
          peers: [
            { name: 'Apollo Energy Group (Active)', price: '$54.20', pe: '24.5', mcap: '$18.45B', dividend: '1.85%', netProfitQtr: '$52.0M', qtrProfitVar: '15.6%', salesQtr: '$590M', qtrSalesVar: '11.3%', roce: '14.8%', active: true },
            { name: 'NextEra Energy', price: '$78.60', pe: '28.1', mcap: '$153.2B', dividend: '2.50%', netProfitQtr: '$1.42B', qtrProfitVar: '8.4%', salesQtr: '$6.85B', qtrSalesVar: '6.2%', roce: '9.2%' },
            { name: 'Brookfield Renewable', price: '$26.40', pe: '32.4', mcap: '$17.20B', dividend: '5.10%', netProfitQtr: '$118M', qtrProfitVar: '12.1%', salesQtr: '$1.35B', qtrSalesVar: '9.5%', roce: '6.8%' },
            { name: 'Orsted A/S', price: '$64.50', pe: '19.8', mcap: '$27.10B', dividend: '2.20%', netProfitQtr: '$310M', qtrProfitVar: '-4.2%', salesQtr: '$2.80B', qtrSalesVar: '-1.8%', roce: '11.5%' }
          ],
          quarters: [
            { period: "Sep 2024", Sales: "490", Expenses: "380", OperatingProfit: "110", OPM: "22.4%", Interest: "28", Depreciation: "22", ProfitBeforeTax: "60", TaxRate: "25%", NetProfit: "45", EPS: "0.90" },
            { period: "Dec 2024", Sales: "510", Expenses: "395", OperatingProfit: "115", OPM: "22.5%", Interest: "27", Depreciation: "23", ProfitBeforeTax: "65", TaxRate: "24%", NetProfit: "49", EPS: "0.98" },
            { period: "Mar 2025", Sales: "540", Expenses: "410", OperatingProfit: "130", OPM: "24.1%", Interest: "25", Depreciation: "25", ProfitBeforeTax: "80", TaxRate: "25%", NetProfit: "60", EPS: "1.20" },
            { period: "Jun 2025", Sales: "590", Expenses: "440", OperatingProfit: "150", OPM: "25.4%", Interest: "24", Depreciation: "26", ProfitBeforeTax: "100", TaxRate: "26%", NetProfit: "74", EPS: "1.48" }
          ],
          annual: [
            { period: "FY2023", Sales: "1,650", Expenses: "1,280", OperatingProfit: "370", OPM: "22.4%", Interest: "115", Depreciation: "85", ProfitBeforeTax: "170", TaxRate: "24%", NetProfit: "129", EPS: "2.58", Payout: "25%" },
            { period: "FY2024", Sales: "1,880", Expenses: "1,450", OperatingProfit: "430", OPM: "22.9%", Interest: "105", Depreciation: "90", ProfitBeforeTax: "235", TaxRate: "25%", NetProfit: "176", EPS: "3.52", Payout: "28%" },
            { period: "FY2025", Sales: "2,130", Expenses: "1,610", OperatingProfit: "520", OPM: "24.4%", Interest: "98", Depreciation: "98", ProfitBeforeTax: "324", TaxRate: "25%", NetProfit: "243", EPS: "4.86", Payout: "30%" }
          ],
          growth: [
            { metric: "Compounded Sales Growth", ttm: "13%", yr3: "18%", yr5: "22%" },
            { metric: "Compounded Profit Growth", ttm: "18%", yr3: "24%", yr5: "29%" },
            { metric: "Stock Price CAGR", ttm: "29%", yr3: "15%", yr5: "18%" },
            { metric: "Return on Equity (ROE)", ttm: "16.2%", yr3: "15.1%", yr5: "14.5%" }
          ]
        };
      case '6009': // Project Horizon
        return {
          currencySymbol: 'R ',
          ticker: 'JSE: HZN',
          website: 'https://horizoninfra.co.za',
          about: "Horizon Infrastructure Corp specializes in large-scale civil engineering, transport infrastructure, and public-private partnership (PPP) concessions. It is a major player in road network developments, port expansions, and municipal water treatment plants in Sub-Saharan Africa.",
          ratios: [
            { name: "Market Cap", value: "9,250", suffix: " M" },
            { name: "Current Price", value: "185.00", prefix: "R " },
            { name: "High / Low", value: "210.00 / 140.00", prefix: "R " },
            { name: "Stock P/E", value: "12.8" },
            { name: "Book Value", value: "112.00", prefix: "R " },
            { name: "Dividend Yield", value: "4.20", suffix: "%" },
            { name: "ROCE", value: "18.5", suffix: "%" },
            { name: "ROE", value: "15.6", suffix: "%" },
            { name: "Debt to Equity", value: "0.85" }
          ],
          pros: [
            "Strategic sovereign guarantees in place for primary road infrastructure concessions.",
            "Diversified order book valued over R 25 Billion (representing 3 years revenue).",
            "Consistently high dividend payout ratio (>40%) with excellent cash flow backing."
          ],
          cons: [
            "Extended working capital cycle averaging 90 days due to municipal billing cycles.",
            "Susceptible to delays in national and provincial treasury budget allocations.",
            "Inflationary pressures on raw materials (bitumen, steel, cement) squeezing concessions."
          ],
          chartData: [
            { name: 'Jul 25', Price: 152, Sales: 2100, PE: 11.2 },
            { name: 'Aug 25', Price: 158, Sales: 2200, PE: 11.5 },
            { name: 'Sep 25', Price: 160, Sales: 2300, PE: 11.7 },
            { name: 'Oct 25', Price: 165, Sales: 2400, PE: 12.0 },
            { name: 'Nov 25', Price: 168, Sales: 2500, PE: 12.1 },
            { name: 'Dec 25', Price: 172, Sales: 2550, PE: 12.3 },
            { name: 'Jan 26', Price: 176, Sales: 2650, PE: 12.4 },
            { name: 'Feb 26', Price: 181, Sales: 2750, PE: 12.6 },
            { name: 'Mar 26', Price: 185, Sales: 2900, PE: 12.8 }
          ],
          peers: [
            { name: 'Horizon Infra Corp (Active)', price: 'R 185.00', pe: '12.8', mcap: 'R 9.25B', dividend: '4.20%', netProfitQtr: 'R 225M', qtrProfitVar: '21.6%', salesQtr: 'R 2.9B', qtrSalesVar: '16.0%', roce: '18.5%', active: true },
            { name: 'Raubex Group', price: 'R 42.10', pe: '11.5', mcap: 'R 7.60B', dividend: '3.80%', netProfitQtr: 'R 182M', qtrProfitVar: '14.5%', salesQtr: 'R 2.4B', qtrSalesVar: '11.2%', roce: '20.1%' },
            { name: 'Wilson Bayly WBHO', price: 'R 135.20', pe: '14.1', mcap: 'R 11.40B', dividend: '2.90%', netProfitQtr: 'R 284M', qtrProfitVar: '9.8%', salesQtr: 'R 3.8B', qtrSalesVar: '7.5%', roce: '16.4%' },
            { name: 'Murray & Roberts', price: 'R 15.50', pe: '28.4', mcap: 'R 3.10B', dividend: '0.00%', netProfitQtr: 'R -45M', qtrProfitVar: '-120%', salesQtr: 'R 1.2B', qtrSalesVar: '-15.4%', roce: '4.2%' }
          ],
          quarters: [
            { period: "Sep 2024", Sales: "2,200", Expenses: "1,850", OperatingProfit: "350", OPM: "15.9%", Interest: "42", Depreciation: "58", ProfitBeforeTax: "250", TaxRate: "28%", NetProfit: "180", EPS: "3.60" },
            { period: "Dec 2024", Sales: "2,400", Expenses: "2,010", OperatingProfit: "390", OPM: "16.3%", Interest: "40", Depreciation: "60", ProfitBeforeTax: "290", TaxRate: "28%", NetProfit: "208", EPS: "4.16" },
            { period: "Mar 2025", Sales: "2,600", Expenses: "2,150", OperatingProfit: "450", OPM: "17.3%", Interest: "38", Depreciation: "62", ProfitBeforeTax: "350", TaxRate: "29%", NetProfit: "248", EPS: "4.96" },
            { period: "Jun 2025", Sales: "2,900", Expenses: "2,380", OperatingProfit: "520", OPM: "17.9%", Interest: "35", Depreciation: "65", ProfitBeforeTax: "420", TaxRate: "28%", NetProfit: "302", EPS: "6.04" }
          ],
          annual: [
            { period: "FY2023", Sales: "8,100", Expenses: "6,920", OperatingProfit: "1,180", OPM: "14.6%", Interest: "182", Depreciation: "210", ProfitBeforeTax: "788", TaxRate: "28%", NetProfit: "567", EPS: "11.34", Payout: "38%" },
            { period: "FY2024", Sales: "9,200", Expenses: "7,810", OperatingProfit: "1,390", OPM: "15.1%", Interest: "165", Depreciation: "230", ProfitBeforeTax: "995", TaxRate: "28%", NetProfit: "716", EPS: "14.32", Payout: "40%" },
            { period: "FY2025", Sales: "10,100", Expenses: "8,430", OperatingProfit: "1,670", OPM: "16.5%", Interest: "155", Depreciation: "245", ProfitBeforeTax: "1,270", TaxRate: "29%", NetProfit: "901", EPS: "18.02", Payout: "42%" }
          ],
          growth: [
            { metric: "Compounded Sales Growth", ttm: "16%", yr3: "12%", yr5: "9%" },
            { metric: "Compounded Profit Growth", ttm: "21%", yr3: "15%", yr5: "11%" },
            { metric: "Stock Price CAGR", ttm: "24%", yr3: "8%", yr5: "6%" },
            { metric: "Return on Equity (ROE)", ttm: "15.6%", yr3: "14.9%", yr5: "13.2%" }
          ]
        };
      case '6007': // Apex Leverage
        return {
          currencySymbol: '£',
          ticker: 'LSE: APX',
          website: 'https://apexretail.co.uk',
          about: "Apex Retail Group Ltd is a major omnichannel retailer in the United Kingdom, operating a premium network of high-street stores alongside a rapidly expanding digital marketplace platform. The group specializes in fashion, homeware, and lifestyle products.",
          ratios: [
            { name: "Market Cap", value: "2,450", suffix: " M" },
            { name: "Current Price", value: "4.25", prefix: "£" },
            { name: "High / Low", value: "5.10 / 3.15", prefix: "£" },
            { name: "Stock P/E", value: "18.2" },
            { name: "Book Value", value: "1.45", prefix: "£" },
            { name: "Dividend Yield", value: "2.10", suffix: "%" },
            { name: "ROCE", value: "22.4", suffix: "%" },
            { name: "ROE", value: "25.8", suffix: "%" },
            { name: "Debt to Equity", value: "2.10" }
          ],
          pros: [
            "Highly efficient retail operations generating superior cash-conversion cycles.",
            "High digital penetration (45% of total sales) shielding high-street margins.",
            "Excellent inventory turnaround times averaging 12 turns per annum."
          ],
          cons: [
            "Highly leveraged balance sheet as a consequence of LBO debt structure.",
            "Substantial lease liabilities representing prime high-street locations.",
            "Exposed to highly cyclical UK consumer confidence and wage pressures."
          ],
          chartData: [
            { name: 'Jul 25', Price: 3.30, Sales: 580, PE: 15.1 },
            { name: 'Aug 25', Price: 3.45, Sales: 595, PE: 15.5 },
            { name: 'Sep 25', Price: 3.60, Sales: 610, PE: 15.9 },
            { name: 'Oct 25', Price: 3.75, Sales: 630, PE: 16.3 },
            { name: 'Nov 25', Price: 3.82, Sales: 645, PE: 16.8 },
            { name: 'Dec 25', Price: 3.95, Sales: 660, PE: 17.2 },
            { name: 'Jan 26', Price: 4.05, Sales: 685, PE: 17.5 },
            { name: 'Feb 26', Price: 4.18, Sales: 700, PE: 17.9 },
            { name: 'Mar 26', Price: 4.25, Sales: 720, PE: 18.2 }
          ],
          peers: [
            { name: 'Apex Retail Group (Active)', price: '£4.25', pe: '18.2', mcap: '£2.45B', dividend: '2.10%', netProfitQtr: '£42M', qtrProfitVar: '19.4%', salesQtr: '£720M', qtrSalesVar: '14.2%', roce: '22.4%', active: true },
            { name: 'Next PLC', price: '£85.40', pe: '14.5', mcap: '£10.85B', dividend: '2.90%', netProfitQtr: '£195M', qtrProfitVar: '8.1%', salesQtr: '£1.42B', qtrSalesVar: '5.6%', roce: '26.8%' },
            { name: 'Marks & Spencer', price: '£2.85', pe: '11.8', mcap: '£5.60B', dividend: '3.10%', netProfitQtr: '£112M', qtrProfitVar: '15.2%', salesQtr: '£3.10B', qtrSalesVar: '6.4%', roce: '15.2%' },
            { name: 'Frasers Group', price: '£8.20', pe: '9.5', mcap: '£3.80B', dividend: '0.00%', netProfitQtr: '£84M', qtrProfitVar: '5.5%', salesQtr: '£1.15B', qtrSalesVar: '4.8%', roce: '18.5%' }
          ],
          quarters: [
            { period: "Sep 2024", Sales: "600", Expenses: "510", OperatingProfit: "90", OPM: "15.0%", Interest: "18", Depreciation: "12", ProfitBeforeTax: "60", TaxRate: "20%", NetProfit: "48", EPS: "0.08" },
            { period: "Dec 2024", Sales: "630", Expenses: "530", OperatingProfit: "100", OPM: "15.9%", Interest: "18", Depreciation: "12", ProfitBeforeTax: "70", TaxRate: "19%", NetProfit: "57", EPS: "0.10" },
            { period: "Mar 2025", Sales: "670", Expenses: "560", OperatingProfit: "110", OPM: "16.4%", Interest: "17", Depreciation: "13", ProfitBeforeTax: "80", TaxRate: "20%", NetProfit: "64", EPS: "0.11" },
            { period: "Jun 2025", Sales: "720", Expenses: "600", OperatingProfit: "120", OPM: "16.7%", Interest: "16", Depreciation: "14", ProfitBeforeTax: "90", TaxRate: "21%", NetProfit: "71", EPS: "0.12" }
          ],
          annual: [
            { period: "FY2023", Sales: "2,150", Expenses: "1,830", OperatingProfit: "320", OPM: "14.9%", Interest: "75", Depreciation: "45", ProfitBeforeTax: "200", TaxRate: "20%", NetProfit: "160", EPS: "0.27", Payout: "18%" },
            { period: "FY2024", Sales: "2,380", Expenses: "2,010", OperatingProfit: "370", OPM: "15.5%", Interest: "72", Depreciation: "48", ProfitBeforeTax: "250", TaxRate: "20%", NetProfit: "200", EPS: "0.33", Payout: "20%" },
            { period: "FY2025", Sales: "2,620", Expenses: "2,200", OperatingProfit: "420", OPM: "16.0%", Interest: "69", Depreciation: "52", ProfitBeforeTax: "299", TaxRate: "21%", NetProfit: "236", EPS: "0.39", Payout: "21%" }
          ],
          growth: [
            { metric: "Compounded Sales Growth", ttm: "14%", yr3: "11%", yr5: "8%" },
            { metric: "Compounded Profit Growth", ttm: "19%", yr3: "13%", yr5: "7%" },
            { metric: "Stock Price CAGR", ttm: "22%", yr3: "9%", yr5: "5%" },
            { metric: "Return on Equity (ROE)", ttm: "25.8%", yr3: "24.1%", yr5: "22.0%" }
          ]
        };
      case '1001': // Orion Manufacturing
      default:
        return {
          currencySymbol: 'R ',
          ticker: 'JSE: ORN',
          website: 'https://orionman.co.za',
          about: "ORION MANUFACTURING HOLDINGS LIMITED operates heavy-industrial manufacturing facilities producing specialized metal alloy forgings, structural steel elements, and precision assemblies for the mining, automotive, and heavy machinery sectors.",
          ratios: [
            { name: "Market Cap", value: "4,850", suffix: " M" },
            { name: "Current Price", value: "88.50", prefix: "R " },
            { name: "High / Low", value: "98.00 / 62.00", prefix: "R " },
            { name: "Stock P/E", value: "14.2" },
            { name: "Book Value", value: "42.60", prefix: "R " },
            { name: "Dividend Yield", value: "3.50", suffix: "%" },
            { name: "ROCE", value: "21.6", suffix: "%" },
            { name: "ROE", value: "19.8", suffix: "%" },
            { name: "Debt to Equity", value: "0.65" }
          ],
          pros: [
            "Proprietary manufacturing patents create significant industrial moat.",
            "Long-term agreements with top-tier mining conglomerates ensuring demand.",
            "Excellent operating margins (>18%) driven by advanced robotic automation."
          ],
          cons: [
            "High customer concentration risk with top 3 clients generating 50% sales.",
            "Sensitive to energy tariff adjustments in power-intensive manufacturing processes.",
            "CapEx requirements for upgrading older production lines in legacy plants."
          ],
          chartData: [
            { name: 'Jul 25', Price: 68, Sales: 1100, PE: 12.0 },
            { name: 'Aug 25', Price: 70, Sales: 1150, PE: 12.4 },
            { name: 'Sep 25', Price: 74, Sales: 1220, PE: 12.6 },
            { name: 'Oct 25', Price: 78, Sales: 1250, PE: 13.0 },
            { name: 'Nov 25', Price: 80, Sales: 1280, PE: 13.2 },
            { name: 'Dec 25', Price: 82, Sales: 1300, PE: 13.5 },
            { name: 'Jan 26', Price: 84, Sales: 1380, PE: 13.8 },
            { name: 'Feb 26', Price: 86, Sales: 1420, PE: 14.0 },
            { name: 'Mar 26', Price: 88.50, Sales: 1500, PE: 14.2 }
          ],
          peers: [
            { name: 'Orion Man. Holdings (Active)', price: 'R 88.50', pe: '14.2', mcap: 'R 4.85B', dividend: '3.50%', netProfitQtr: 'R 118M', qtrProfitVar: '23.6%', salesQtr: 'R 1.5B', qtrSalesVar: '18.2%', roce: '21.6%', active: true },
            { name: 'Bell Equipment', price: 'R 28.50', pe: '11.2', mcap: 'R 2.80B', dividend: '2.50%', netProfitQtr: 'R 65M', qtrProfitVar: '14.5%', salesQtr: 'R 950M', qtrSalesVar: '9.4%', roce: '18.4%' },
            { name: 'Invicta Holdings', price: 'R 34.60', pe: '9.8', mcap: 'R 3.40B', dividend: '4.10%', netProfitQtr: 'R 88M', qtrProfitVar: '8.2%', salesQtr: 'R 1.2B', qtrSalesVar: '6.5%', roce: '15.9%' },
            { name: 'Argent Industrial', price: 'R 18.20', pe: '7.5', mcap: 'R 1.80B', dividend: '5.20%', netProfitQtr: 'R 42M', qtrProfitVar: '19.5%', salesQtr: 'R 620M', qtrSalesVar: '11.5%', roce: '24.2%' }
          ],
          quarters: [
            { period: "Sep 2024", Sales: "1,150", Expenses: "945", OperatingProfit: "205", OPM: "17.8%", Interest: "16", Depreciation: "24", ProfitBeforeTax: "165", TaxRate: "28%", NetProfit: "119", EPS: "2.38" },
            { period: "Dec 2024", Sales: "1,220", Expenses: "998", OperatingProfit: "222", OPM: "18.2%", Interest: "15", Depreciation: "25", ProfitBeforeTax: "182", TaxRate: "28%", NetProfit: "131", EPS: "2.62" },
            { period: "Mar 2025", Sales: "1,350", Expenses: "1,100", OperatingProfit: "250", OPM: "18.5%", Interest: "14", Depreciation: "26", ProfitBeforeTax: "210", TaxRate: "29%", NetProfit: "149", EPS: "2.98" },
            { period: "Jun 2025", Sales: "1,500", Expenses: "1,210", OperatingProfit: "290", OPM: "19.3%", Interest: "12", Depreciation: "28", ProfitBeforeTax: "250", TaxRate: "28%", NetProfit: "180", EPS: "3.60" }
          ],
          annual: [
            { period: "FY2023", Sales: "4,200", Expenses: "3,480", OperatingProfit: "720", OPM: "17.1%", Interest: "62", Depreciation: "90", ProfitBeforeTax: "568", TaxRate: "28%", NetProfit: "409", EPS: "8.18", Payout: "30%" },
            { period: "FY2024", Sales: "4,600", Expenses: "3,780", OperatingProfit: "820", OPM: "17.8%", Interest: "58", Depreciation: "95", ProfitBeforeTax: "667", TaxRate: "28%", NetProfit: "480", EPS: "9.60", Payout: "32%" },
            { period: "FY2025", Sales: "5,200", Expenses: "4,210", OperatingProfit: "990", OPM: "19.0%", Interest: "52", Depreciation: "102", ProfitBeforeTax: "836", TaxRate: "29%", NetProfit: "594", EPS: "11.88", Payout: "35%" }
          ],
          growth: [
            { metric: "Compounded Sales Growth", ttm: "13%", yr3: "11%", yr5: "8%" },
            { metric: "Compounded Profit Growth", ttm: "18%", yr3: "14%", yr5: "11%" },
            { metric: "Stock Price CAGR", ttm: "21%", yr3: "10%", yr5: "7%" },
            { metric: "Return on Equity (ROE)", ttm: "19.8%", yr3: "18.9%", yr5: "17.4%" }
          ]
        };
    }
  };

  const borrower = getBorrowerDetails();
  const swot = getSwotAnalysis();
  const financials = getBorrowerFinancials();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 145; // offsets for sticky header + sticky sub-nav
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const renderRatioVal = (val: string | number, prefix?: string, suffix?: string) => {
    return `${prefix || ''}${val}${suffix || ''}`;
  };

  return (
    <div className="min-h-screen bg-[#ebeef9] font-['Inter'] pb-12">
      {/* Header - Gradient Theme */}
      <header className="relative overflow-hidden bg-[#1a2256] h-20 sticky top-0 z-50">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 w-[400px] h-full bg-gradient-to-r from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[200%] bg-indigo-500/5 rotate-12 blur-[100px] pointer-events-none" />

        <div className="relative h-full px-6 md:px-12 lg:px-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(`/deals/${consultationId}`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 text-white group-hover:text-white transition-colors" />
            </button>

            <div className="h-8 w-[1px] bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-bold bg-white/10 text-white/95 px-2 py-0.5 rounded border border-white/20 uppercase">
                    Borrower Details
                  </span>
                  <span className="text-white/30 font-light">|</span>
                  <span className="text-[12px] font-medium text-white/50">
                    Deal: {borrower.dealName} ({borrower.dealId})
                  </span>
                </div>
                <h1 className="text-[18px] font-bold text-white mt-1 leading-tight">
                  {borrower.companyName}
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserProfile variant="header" />
          </div>
        </div>
      </header>

      {/* Sticky Sub-Navigation */}
      <div className="bg-white/90 backdrop-blur sticky top-20 z-40 border-b border-[#e0e3f5] shadow-sm mb-6">
        <div className="max-w-6xl mx-auto px-6 h-12 flex items-center gap-6 overflow-x-auto select-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'risk-factors', label: 'Risk Factors' },
            { id: 'chart', label: 'Chart' },
            { id: 'swot', label: 'SWOT Analysis' },
            { id: 'peers', label: 'Peers' },
            { id: 'quarters', label: 'Quarters' },
            { id: 'profit-loss', label: 'Profit & Loss' },
            { id: 'contacts', label: 'Contacts & Bank' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className="text-[13px] font-bold text-slate-500 hover:text-[#1a2256] transition-colors border-b-2 border-transparent hover:border-[#1a2256] h-full px-2"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 space-y-6">

        {/* SECTION 1: OVERVIEW */}
        <section id="overview" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase">
                  {financials.ticker}
                </span>
              </div>
              <h2 className="text-[18px] font-bold text-[#1a2256] mt-1">
                {borrower.companyName}
              </h2>
            </div>
            <a 
              href={financials.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <Globe className="w-4 h-4" />
              <span>{financials.website.replace('https://', '')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            {/* About description (Col-Span-1) */}
            <div className="lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">About Borrower</h3>
                <p className="text-[14px] font-medium text-slate-600 leading-relaxed">
                  {financials.about}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Current Price</span>
                  <span className="text-[20px] font-extrabold text-slate-800">
                    {renderRatioVal(financials.ratios[1].value, financials.ratios[1].prefix, financials.ratios[1].suffix)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PE Ratio</span>
                  <span className="text-[20px] font-extrabold text-slate-800">
                    {financials.ratios[3].value}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Ratios (Col-Span-2) */}
            <div className="lg:col-span-2 border-l lg:border-l border-slate-100 lg:pl-8">
              <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-4">Key Ratios</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {financials.ratios.map((ratio, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-2 flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-400">{ratio.name}</span>
                    <span className="text-[15px] font-bold text-slate-800 mt-0.5">
                      {renderRatioVal(ratio.value, ratio.prefix, ratio.suffix)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1.5: RISK FACTORS & CLAUSES */}
        <section id="risk-factors" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider flex items-center gap-2 font-['Inter']">
                <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
                Covenant Violations & Risk Factors
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                AI-powered tracking of compliance breach events and resolution actions
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-[11.5px] font-bold self-start sm:self-center">
              {(['All', 'Open', 'In Progress', 'Under Review', 'Resolved'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setRiskStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    riskStatusFilter === status
                      ? 'bg-white text-[#1a2256] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* AI Insights Summary Alert Banner */}
            <div className="bg-gradient-to-r from-violet-50/70 to-indigo-50/70 border border-violet-100 rounded-[14px] p-4 flex gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-200 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
              </div>
              <div className="text-[13px] leading-relaxed">
                <span className="font-extrabold text-violet-950 uppercase tracking-wide block mb-0.5 font-['Inter']">AI Risk Summary</span>
                <span className="text-slate-600 font-medium font-['Inter']">
                  Covenant tracking detects <strong className="text-violet-900 font-bold">10 breach events</strong>. 
                  5 breaches have been successfully <strong className="text-emerald-700 font-bold">Resolved</strong>, 3 remain <strong className="text-amber-700 font-bold">Under Review/In Progress</strong>, and 2 reporting/leverage compliance issues are currently <strong className="text-rose-700 font-bold">Open</strong>. Close oversight is recommended on missed principal repayments (Event of Default 9.1).
                </span>
              </div>
            </div>

            {/* Risk Factors Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e0e3f5] bg-[#edf2f9]/20 text-[10px] text-[#1a2256] font-bold uppercase tracking-wider">
                    <th className="text-left py-2 px-4 w-[30%] font-['Inter']">Risk Factor (Request Description)</th>
                    <th className="text-left py-2 px-4 w-[20%] font-['Inter']">Clause Reference</th>
                    <th className="text-left py-2 px-4 w-[20%] font-['Inter']">Instruction Executed</th>
                    <th className="text-center py-2 px-4 w-[10%] font-['Inter']">Status</th>
                    <th className="text-left py-2 px-4 w-[20%] font-['Inter']">Resolved Matter / Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiskData.length > 0 ? (
                    filteredRiskData.map((row, idx) => (
                      <tr 
                        key={idx}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-all text-left"
                      >
                        {/* Risk Factor */}
                        <td className="py-2.5 px-4 font-bold text-slate-800 leading-normal font-['Inter']">
                          {row.riskFactor}
                        </td>
                        {/* Clause Reference */}
                        <td className="py-2.5 px-4">
                          <span className="inline-block font-mono text-[9.5px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {row.clause}
                          </span>
                        </td>
                        {/* Instruction Executed */}
                        <td className="py-2.5 px-4 font-semibold text-slate-700 font-['Inter']">
                          {row.instruction}
                        </td>
                        {/* Status */}
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-bold border uppercase tracking-wider whitespace-nowrap select-none font-['Inter'] ${
                            row.status === 'Resolved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : row.status === 'Open'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : row.status === 'Under Review'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        {/* Resolved Matter */}
                        <td className="py-2.5 px-4 text-slate-600 font-medium leading-relaxed font-['Inter']">
                          {row.resolvedMatter}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium font-['Inter']">
                        No risk factors found matching the selected status filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 2: TREND CHART */}
        <section id="chart" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Trend Analysis
            </h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5 text-[12px]">
              {(['Price', 'Sales', 'PE'] as const).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                    activeMetric === metric 
                      ? 'bg-white text-[#1a2256] shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {metric === 'Price' ? 'Share Price' : metric === 'Sales' ? 'Quarterly Sales' : 'PE Ratio'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financials.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={activeMetric === 'Price' ? '#1a2256' : activeMetric === 'Sales' ? '#10b981' : '#f59e0b'} 
                        stopOpacity={0.2}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={activeMetric === 'Price' ? '#1a2256' : activeMetric === 'Sales' ? '#10b981' : '#f59e0b'} 
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#edf2f9" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value;
                        const formatted = activeMetric === 'Sales' 
                          ? renderRatioVal(val, financials.currencySymbol, 'M')
                          : activeMetric === 'PE'
                          ? val
                          : renderRatioVal(val, financials.currencySymbol);
                        return (
                          <div className="bg-white/95 backdrop-blur border border-[#e0e3f5] p-3 rounded-[12px] shadow-lg text-left">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                            <p className="text-[15px] font-bold text-[#1a2256] mt-0.5">{activeMetric}: {formatted}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetric} 
                    stroke={activeMetric === 'Price' ? '#1a2256' : activeMetric === 'Sales' ? '#10b981' : '#f59e0b'} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* SECTION 3: SWOT ANALYSIS */}
        <section id="swot" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left">
            <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
              SWOT Analysis
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Strengths Card */}
            <div className="border border-emerald-200/60 rounded-[16px] bg-emerald-50/20 overflow-hidden flex flex-col">
              <div className="bg-emerald-50/50 px-5 py-3.5 border-b border-emerald-100 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-[14px] font-bold text-emerald-950 uppercase tracking-wider">Strengths (S)</span>
              </div>
              <div className="p-5 flex-1 bg-white">
                <ul className="space-y-3">
                  {swot.strengths.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-emerald-500 font-bold text-[18px] leading-none select-none">•</span>
                      <span className="text-[14px] font-medium text-slate-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Weaknesses Card */}
            <div className="border border-amber-200/60 rounded-[16px] bg-emerald-50/20 overflow-hidden flex flex-col">
              <div className="bg-amber-50/50 px-5 py-3.5 border-b border-amber-100 flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <span className="text-[14px] font-bold text-amber-950 uppercase tracking-wider">Weaknesses (W)</span>
              </div>
              <div className="p-5 flex-1 bg-white">
                <ul className="space-y-3">
                  {swot.weaknesses.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-amber-500 font-bold text-[18px] leading-none select-none">•</span>
                      <span className="text-[14px] font-medium text-slate-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Opportunities Card */}
            <div className="border border-blue-200/60 rounded-[16px] bg-blue-50/20 overflow-hidden flex flex-col">
              <div className="bg-blue-50/50 px-5 py-3.5 border-b border-blue-100 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-[14px] font-bold text-blue-950 uppercase tracking-wider">Opportunities (O)</span>
              </div>
              <div className="p-5 flex-1 bg-white">
                <ul className="space-y-3">
                  {swot.opportunities.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-blue-500 font-bold text-[18px] leading-none select-none">•</span>
                      <span className="text-[14px] font-medium text-slate-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Threats Card */}
            <div className="border border-rose-200/60 rounded-[16px] bg-rose-50/20 overflow-hidden flex flex-col">
              <div className="bg-rose-50/50 px-5 py-3.5 border-b border-rose-100 flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span className="text-[14px] font-bold text-rose-950 uppercase tracking-wider">Threats (T)</span>
              </div>
              <div className="p-5 flex-1 bg-white">
                <ul className="space-y-3">
                  {swot.threats.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-rose-500 font-bold text-[18px] leading-none select-none">•</span>
                      <span className="text-[14px] font-medium text-slate-700 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: PEER COMPARISON */}
        <section id="peers" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left">
            <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
              Peer Comparison
            </h2>
          </div>
          
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-[#e0e3f5] bg-[#edf2f9]/20 text-[12px] text-[#1a2256] font-bold uppercase tracking-wider">
                  <th className="text-left py-3 px-4">S.No.</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">P/E</th>
                  <th className="text-right py-3 px-4">Market Cap</th>
                  <th className="text-right py-3 px-4">Div Yield</th>
                  <th className="text-right py-3 px-4">Qtr Profit</th>
                  <th className="text-right py-3 px-4">Profit Var</th>
                  <th className="text-right py-3 px-4">Qtr Sales</th>
                  <th className="text-right py-3 px-4">Sales Var</th>
                  <th className="text-right py-3 px-4">ROCE</th>
                </tr>
              </thead>
              <tbody>
                {financials.peers.map((peer, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-all ${
                      peer.active ? 'bg-blue-50/50 font-bold text-[#1a2256]' : 'text-slate-700'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-left font-semibold">{idx + 1}</td>
                    <td className="py-3.5 px-4 text-left font-bold">{peer.name}</td>
                    <td className="py-3.5 px-4 text-right">{peer.price}</td>
                    <td className="py-3.5 px-4 text-right font-semibold">{peer.pe}</td>
                    <td className="py-3.5 px-4 text-right">{peer.mcap}</td>
                    <td className="py-3.5 px-4 text-right">{peer.dividend}</td>
                    <td className="py-3.5 px-4 text-right">{peer.netProfitQtr}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
                      peer.qtrProfitVar.startsWith('-') ? 'text-red-600' : 'text-emerald-600'
                    }`}>{peer.qtrProfitVar}</td>
                    <td className="py-3.5 px-4 text-right">{peer.salesQtr}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
                      peer.qtrSalesVar.startsWith('-') ? 'text-red-600' : 'text-emerald-600'
                    }`}>{peer.qtrSalesVar}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800">{peer.roce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 5: QUARTERLY RESULTS */}
        <section id="quarters" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left">
            <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
              Quarterly Results
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Consolidated Figures in {financials.currencySymbol} Millions
            </p>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="border-b border-[#e0e3f5] bg-[#edf2f9]/20 text-[12px] text-[#1a2256] font-bold uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Parameters</th>
                  {financials.quarters.map((q, idx) => (
                    <th key={idx} className="text-right py-3 px-4">{q.period}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'Sales', label: 'Sales +' },
                  { key: 'Expenses', label: 'Expenses +' },
                  { key: 'OperatingProfit', label: 'Operating Profit', isBold: true },
                  { key: 'OPM', label: 'OPM %' },
                  { key: 'Interest', label: 'Interest' },
                  { key: 'Depreciation', label: 'Depreciation' },
                  { key: 'ProfitBeforeTax', label: 'Profit before tax', isBold: true },
                  { key: 'TaxRate', label: 'Tax %' },
                  { key: 'NetProfit', label: 'Net Profit +', isBold: true },
                  { key: 'EPS', label: 'EPS' }
                ].map((row, idx) => (
                  <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50/70 transition-all ${
                    row.isBold ? 'bg-slate-50 font-bold text-slate-800' : 'text-slate-600'
                  }`}>
                    <td className="py-3 px-4 text-left font-bold">{row.label}</td>
                    {financials.quarters.map((q: any, qIdx) => (
                      <td key={qIdx} className="py-3 px-4 text-right font-semibold">{q[row.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 6: PROFIT & LOSS */}
        <section id="profit-loss" className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm">
          <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5] text-left">
            <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
              Profit & Loss (Annual)
            </h2>
            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
              Consolidated Figures in {financials.currencySymbol} Millions
            </p>
          </div>

          <div className="p-6 space-y-8">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e0e3f5] bg-[#edf2f9]/20 text-[12px] text-[#1a2256] font-bold uppercase tracking-wider">
                    <th className="text-left py-3 px-4">Parameters</th>
                    {financials.annual.map((yr, idx) => (
                      <th key={idx} className="text-right py-3 px-4">{yr.period}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'Sales', label: 'Sales +' },
                    { key: 'Expenses', label: 'Expenses +' },
                    { key: 'OperatingProfit', label: 'Operating Profit', isBold: true },
                    { key: 'OPM', label: 'OPM %' },
                    { key: 'Interest', label: 'Interest' },
                    { key: 'Depreciation', label: 'Depreciation' },
                    { key: 'ProfitBeforeTax', label: 'Profit before tax', isBold: true },
                    { key: 'TaxRate', label: 'Tax %' },
                    { key: 'NetProfit', label: 'Net Profit +', isBold: true },
                    { key: 'EPS', label: 'EPS' },
                    { key: 'Payout', label: 'Dividend Payout %' }
                  ].map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50/70 transition-all ${
                      row.isBold ? 'bg-slate-50 font-bold text-slate-800' : 'text-slate-600'
                    }`}>
                      <td className="py-3 px-4 text-left font-bold">{row.label}</td>
                      {financials.annual.map((yr: any, yIdx) => (
                        <td key={yIdx} className="py-3 px-4 text-right font-semibold">{yr[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Growth Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-left">
              {financials.growth.map((g, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                  <h4 className="text-[12px] font-bold text-[#1a2256] uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-600" />
                    {g.metric.replace('Compounded ', '').replace(' (ROE)', '')}
                  </h4>
                  <div className="space-y-2 text-[13px] font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>TTM:</span>
                      <span className="font-bold text-slate-800">{g.ttm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>3 Years:</span>
                      <span className="font-bold text-slate-800">{g.yr3}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>5 Years:</span>
                      <span className="font-bold text-slate-800">{g.yr5}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: CONTACTS & BANK DETAILS */}
        <section id="contacts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Card 1: Contact Details */}
          <div className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm lg:col-span-1">
            <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5]">
              <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
                Contact Details
              </h2>
            </div>
            <div className="p-6 space-y-6 text-left">
              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Name</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <User2 className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-bold text-slate-800">{borrower.contact.name}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Email</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-semibold text-blue-600 hover:underline cursor-pointer">
                    {borrower.contact.email}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Position Held</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-medium text-slate-700">{borrower.contact.position}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Contact Type</span>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold bg-[#e0f7fa] text-[#006064] border border-[#b2ebf2]">
                    <Check className="w-3.5 h-3.5" />
                    {borrower.contact.type}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-medium text-slate-700">{borrower.contact.phone}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Address</span>
                <div className="flex items-start gap-2 mt-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[14px] font-medium text-slate-600 leading-relaxed">
                    {borrower.contact.address}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bank Info */}
          <div className="bg-white rounded-[20px] border border-[#e0e3f5] overflow-hidden shadow-sm lg:col-span-2">
            <div className="bg-[#edf2f9]/50 px-6 py-4 border-b border-[#e0e3f5]">
              <h2 className="text-[14px] font-bold text-[#1a2256] uppercase tracking-wider">
                Bank Info
              </h2>
            </div>

            <div className="p-6 text-left grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Beneficiary Bank</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Landmark className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.beneficiaryBank}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Corresponding Bank Name</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <Landmark className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.correspondingBankName}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Currency</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.currency}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Corresponding Bank (SWIFT)</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[15px] font-semibold text-slate-700">{borrower.bank.correspondingBank}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">IBAN</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-medium text-slate-700">{borrower.bank.iban}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Payment Instruction Code</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.instructionCode}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Beneficiary Account Name</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.accountName}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Payment Method</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-semibold text-slate-700">{borrower.bank.paymentMethod}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Beneficiary Account Number</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-bold text-slate-800">{borrower.bank.accountNumber}</span>
                </div>
              </div>

              <div>
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Reference Number</span>
                <div className="mt-1.5">
                  <span className="text-[15px] font-medium text-slate-700">{borrower.bank.referenceNumber}</span>
                </div>
              </div>

              <div className="md:col-span-2 border-t border-slate-100 pt-6">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Beneficiary Address</span>
                <div className="flex items-start gap-2 mt-1.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                  <span className="text-[14px] font-medium text-slate-600">{borrower.bank.address}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Beneficiary Swift Address</span>
                <div className="mt-1.5">
                  <span className="text-[14px] font-medium text-slate-700">{borrower.bank.swiftAddress}</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider block">Reference</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span className="text-[14px] font-medium text-slate-700">{borrower.bank.reference}</span>
                </div>
              </div>

            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
