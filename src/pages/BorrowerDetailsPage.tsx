import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User2, Mail, Briefcase, Phone, MapPin, Landmark, DollarSign, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BorrowerDetailsPage() {
  const { consultationId } = useParams<{ consultationId: string }>();
  const navigate = useNavigate();

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
      case '6006': // Orion Manufacturing
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

  const borrower = getBorrowerDetails();

  return (
    <div className="min-h-screen bg-[#f5f7fc] p-6 font-['Inter']">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Navigation Header */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-[20px] border border-[#e0e3f5] shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/ip-details/${consultationId}`)}
              className="h-10 w-10 rounded-xl border-[#e0e3f5] hover:bg-[#edf2f9] transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase">
                  Borrower Details
                </span>
                <span className="text-slate-300 font-light">|</span>
                <span className="text-[12px] font-medium text-slate-400">
                  Deal: {borrower.dealName} ({borrower.dealId})
                </span>
              </div>
              <h1 className="text-[20px] font-bold text-slate-800 mt-1">
                {borrower.companyName}
              </h1>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

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

        </div>

      </div>
    </div>
  );
}
