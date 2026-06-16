import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Building2, FileText } from 'lucide-react';

interface FacilityItem {
  facilityNumber: string;
  name: string;
  type: string;
  description: string;
  origination: string;
  noOfLenders: number;
  effectiveDate: string;
  expirationDate: string;
  amount: string;
  repaymentProfile: string;
  availabilityDate: string;
  agencyFee: string;
  loan: LoanInfo;
}

interface LoanInfo {
  loanId: string;
  principalBalance: string;
  interestRateType: string;
  currentPeriodStart: string;
  loanAmount: string;
  maturityDate: string;
  interestRatePeriod: string;
  currentPeriodEnd: string;
}

interface FacilityAndLoansProps {
  consultationId: string;
  currency?: string;
}

export const FacilityAndLoans = ({ consultationId, currency = "ZAR" }: FacilityAndLoansProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [loanModalFacility, setLoanModalFacility] = useState<FacilityItem | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const getFacilityData = (): FacilityItem[] => {
    switch (consultationId) {
      case "6008": // Apollo Syndication
        return [
          {
            facilityNumber: "#0000177260",
            name: "Senior Secured Term Loan",
            type: "TERM",
            description: "Senior Secured Facility for Apollo Energy Group",
            origination: "SYNDICATION",
            noOfLenders: 5,
            effectiveDate: "14 May 2023",
            expirationDate: "14 May 2033",
            amount: "USD 100,000,000.00",
            repaymentProfile: "Amortising - Semi-Annual",
            availabilityDate: "14 Nov 2023",
            agencyFee: "25,000.00",
            loan: {
              loanId: "LN-6008-001",
              principalBalance: "USD 60,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 May 2025",
              loanAmount: "USD 100,000,000.00",
              maturityDate: "14 May 2033",
              interestRatePeriod: "3 Months",
              currentPeriodEnd: "31 Jul 2025"
            }
          },
          {
            facilityNumber: "#0000177261",
            name: "Revolving Credit Facility",
            type: "REVOLVING",
            description: "Revolving General Corporate Purposes Commitment",
            origination: "SYNDICATION",
            noOfLenders: 3,
            effectiveDate: "14 May 2023",
            expirationDate: "14 May 2030",
            amount: "USD 50,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "14 May 2030",
            agencyFee: "10,000.00",
            loan: {
              loanId: "LN-6008-002",
              principalBalance: "USD 30,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 Apr 2025",
              loanAmount: "USD 50,000,000.00",
              maturityDate: "14 May 2030",
              interestRatePeriod: "1 Month",
              currentPeriodEnd: "30 Jun 2025"
            }
          }
        ];

      case "6009": // Project Horizon
        return [
          {
            facilityNumber: "#0000177262",
            name: "Project Term Loan",
            type: "TERM",
            description: "First Loss Project Term Loan Infrastructure Finance",
            origination: "SYNDICATION",
            noOfLenders: 4,
            effectiveDate: "16 May 2024",
            expirationDate: "16 May 2036",
            amount: "ZAR 600,000,000.00",
            repaymentProfile: "Amortising - Quarterly",
            availabilityDate: "16 May 2026",
            agencyFee: "50,000.00",
            loan: {
              loanId: "LN-6009-001",
              principalBalance: "ZAR 400,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 Apr 2025",
              loanAmount: "ZAR 600,000,000.00",
              maturityDate: "16 May 2036",
              interestRatePeriod: "3 Months",
              currentPeriodEnd: "30 Jun 2025"
            }
          },
          {
            facilityNumber: "#0000177263",
            name: "Debt Service Reserve Facility",
            type: "RESERVE",
            description: "Debt Service Reserve Liquidity Commitment",
            origination: "BILATERAL",
            noOfLenders: 1,
            effectiveDate: "16 May 2024",
            expirationDate: "16 May 2036",
            amount: "ZAR 200,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "16 May 2036",
            agencyFee: "0.00",
            loan: {
              loanId: "LN-6009-002",
              principalBalance: "ZAR 80,000,000.00",
              interestRateType: "Fixed",
              currentPeriodStart: "01 Jan 2025",
              loanAmount: "ZAR 200,000,000.00",
              maturityDate: "16 May 2036",
              interestRatePeriod: "12 Months",
              currentPeriodEnd: "31 Dec 2025"
            }
          }
        ];

      case "5001": // Beacon Finance
        return [
          {
            facilityNumber: "#0000177264",
            name: "Acquisition Term Loan",
            type: "TERM",
            description: "Acquisition Financing Term Commitment A",
            origination: "SYNDICATION",
            noOfLenders: 2,
            effectiveDate: "16 May 2023",
            expirationDate: "16 May 2029",
            amount: "ZAR 200,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "16 Nov 2023",
            agencyFee: "12,000.00",
            loan: {
              loanId: "LN-5001-001",
              principalBalance: "ZAR 150,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 Mar 2025",
              loanAmount: "ZAR 200,000,000.00",
              maturityDate: "16 May 2029",
              interestRatePeriod: "3 Months",
              currentPeriodEnd: "31 May 2025"
            }
          },
          {
            facilityNumber: "#0000177265",
            name: "Revolving Facility",
            type: "REVOLVING",
            description: "Revolving Corporate Commitments",
            origination: "BILATERAL",
            noOfLenders: 1,
            effectiveDate: "16 May 2023",
            expirationDate: "16 May 2028",
            amount: "ZAR 50,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "16 May 2028",
            agencyFee: "0.00",
            loan: {
              loanId: "LN-5001-002",
              principalBalance: "ZAR 25,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 May 2025",
              loanAmount: "ZAR 50,000,000.00",
              maturityDate: "16 May 2028",
              interestRatePeriod: "1 Month",
              currentPeriodEnd: "31 May 2025"
            }
          }
        ];

      case "6006": // GoodLock
      default:
        return [
          {
            facilityNumber: "#0000177257",
            name: "Term Loan A",
            type: "TERM",
            description: "First Loss Facility Corporate Sponsor A",
            origination: "SYNDICATION",
            noOfLenders: 3,
            effectiveDate: "15 May 2024",
            expirationDate: "15 May 2031",
            amount: "ZAR 300,000,000.00",
            repaymentProfile: "Amortising - Semi-Annual",
            availabilityDate: "15 Nov 2024",
            agencyFee: "15,000.00",
            loan: {
              loanId: "LN-6006-001",
              principalBalance: "ZAR 200,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 Apr 2025",
              loanAmount: "ZAR 300,000,000.00",
              maturityDate: "15 May 2031",
              interestRatePeriod: "3 Months",
              currentPeriodEnd: "30 Jun 2025"
            }
          },
          {
            facilityNumber: "#0000177258",
            name: "Revolving Credit Facility (RCF)",
            type: "REVOLVING",
            description: "Revolving Facility Corporate Commitment",
            origination: "BILATERAL",
            noOfLenders: 1,
            effectiveDate: "15 May 2024",
            expirationDate: "15 May 2029",
            amount: "ZAR 150,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "15 May 2029",
            agencyFee: "0.00",
            loan: {
              loanId: "LN-6006-002",
              principalBalance: "ZAR 100,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 May 2025",
              loanAmount: "ZAR 150,000,000.00",
              maturityDate: "15 May 2029",
              interestRatePeriod: "1 Month",
              currentPeriodEnd: "31 May 2025"
            }
          },
          {
            facilityNumber: "#0000177259",
            name: "Working Capital Facility",
            type: "WORKING CAPITAL",
            description: "Working Capital and Ancillary Drawdown Commitment",
            origination: "BILATERAL",
            noOfLenders: 1,
            effectiveDate: "15 May 2024",
            expirationDate: "15 May 2027",
            amount: "ZAR 50,000,000.00",
            repaymentProfile: "Bullet Repayment",
            availabilityDate: "15 May 2027",
            agencyFee: "0.00",
            loan: {
              loanId: "LN-6006-003",
              principalBalance: "ZAR 50,000,000.00",
              interestRateType: "Floating",
              currentPeriodStart: "01 May 2025",
              loanAmount: "ZAR 50,000,000.00",
              maturityDate: "15 May 2027",
              interestRatePeriod: "1 Month",
              currentPeriodEnd: "31 May 2025"
            }
          }
        ];
    }
  };

  const facilities = getFacilityData();

  return (
    <>
      <div className="space-y-6 text-left">
        <div className="bg-white border border-[#e2e8f0] rounded-[20px] overflow-hidden shadow-sm">

          {/* Section Header */}
          <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#fbfcfd] flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-slate-800 uppercase tracking-wider">Facility & Loan Structures</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
              {facilities.length} active facilities
            </span>
          </div>

          {/* Accordion List */}
          <div className="divide-y divide-[#e2e8f0]">
            {facilities.map((fac, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={idx} className="transition-all duration-200">

                  {/* Accordion Row Header */}
                  <div
                    onClick={() => toggleAccordion(idx)}
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors select-none"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:hidden">Facility Name</span>
                        <span className="text-[15px] font-bold text-slate-800">{fac.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:hidden">Facility Number</span>
                        <span className="text-[14px] font-semibold text-slate-500 font-mono">{fac.facilityNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block md:hidden">Facility Type</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {fac.type}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isOpen && (
                    <div className="bg-slate-50/60 border-t border-slate-100 px-6 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                        {/* Col 1 */}
                        <div className="md:col-span-3 space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACBS Facility Number</span>
                            <span className="text-[13px] font-bold text-slate-800 font-mono mt-0.5 block">{fac.facilityNumber}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facility Name</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.name}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facility Type</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.type}</span>
                          </div>
                        </div>

                        {/* Col 2 */}
                        <div className="md:col-span-3 space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                            <span className="text-[13px] font-medium text-slate-700 mt-0.5 block">{fac.description}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Origination</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.origination}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">No. of Lenders</span>
                            <span className="text-[13px] font-medium text-slate-700 mt-0.5 block">{fac.noOfLenders}</span>
                          </div>
                        </div>

                        {/* Col 3 */}
                        <div className="md:col-span-3 space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Effective Date</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.effectiveDate}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Expiration Date</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.expirationDate}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facility Amount</span>
                            <span className="text-[14px] font-bold text-blue-700 mt-0.5 block">{fac.amount}</span>
                          </div>
                        </div>

                        {/* Col 4 */}
                        <div className="md:col-span-3 space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Repayment Profile</span>
                            <span className="text-[13px] font-medium text-slate-700 mt-0.5 block">{fac.repaymentProfile}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Availability Date</span>
                            <span className="text-[13px] font-semibold text-slate-700 mt-0.5 block">{fac.availabilityDate}</span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Agency Fee</span>
                            <span className="text-[13px] font-medium text-slate-700 mt-0.5 block">{fac.agencyFee}</span>
                          </div>
                        </div>

                        {/* Action Links */}
                        <div className="md:col-span-12 border-t border-slate-100 pt-4 flex gap-6 justify-end">
                          {/* <span className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer">
                            View Details
                          </span> */}
                          <span
                            className="text-[13px] font-semibold text-blue-600 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLoanModalFacility(fac);
                            }}
                          >
                            Loan Info
                          </span>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ─── Loan Info Modal ─── */}
      {loanModalFacility && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setLoanModalFacility(null)}
        >
          <div
            className="bg-white rounded-[20px] shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#edf2f9]/70 px-6 py-5 border-b border-[#e0e3f5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-[#1a2256]">Loan Information</h2>
                  <p className="text-[12px] text-slate-400 font-medium">{loanModalFacility.facilityNumber} · {loanModalFacility.name}</p>
                </div>
              </div>
              <button
                onClick={() => setLoanModalFacility(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* ── Facility Details Section ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[12px] font-bold text-[#1a2256] uppercase tracking-widest">Facility Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 rounded-[14px] p-4 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ACBS Facility ID</span>
                    <span className="text-[14px] font-bold text-slate-800 font-mono mt-0.5 block">{loanModalFacility.facilityNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facility Name</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facility Amount</span>
                    <span className="text-[14px] font-bold text-blue-700 mt-0.5 block">{loanModalFacility.amount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facility Type</span>
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wider bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {loanModalFacility.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Loan Info Section ── */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[12px] font-bold text-[#1a2256] uppercase tracking-widest">Loan Info</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 rounded-[14px] p-4 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loan ID</span>
                    <span className="text-[14px] font-bold text-slate-800 font-mono mt-0.5 block">{loanModalFacility.loan.loanId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal Balance</span>
                    <span className="text-[14px] font-bold text-blue-700 mt-0.5 block">{loanModalFacility.loan.principalBalance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interest Rate Type</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.interestRateType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Interest Period Start Date</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.currentPeriodStart}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Loan Amount</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.loanAmount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maturity Date</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.maturityDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interest Rate Period</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.interestRatePeriod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Interest Period End Date</span>
                    <span className="text-[14px] font-semibold text-slate-700 mt-0.5 block">{loanModalFacility.loan.currentPeriodEnd}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
